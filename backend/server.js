const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const BillItem = require('./models/BillItem');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tapbill')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
// Get all bill items
app.get('/api/bill-items', async (req, res) => {
  try {
    const items = await BillItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new bill item
app.post('/api/bill-items', async (req, res) => {
  try {
    const { name, price } = req.body;
    const existingItem = await BillItem.findOne({ name });
    
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.price;
      await existingItem.save();
      res.json(existingItem);
    } else {
      const newItem = new BillItem({
        name,
        price,
        quantity: 1,
        total: price
      });
      await newItem.save();
      res.status(201).json(newItem);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Clear all bill items
app.delete('/api/bill-items', async (req, res) => {
  try {
    await BillItem.deleteMany({});
    res.json({ message: 'All items cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 