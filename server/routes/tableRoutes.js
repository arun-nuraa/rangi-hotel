const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// GET all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new table
router.post('/', async (req, res) => {
  const { number } = req.body;
  try {
    const cleanNumber = number.trim();
    const existingTable = await Table.findOne({ number: cleanNumber });
    if (existingTable) {
      return res.status(400).json({ message: 'Table already exists' });
    }
    const table = new Table({ number: cleanNumber, status: 'Vacant' });
    const saved = await table.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (update status/number)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Table not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a table
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Table.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Table not found' });
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
