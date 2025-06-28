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
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values but ensures uniqueness for non-null values
    trim: true,
    index: true // Add index for fast barcode lookups
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema); 