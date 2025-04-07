const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
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
    isAvailable: true
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

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await menuItem.deleteOne();
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 