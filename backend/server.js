const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const customerRoutes = require('./routes/customers');
const billItemRoutes = require('./routes/billItems');
const deletedBillRoutes = require('./routes/deletedBills');
const BillItem = require('./models/BillItem');
const Counter = require('./models/Counter');

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
  .then(async () => {
    console.log('Connected to MongoDB');
    // Initialize the counter
    await Counter.initialize();
    console.log('Counter initialized');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/bill-items', billItemRoutes);
app.use('/api/deleted-bills', deletedBillRoutes);

// Get the last bill item
app.get('/api/last-bill', async (req, res) => {
  console.log('Fetching last bill...');
  try {
    const lastBill = await BillItem.findOne().sort({ createdAt: -1 });
    console.log('Last bill found:', lastBill);
    
    if (!lastBill) {
      console.log('No bills found in database');
      return res.status(404).json({ message: 'No bills found' });
    }
    
    // Ensure the response matches the expected format
    const formattedBill = {
      items: lastBill.items,
      total: lastBill.total,
      timestamp: lastBill.createdAt
    };
    
    console.log('Sending formatted bill:', formattedBill);
    res.json(formattedBill);
  } catch (error) {
    console.error('Error fetching last bill:', error);
    res.status(500).json({ 
      message: 'Error fetching last bill',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
  console.log('- DELETE /api/bill-items/:id');
  console.log('- GET /api/last-bill');
}); 