const mongoose = require('mongoose');
const Counter = require('./Counter');

const shortBillCounterSchema = new mongoose.Schema({
  billNo: { type: Number, default: 1000 },
});
const ShortBillCounter = mongoose.model('ShortBillCounter', shortBillCounterSchema);

const billItemSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  billNo: {
    type: Number,
    required: true,
    unique: true,
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

// Helper to get next short bill number
async function getNextShortBillNo() {
  const counter = await ShortBillCounter.findOneAndUpdate({}, { $inc: { billNo: 1 } }, { new: true, upsert: true });
  return counter.billNo;
}

// Static method to create a new bill with auto-generated ID and short billNo
billItemSchema.statics.createBill = async function(billData) {
  try {
    // Get the next sequence number
    const nextId = await Counter.getNextSequence();
    const nextShortBillNo = await getNextShortBillNo();
    console.log('Generated new ID:', nextId, 'Short Bill No:', nextShortBillNo);

    // Create and save the bill with the generated ID and short billNo
    const bill = new this({
      _id: nextId,
      billNo: nextShortBillNo,
      ...billData
    });

    const savedBill = await bill.save();
    console.log('Bill saved successfully with ID:', savedBill._id, 'Short Bill No:', savedBill.billNo);
    return savedBill;
  } catch (error) {
    console.error('Error in createBill:', error);
    throw error;
  }
};

module.exports = mongoose.model('BillItem', billItemSchema); 