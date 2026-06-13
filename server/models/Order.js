const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ['Veg', 'Non-Veg'], required: true }
});

const OrderSchema = new mongoose.Schema({
  billNo: {
    type: String,
    required: true,
    unique: true
  },
  table: {
    type: String,
    required: true,
    default: 'Parcel'
  },
  type: {
    type: String,
    enum: ['Dine-in', 'Parcel'],
    required: true
  },
  customerName: {
    type: String,
    default: ''
  },
  items: [OrderItemSchema],
  discount: {
    type: Number,
    default: 0
  },
  packing: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  gst: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Hold', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
