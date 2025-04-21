const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all menu items (including unavailable ones)
router.get('/all', async (req, res) => {
  console.log('GET /api/menu-items/all route hit');
  try {
    const menuItems = await MenuItem.find({ isDeleted: false }).sort({ category: 1, name: 1 });
    console.log(`Found ${menuItems.length} menu items`);
    res.json(menuItems);
  } catch (error) {
    console.error('Error in /all route:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get available menu items only
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true, isDeleted: false }).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get deleted items
router.get('/deleted', async (req, res) => {
  console.log('GET /api/menu-items/deleted route hit');
  console.log('Query params:', req.query);
  try {
    const { dateFilter, startDate, endDate } = req.query;
    let query = { isDeleted: true };

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.deletedAt = { $gte: today, $lt: tomorrow };
    } else if (dateFilter === 'yesterday') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      query.deletedAt = { $gte: yesterday, $lt: today };
    } else if (dateFilter === 'custom' && startDate && endDate) {
      query.deletedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    console.log('MongoDB query:', query);
    const deletedItems = await MenuItem.find(query).sort({ deletedAt: -1 });
    console.log(`Found ${deletedItems.length} deleted items`);
    res.json(deletedItems);
  } catch (error) {
    console.error('Error in /deleted route:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new menu item (category or dish)
router.post('/', async (req, res) => {
  const menuItem = new MenuItem({
    category: req.body.category,
    name: req.body.name,
    price: req.body.price,
    isVeg: req.body.isVeg,
    isAvailable: true,
    isDeleted: false
  });

  try {
    const newMenuItem = await menuItem.save();
    res.status(201).json(newMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle availability
router.patch('/:id/toggle-availability', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    menuItem.isAvailable = !menuItem.isAvailable;
    const updatedMenuItem = await menuItem.save();
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update menu item
router.patch('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (req.body.category) menuItem.category = req.body.category;
    if (req.body.name) menuItem.name = req.body.name;
    if (req.body.price !== undefined) menuItem.price = req.body.price;
    if (req.body.isVeg !== undefined) menuItem.isVeg = req.body.isVeg;
    if (req.body.isAvailable !== undefined) menuItem.isAvailable = req.body.isAvailable;

    const updatedMenuItem = await menuItem.save();
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Soft delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.isDeleted = true;
    menuItem.deletedAt = new Date();
    await menuItem.save();
    
    res.json({ message: 'Menu item soft deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restore deleted item
router.patch('/:id/restore', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.isDeleted = false;
    menuItem.deletedAt = undefined;
    await menuItem.save();
    
    res.json({ message: 'Menu item restored' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 