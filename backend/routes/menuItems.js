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
  // Handle barcode properly - only set if provided and not empty
  const barcodeValue = req.body.barcode && req.body.barcode.trim() !== '' ? req.body.barcode.trim() : undefined;

  const menuItem = new MenuItem({
    category: req.body.category,
    name: req.body.name,
    price: req.body.price,
    isVeg: req.body.isVeg,
    isAvailable: true,
    isDeleted: false,
    ...(barcodeValue && { barcode: barcodeValue }) // Only include barcode field if value exists
  });

  try {
    const newMenuItem = await menuItem.save();
    res.status(201).json(newMenuItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists for another item' });
    }
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
    if (req.body.barcode !== undefined) {
      // Handle barcode properly - only set if provided and not empty, otherwise unset the field
      if (req.body.barcode && req.body.barcode.trim() !== '') {
        menuItem.barcode = req.body.barcode.trim();
      } else {
        menuItem.barcode = undefined; // This will remove the field from the document
      }
    }

    const updatedMenuItem = await menuItem.save();
    res.json(updatedMenuItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists for another item' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Clear all deleted items permanently
router.delete('/clearDeleted', async (req, res) => {
  try {
    const result = await MenuItem.deleteMany({ isDeleted: true });
    res.json({ 
      message: `${result.deletedCount} deleted items cleared permanently`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing deleted items:', error);
    res.status(500).json({ message: error.message });
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

// Barcode scanning endpoints

// Find menu item by barcode
router.get('/barcode/:barcode', async (req, res) => {
  console.log('GET /api/menu-items/barcode/:barcode route hit');
  console.log('Barcode:', req.params.barcode);
  try {
    const { barcode } = req.params;

    if (!barcode || barcode.trim() === '') {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    const menuItem = await MenuItem.findOne({
      barcode: barcode.trim(),
      isDeleted: false,
      isAvailable: true
    });

    if (!menuItem) {
      console.log('No menu item found for barcode:', barcode);
      return res.status(404).json({
        message: 'No menu item found for this barcode',
        barcode: barcode
      });
    }

    console.log('Found menu item:', menuItem.name);
    res.json({
      success: true,
      item: menuItem,
      message: `Found: ${menuItem.name}`
    });
  } catch (error) {
    console.error('Error in barcode lookup:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update barcode for menu item
router.patch('/:id/barcode', async (req, res) => {
  console.log('PATCH /api/menu-items/:id/barcode route hit');
  try {
    const { barcode } = req.body;
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Check if barcode already exists for another item
    if (barcode && barcode.trim() !== '') {
      const existingItem = await MenuItem.findOne({
        barcode: barcode.trim(),
        _id: { $ne: req.params.id },
        isDeleted: false
      });

      if (existingItem) {
        return res.status(400).json({
          message: `Barcode already assigned to: ${existingItem.name}`
        });
      }
    }

    menuItem.barcode = barcode && barcode.trim() !== '' ? barcode.trim() : null;
    const updatedMenuItem = await menuItem.save();

    console.log('Updated barcode for:', menuItem.name);
    res.json({
      success: true,
      item: updatedMenuItem,
      message: `Barcode updated for ${menuItem.name}`
    });
  } catch (error) {
    console.error('Error updating barcode:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists for another item' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Get all items with barcodes
router.get('/with-barcodes', async (req, res) => {
  console.log('GET /api/menu-items/with-barcodes route hit');
  try {
    const itemsWithBarcodes = await MenuItem.find({
      barcode: { $exists: true, $ne: null, $ne: '' },
      isDeleted: false
    }).sort({ category: 1, name: 1 });

    console.log(`Found ${itemsWithBarcodes.length} items with barcodes`);
    res.json(itemsWithBarcodes);
  } catch (error) {
    console.error('Error fetching items with barcodes:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;