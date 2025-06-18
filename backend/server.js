const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const customerRoutes = require('./routes/customers');
const billItemRoutes = require('./routes/billItems');
const deletedBillRoutes = require('./routes/deletedBills');
const menuItemRoutes = require('./routes/menuItems');
const authRoutes = require('./routes/auth');
const BillItem = require('./models/BillItem');
const Counter = require('./models/Counter');
const exportRoutes = require('./routes/export');
const jwt = require('jsonwebtoken');
const userDetailsRouter = require('./routes/userDetails');

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
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/tapbill');
    console.error('Please ensure MongoDB is running and accessible at the specified URI');
  });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/bill-items', authenticateToken, billItemRoutes);
app.use('/api/deleted-bills', authenticateToken, deletedBillRoutes);
app.use('/api/menu-items', authenticateToken, menuItemRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/user-details', authenticateToken, userDetailsRouter);

// Get the last bill item
app.get('/api/last-bill', authenticateToken, async (req, res) => {
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
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/register');
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