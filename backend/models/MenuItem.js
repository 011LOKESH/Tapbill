const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isVeg: {
    type: Boolean,
    required: true,
    default: true
  },
  isAvailable: {
    type: Boolean,
    required: true,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema); 