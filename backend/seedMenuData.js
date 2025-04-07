const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

const menuData = [
  // Tiffin Items
  {
    category: 'Tiffin',
    name: 'Idly',
    price: 10,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Tiffin',
    name: 'Pongal',
    price: 20,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Tiffin',
    name: 'Poori',
    price: 20,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Tiffin',
    name: 'Chola Poori',
    price: 40,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Tiffin',
    name: 'Uthapam',
    price: 15,
    isVeg: true,
    isAvailable: true
  },

  // Briyani Items
  {
    category: 'Briyani',
    name: 'Chicken Briyani',
    price: 120,
    isVeg: false,
    isAvailable: true
  },
  {
    category: 'Briyani',
    name: 'Mutton Briyani',
    price: 150,
    isVeg: false,
    isAvailable: true
  },
  {
    category: 'Briyani',
    name: 'Egg Briyani',
    price: 100,
    isVeg: false,
    isAvailable: true
  },
  {
    category: 'Briyani',
    name: 'Veg Briyani',
    price: 80,
    isVeg: true,
    isAvailable: true
  },

  // Parotta Items
  {
    category: 'Parotta',
    name: 'Plain Parotta',
    price: 15,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Parotta',
    name: 'Egg Parotta',
    price: 30,
    isVeg: false,
    isAvailable: true
  },
  {
    category: 'Parotta',
    name: 'Chicken Parotta',
    price: 40,
    isVeg: false,
    isAvailable: true
  },
  {
    category: 'Parotta',
    name: 'Mutton Parotta',
    price: 50,
    isVeg: false,
    isAvailable: true
  },

  // Rice Items
  {
    category: 'Rice',
    name: 'Plain Rice',
    price: 20,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Rice',
    name: 'Jeera Rice',
    price: 30,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Rice',
    name: 'Lemon Rice',
    price: 40,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Rice',
    name: 'Tomato Rice',
    price: 40,
    isVeg: true,
    isAvailable: true
  },
  {
    category: 'Rice',
    name: 'Curd Rice',
    price: 30,
    isVeg: true,
    isAvailable: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/tapbill', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing menu items
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    // Insert new menu items
    await MenuItem.insertMany(menuData);
    console.log('Added default menu items successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 