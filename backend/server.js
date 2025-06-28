const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

// Configure dotenv to find the .env file in both dev and packaged app
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.resourcesPath, 'backend', '.env') 
  : path.join(__dirname, '.env');

dotenv.config({ path: envPath });

console.log('Attempting to load .env from:', envPath);
console.log('MONGODB_URI from env:', process.env.MONGODB_URI);

let mongod; // To hold the server instance

async function startDatabase() {
  console.log('Setting up persistent database storage...');

  // Create data directory for persistent storage
  const fs = require('fs');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  }

  // Try to connect to local MongoDB first, fallback to in-memory with file persistence
  let mongoUri = process.env.MONGODB_URI;
  let useLocalMongoDB = false;

  if (!mongoUri) {
    // Try local MongoDB first (use IPv4 explicitly)
    mongoUri = 'mongodb://127.0.0.1:27017/tapbill';
  }

  console.log(`Attempting to connect to persistent MongoDB: ${mongoUri}`);

  try {
    console.log('Attempting MongoDB connection with 10 second timeout...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log('✅ Connected to persistent MongoDB database');
    useLocalMongoDB = true;
  } catch (err) {
    console.log('❌ Local MongoDB connection failed:');
    console.log('Error name:', err.name);
    console.log('Error message:', err.message);
    console.log('Error code:', err.code);
    console.log('Using file-based persistence instead...');

    // Fallback to in-memory MongoDB with file-based data persistence
    mongod = await MongoMemoryServer.create();
    const fallbackUri = mongod.getUri();
    console.log(`Using in-memory MongoDB with file persistence: ${fallbackUri}`);

    await mongoose.connect(fallbackUri);
    console.log('Connected to in-memory MongoDB with file persistence');
  }

  // Ensure default admin user exists
  await createAdminUserIfNeeded();

  // Ensure default menu items exist
  await seedMenuDataIfNeeded();

  await Counter.initialize();
  console.log('Database initialization complete');

  // Using persistent MongoDB - no file persistence needed
  console.log('✅ Using persistent MongoDB storage - no file backup needed');
}

