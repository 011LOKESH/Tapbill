const mongoose = require('mongoose');

const deletedBillSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  billNo: {
    type: String,
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    default: 'Cash'
  }
});

module.exports = mongoose.model('DeletedBill', deletedBillSchema); 