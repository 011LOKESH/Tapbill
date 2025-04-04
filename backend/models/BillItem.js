const mongoose = require('mongoose');
const Counter = require('./Counter'); // Import the Counter model

const billItemSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
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
    default: Date.now
  }
});

// Pre-save hook to set the _id
billItemSchema.pre('save', async function(next) {
  if (this.isNew) {
    this._id = await Counter.getNextSequence();
  }
  next();
});

module.exports = mongoose.model('BillItem', billItemSchema); 