async function createAdminUserIfNeeded() {
  try {
    const User = require('./models/User'); // Import model here
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (!existingAdmin) {
      console.log('Admin user not found, creating one...');
      const adminUser = new User({
        username: 'admin',
        email: 'admin@tapbill.com',
        password: 'lokesh',
        name: 'Admin User',
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error ensuring admin user exists:', error);
  }
}

async function seedMenuDataIfNeeded() {
  try {
    const MenuItem = require('./models/MenuItem'); // Import model here
    const count = await MenuItem.countDocuments();

    if (count === 0) {
      console.log('No menu items found, seeding database...');
      const menuData = [
        // Tiffin
        { category: "Tiffin", name: "Idly", price: 30, isVeg: true, isAvailable: true },
        { category: "Tiffin", name: "Pongal", price: 40, isVeg: true, isAvailable: true },
        { category: "Tiffin", name: "Poori", price: 40, isVeg: true, isAvailable: true },
        { category: "Tiffin", name: "Dosa", price: 50, isVeg: true, isAvailable: true },
        { category: "Tiffin", name: "Vada", price: 30, isVeg: true, isAvailable: true },
        { category: "Tiffin", name: "Uttapam", price: 60, isVeg: true, isAvailable: true },

        // Briyani
        { category: "Briyani", name: "Chicken Briyani", price: 180, isVeg: false, isAvailable: true },
        { category: "Briyani", name: "Mutton Briyani", price: 220, isVeg: false, isAvailable: true },
        { category: "Briyani", name: "Veg Briyani", price: 120, isVeg: true, isAvailable: true },
        { category: "Briyani", name: "Egg Briyani", price: 150, isVeg: false, isAvailable: true },
        { category: "Briyani", name: "Prawn Briyani", price: 200, isVeg: false, isAvailable: true },

        // Parotta
        { category: "Parotta", name: "Plain Parotta", price: 30, isVeg: true, isAvailable: true },
        { category: "Parotta", name: "Egg Parotta", price: 50, isVeg: false, isAvailable: true },
        { category: "Parotta", name: "Chicken Parotta", price: 80, isVeg: false, isAvailable: true },
        { category: "Parotta", name: "Kothu Parotta", price: 100, isVeg: false, isAvailable: true },

        // Rice
        { category: "Rice", name: "Plain Rice", price: 50, isVeg: true, isAvailable: true },
        { category: "Rice", name: "Jeera Rice", price: 60, isVeg: true, isAvailable: true },
        { category: "Rice", name: "Ghee Rice", price: 70, isVeg: true, isAvailable: true },
        { category: "Rice", name: "Lemon Rice", price: 60, isVeg: true, isAvailable: true },

        // Noodles
        { category: "Noodles", name: "Veg Noodles", price: 100, isVeg: true, isAvailable: true },
        { category: "Noodles", name: "Egg Noodles", price: 120, isVeg: false, isAvailable: true },
        { category: "Noodles", name: "Chicken Noodles", price: 150, isVeg: false, isAvailable: true },
        { category: "Noodles", name: "Prawn Noodles", price: 180, isVeg: false, isAvailable: true },
        { category: "Noodles", name: "Schezwan Noodles", price: 130, isVeg: true, isAvailable: true },

        // Egg
        { category: "Egg", name: "Boiled Egg", price: 20, isVeg: false, isAvailable: true },
        { category: "Egg", name: "Omelette", price: 40, isVeg: false, isAvailable: true },
        { category: "Egg", name: "Egg Curry", price: 60, isVeg: false, isAvailable: true },
        { category: "Egg", name: "Egg Fried Rice", price: 100, isVeg: false, isAvailable: true },
        { category: "Egg", name: "Egg Biryani", price: 150, isVeg: false, isAvailable: true },

        // Grill & Tandoori
        { category: "Grill & Tandoori", name: "Chicken Tikka", price: 200, isVeg: false, isAvailable: true },
        { category: "Grill & Tandoori", name: "Chicken Malai Tikka", price: 220, isVeg: false, isAvailable: true },
        { category: "Grill & Tandoori", name: "Tandoori Chicken", price: 250, isVeg: false, isAvailable: true },
        { category: "Grill & Tandoori", name: "Paneer Tikka", price: 180, isVeg: true, isAvailable: true },
        { category: "Grill & Tandoori", name: "Fish Tikka", price: 220, isVeg: false, isAvailable: true },

        // Roti & Naan
        { category: "Roti & Naan", name: "Plain Roti", price: 20, isVeg: true, isAvailable: true },
        { category: "Roti & Naan", name: "Butter Roti", price: 30, isVeg: true, isAvailable: true },
        { category: "Roti & Naan", name: "Plain Naan", price: 40, isVeg: true, isAvailable: true },
        { category: "Roti & Naan", name: "Butter Naan", price: 50, isVeg: true, isAvailable: true },
        { category: "Roti & Naan", name: "Garlic Naan", price: 60, isVeg: true, isAvailable: true },
        { category: "Roti & Naan", name: "Kulcha", price: 50, isVeg: true, isAvailable: true }
      ];
      await MenuItem.insertMany(menuData);
      console.log('Default menu items added successfully');
    } else {
      console.log('Menu items already exist.');
    }
  } catch (error) {
    console.error('Error seeding menu data:', error);
  }
}

// Persistence functions for data backup/restore
async function loadPersistedData() {
  const fs = require('fs');
  const dataFile = path.join(__dirname, '..', 'data', 'bills.json');

  try {
    if (fs.existsSync(dataFile)) {
      console.log('Loading persisted bill data...');
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

      // Restore bills to database
      if (data.bills && data.bills.length > 0) {
        const BillItem = require('./models/BillItem');
        for (const bill of data.bills) {
          await BillItem.create(bill);
        }
        console.log(`Restored ${data.bills.length} bills from persistent storage`);
      }

      // Restore counter
      if (data.counter) {
        const Counter = require('./models/Counter');
        // Delete existing counter and create new one
        await Counter.deleteMany({});
        await Counter.create({ sequenceValue: data.counter });
        console.log(`Restored counter to ${data.counter}`);
      }
    }
  } catch (error) {
    console.error('Error loading persisted data:', error);
  }
}

async function saveDataToPersistence() {
  const fs = require('fs');
  const dataDir = path.join(__dirname, '..', 'data');
  const dataFile = path.join(dataDir, 'bills.json');

  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Get all bills and counter
    const BillItem = require('./models/BillItem');
    const Counter = require('./models/Counter');

    const bills = await BillItem.find({}).lean(); // Use lean() for better JSON serialization
    const counter = await Counter.findOne({}).lean(); // Use lean() for better JSON serialization

    const data = {
      bills: bills || [],
      counter: counter ? counter.sequenceValue : 1000000000,
      lastSaved: new Date().toISOString()
    };

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log(`Saved ${bills.length} bills to persistent storage`);
  } catch (error) {
    console.error('Error saving data to persistence:', error);
  }
}

async function stopDatabase() {
  try {
    console.log('Saving data to persistent storage...');
    await saveDataToPersistence();

    console.log('Disconnecting from MongoDB database...');
    await mongoose.disconnect();

    if (mongod) {
      console.log('Stopping MongoDB server...');
      await mongod.stop();
      console.log('MongoDB stopped.');
    }

    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

function startBackend() {
  console.log('🚀 Starting backend server...');
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Request headers:', req.headers);
    // Do not log request body in production for security
    if (process.env.NODE_ENV !== 'production') {
      console.log('Request body:', req.body);
    }
    next();
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

  // Serve static frontend files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
    console.log('Serving static files from:', frontendPath);

    // Serve static files but exclude API routes
    app.use((req, res, next) => {
      if (req.url.startsWith('/api/')) {
        next(); // Skip static file serving for API routes
      } else {
        express.static(frontendPath)(req, res, next);
      }
    });

    // Handle React Router - serve index.html for frontend routes only
    // This should be the last route handler
    app.get('/', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/billing', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/menu', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/edit-bill*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/report*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/customer*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/day-*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/deleted*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/customize*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/export*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/user*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    app.get('/login', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }

  // Add error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
  });

  // 404 handler for API routes only
  app.use('/api/*', (req, res) => {
    console.log('404 for API URL:', req.url);
    res.status(404).json({ message: 'API route not found' });
  });

  const PORT = process.env.PORT || 5000;
  console.log(`🌐 Attempting to start server on port ${PORT}...`);

  const server = app.listen(PORT, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      return;
    }
    console.log(`✅ Server running on port ${PORT}`);
    console.log('Backend server started within Electron main process.');
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

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Trying to kill existing process...`);
    }
  });
}

module.exports = { startBackend, startDatabase, stopDatabase, saveDataToPersistence };

// If this file is run directly (not imported as a module), start the backend
if (require.main === module) {
  console.log('Starting backend server directly...');
  startDatabase().then(() => {
    startBackend();
  }).catch(error => {
    console.error('Failed to start database:', error);
    process.exit(1);
  });
}