const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  sequenceValue: {
    type: Number,
    default: 1000000000, // Starting value for your IDs
  },
});

counterSchema.statics.getNextSequence = async function() {
  try {
    console.log('Getting next sequence value...');
    const counter = await this.findOneAndUpdate(
      {},
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    
    if (!counter) {
      console.error('Failed to get or create counter document');
      throw new Error('Failed to generate sequence number');
    }
    
    console.log('Next sequence value:', counter.sequenceValue);
    return counter.sequenceValue;
  } catch (error) {
    console.error('Error getting next sequence:', error);
    throw error;
  }
};

// Ensure the counter document exists on startup
counterSchema.statics.initialize = async function() {
  try {
    const counter = await this.findOne();
    if (!counter) {
      console.log('Creating initial counter document');
      await this.create({});
    }
  } catch (error) {
    console.error('Error initializing counter:', error);
  }
};

module.exports = mongoose.model('Counter', counterSchema);