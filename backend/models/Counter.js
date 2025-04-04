const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  sequenceValue: {
    type: Number,
    default: 1000000000, // Starting value for your IDs
  },
});

counterSchema.statics.getNextSequence = async function() {
  const counter = await this.findOneAndUpdate(
    {},
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
};

module.exports = mongoose.model('Counter', counterSchema); 