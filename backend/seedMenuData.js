const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

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