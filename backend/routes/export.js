const express = require('express');
const router = express.Router();
const BillItem = require('../models/BillItem');
const DeletedBill = require('../models/DeletedBill');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');

// Helper function to format data for Excel
const formatDataForExcel = (data) => {
  if (!data || data.length === 0) return [];
  
  // Get all unique keys from the data
  const keys = [...new Set(data.flatMap(item => Object.keys(item)))];
  
  // Create header row
  const headerRow = keys.map(key => key.charAt(0).toUpperCase() + key.slice(1));
  
  // Create data rows
  const dataRows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      return value;
    })
  );
  
  return [headerRow, ...dataRows];
};

// Export day summary
router.post('/daySummary', async (req, res) => {
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

    const bills = await BillItem.find(query);
    const summary = bills.map(bill => ({
      'Bill No': bill.billNo,
      'Date': bill.createdAt,
      'Total Amount': bill.total,
      'Payment Mode': bill.paymentMode,
      'Items Count': bill.items.length,
      'Tax': bill.total * 0.1
    }));

    res.json(summary);
  } catch (error) {
    console.error('Error exporting day summary:', error);
    res.status(500).json({ error: 'Failed to export day summary' });
  }
});

// Export bill sales
router.post('/billSales', async (req, res) => {
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

    const bills = await BillItem.find(query);
    const sales = bills.map(bill => ({
      'Bill No': bill.billNo,
      'Date': bill.createdAt,
      'Total Amount': bill.total,
      'Payment Mode': bill.paymentMode,
      'Items': bill.items.map(item => item.name).join(', '),
      'Tax': bill.total * 0.1
    }));

    res.json(sales);
  } catch (error) {
    console.error('Error exporting bill sales:', error);
    res.status(500).json({ error: 'Failed to export bill sales' });
  }
});

// Export deleted items
router.post('/deletedItems', async (req, res) => {
  try {
    const { dateRange, dateType } = req.body;
    let query = {};

    if (dateType === 'custom' && dateRange) {
      const startDate = new Date(`${dateRange.startDate}T${dateRange.startTime}`);
      const endDate = new Date(`${dateRange.endDate}T${dateRange.endTime}`);
      query.deletedAt = { $gte: startDate, $lte: endDate };
    } else if (dateType === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.deletedAt = { $gte: today, $lt: tomorrow };
    } else if (dateType === 'yesterday') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      query.deletedAt = { $gte: yesterday, $lt: today };
    }

    const deletedItems = await MenuItem.find({ isDeleted: true, ...query });
    const formattedItems = deletedItems.map(item => ({
      'Item Name': item.name,
      'Category': item.category,
      'Price': item.price,
      'Deleted At': item.deletedAt,
      'Reason': item.deletionReason || 'Not specified'
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Error exporting deleted items:', error);
    res.status(500).json({ error: 'Failed to export deleted items' });
  }
});

// Export deleted bills
router.post('/deletedBill', async (req, res) => {
  try {
    const { dateRange, dateType } = req.body;
    let query = {};

    if (dateType === 'custom' && dateRange) {
      const startDate = new Date(`${dateRange.startDate}T${dateRange.startTime}`);
      const endDate = new Date(`${dateRange.endDate}T${dateRange.endTime}`);
      query.deletedAt = { $gte: startDate, $lte: endDate };
    } else if (dateType === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.deletedAt = { $gte: today, $lt: tomorrow };
    } else if (dateType === 'yesterday') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      query.deletedAt = { $gte: yesterday, $lt: today };
    }

    const deletedBills = await DeletedBill.find(query);
    const formattedBills = deletedBills.map(bill => ({
      'Bill No': bill.billNo,
      'Original Date': bill.createdAt,
      'Deleted At': bill.deletedAt,
      'Total Amount': bill.total,
      'Payment Mode': bill.paymentMode,
      'Items': bill.items.map(item => item.name).join(', '),
      'Tax': bill.total * 0.1
    }));

    res.json(formattedBills);
  } catch (error) {
    console.error('Error exporting deleted bills:', error);
    res.status(500).json({ error: 'Failed to export deleted bills' });
  }
});

// Get database storage information
router.get('/storageInfo', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    let totalStorageBytes = 0;

    // Calculate total storage from all collections
    for (const collection of collections) {
      const stats = await db.collection(collection.name).stats();
      totalStorageBytes += stats.storageSize || 0;
    }
    
    // Convert to KB and MB with precision
    const totalSizeKB = totalStorageBytes / 1024;
    const totalSizeMB = totalSizeKB / 1024;
    const storageLimit = 100; // MB
    
    const storageInfo = {
      used: Math.round((totalSizeMB / storageLimit) * 100),
      free: Math.round(100 - (totalSizeMB / storageLimit) * 100),
      totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
      totalSizeKB: parseFloat(totalSizeKB.toFixed(2)),
      storageLimit: storageLimit
    };

    res.json(storageInfo);
  } catch (error) {
    console.error('Error fetching storage info:', error);
    res.status(500).json({ error: 'Failed to fetch storage information' });
  }
});

module.exports = router; 