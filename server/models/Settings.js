const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  restaurantName: {
    type: String,
    default: 'Naidu Hotel'
  },
  address: {
    type: String,
    default: '123 Main Street, Bangalore'
  },
  phone: {
    type: String,
    default: '+91 9876543210'
  },
  footerMessage: {
    type: String,
    default: 'Thank you! Visit again.'
  },
  defaultPackingCharge: {
    type: Number,
    default: 10
  },
  gstPercentage: {
    type: Number,
    default: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
