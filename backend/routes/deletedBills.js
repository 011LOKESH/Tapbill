const express = require('express');
const router = express.Router();
const DeletedBill = require('../models/DeletedBill');

// Get all deleted bills
router.get('/', async (req, res) => {
  try {
    const bills = await DeletedBill.find().sort({ deletedAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 