const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const BillItem = require('./models/BillItem');
const customerRoutes = require('./routes/customers');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

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
  console.log('Received request to save bill:', req.body);
  try {
    const { items, total } = req.body; // Ensure this matches your data structure
    const newBill = new BillItem({
      items, // Ensure this matches your BillItem model
      total,
      createdAt: new Date(),
    });
    await newBill.save();
    res.status(201).json(newBill);
  } catch (error) {
    console.error('Error saving bill:', error);
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

// Debug middleware for customer routes
app.use('/api/customers', (req, res, next) => {
  console.log('Customer route hit:', req.method, req.url);
  next();
}, customerRoutes);

// Get the last bill item
app.get('/api/last-bill', async (req, res) => {
  console.log('Fetching last bill...'); // Log when this route is hit
  try {
    const lastBill = await BillItem.findOne().sort({ createdAt: -1 }); // Get the most recent bill
    if (!lastBill) {
      return res.status(404).json({ message: 'No bills found' });
    }
    res.json(lastBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log('404 for URL:', req.url);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- POST /api/customers');
  console.log('- GET /api/customers');
  console.log('- PATCH /api/customers/:id');
  console.log('- DELETE /api/customers/:id');
  console.log('- GET /api/bill-items');
  console.log('- POST /api/bill-items');
  console.log('- DELETE /api/bill-items');
  console.log('- GET /api/last-bill'); // Log available routes
}); 