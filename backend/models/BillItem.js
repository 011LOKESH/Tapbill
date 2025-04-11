const mongoose = require('mongoose');
const Counter = require('./Counter');

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

// Static method to create a new bill with auto-generated ID
billItemSchema.statics.createBill = async function(billData) {
  try {
    // Get the next sequence number
    const nextId = await Counter.getNextSequence();
    console.log('Generated new ID:', nextId);

    // Create and save the bill with the generated ID
    const bill = new this({
      _id: nextId,
      ...billData
    });

    const savedBill = await bill.save();
    console.log('Bill saved successfully with ID:', savedBill._id);
    return savedBill;
  } catch (error) {
    console.error('Error in createBill:', error);
    throw error;
  }
};

module.exports = mongoose.model('BillItem', billItemSchema); 