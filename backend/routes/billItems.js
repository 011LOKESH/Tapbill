const express = require('express');
const router = express.Router();
const BillItem = require('../models/BillItem');
const DeletedBill = require('../models/DeletedBill');

// Get all bill items
router.get('/', async (req, res) => {
  console.log('GET /api/bill-items - Fetching all bill items');
  try {
    const items = await BillItem.find().sort({ createdAt: -1 });
    console.log(`Found ${items.length} bill items`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching bill items:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new bill item
router.post('/', async (req, res) => {
  console.log('Received request to save bill:', JSON.stringify(req.body, null, 2));
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and must not be empty' });
    }

    if (typeof total !== 'number') {
      return res.status(400).json({ message: 'Total must be a number' });
    }

    console.log('Creating new bill with data:', {
      items,
      total,
      createdAt: new Date()
    });

    const newBill = await BillItem.createBill({
      items,
      total,
      createdAt: new Date()
    });

    console.log('Bill saved successfully:', JSON.stringify(newBill, null, 2));

    // Verify the bill was actually saved to database
    const verifyBill = await BillItem.findById(newBill._id);
    if (verifyBill) {
      console.log('✅ VERIFICATION: Bill successfully persisted to MongoDB with ID:', verifyBill._id);
    } else {
      console.error('❌ VERIFICATION FAILED: Bill not found in database after save');
    }

    res.status(201).json(newBill);
  } catch (error) {
    console.error('Error saving bill:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: 'Error saving bill',
      error: error.message
    });
  }
});

// Update bill item quantity
router.patch('/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const bill = await BillItem.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Update quantity logic would go here
    // For now, just return the bill as-is since the current system
    // seems to work with individual bill items rather than updating existing ones
    res.json(bill);
  } catch (error) {
    console.error('Error updating bill item:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete bills by date range
router.delete('/deleteByDateRange', async (req, res) => {
  try {
    const { dateRange, dateType } = req.body;
    let query = {};

    if (dateType === 'custom' && dateRange) {
      const startDate = new Date(`${dateRange.startDate}T${dateRange.startTime}`);
      const endDate = new Date(`${dateRange.endDate}T${dateRange.endTime}`);
      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (dateType === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.createdAt = { $gte: today, $lt: tomorrow };
    } else if (dateType === 'yesterday') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      query.createdAt = { $gte: yesterday, $lt: today };
    }

    // Find bills to delete
    const billsToDelete = await BillItem.find(query);
    
    // Move bills to deleted bills collection
    for (const bill of billsToDelete) {
      const deletedBill = new DeletedBill({
        _id: bill._id,
        billNo: bill.billNo,
        items: bill.items,
        total: bill.total,
        createdAt: bill.createdAt,
        paymentMode: bill.paymentMode || 'Cash'
      });
      await deletedBill.save();
    }

    // Delete the original bills
    const result = await BillItem.deleteMany(query);
    
    res.json({ 
      message: `${result.deletedCount} bills moved to deleted bills`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting bills by date range:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a specific bill item
router.delete('/:id', async (req, res) => {
  try {
    const bill = await BillItem.findById(req.params.id);
    if (bill) {
      // Create a new deleted bill document
      const deletedBill = new DeletedBill({
        _id: bill._id,
        billNo: bill.billNo, // Use the actual billNo instead of _id
        items: bill.items,
        total: bill.total,
        createdAt: bill.createdAt,
        paymentMode: bill.paymentMode || 'Cash'
      });

      // Save the deleted bill
      await deletedBill.save();

      // Delete the original bill
      await bill.deleteOne();
      
      res.json({ message: 'Bill moved to deleted bills' });
    } else {
      res.status(404).json({ message: 'Bill not found' });
    }
  } catch (error) {
    console.error('Error in soft delete:', error);
    res.status(500).json({ message: error.message });
  }
});

// Clear all bill items
router.delete('/', async (req, res) => {
  try {
    await BillItem.deleteMany({});
    res.json({ message: 'All items cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;