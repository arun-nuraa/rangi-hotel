const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

// GET /backup/export - Download full database state as JSON
router.get('/export', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    const tables = await Table.find();
    const orders = await Order.find();
    const settings = await Settings.find();

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date(),
      menuItems,
      tables,
      orders,
      settings
    };

    res.json(backupData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /backup/restore - Replace current collections with values from backup
router.post('/restore', async (req, res) => {
  const { menuItems, tables, orders, settings } = req.body;

  if (!menuItems || !tables || !orders) {
    return res.status(400).json({ message: 'Invalid backup format. Missing collections.' });
  }

  try {
    // 1. Clear database
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    await Order.deleteMany({});
    await Settings.deleteMany({});

    // 2. Insert items if they exist
    if (menuItems.length > 0) {
      await MenuItem.insertMany(menuItems);
    }
    if (tables.length > 0) {
      await Table.insertMany(tables);
    }
    if (orders.length > 0) {
      await Order.insertMany(orders);
    }
    if (settings && settings.length > 0) {
      await Settings.insertMany(settings);
    } else if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      await Settings.create(settings);
    }

    res.json({ message: 'Database restored successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
