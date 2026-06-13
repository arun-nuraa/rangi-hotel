const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET settings (always return one global object)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = new Settings({ key: 'global' });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST/PUT settings
router.post('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = new Settings({ key: 'global', ...req.body });
    } else {
      Object.assign(settings, req.body);
    }
    const saved = await settings.save();
    res.json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
