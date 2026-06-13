const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Vacant', 'Occupied'],
    default: 'Vacant'
  }
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);
