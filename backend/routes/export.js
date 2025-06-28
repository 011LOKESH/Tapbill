const express = require('express');
const router = express.Router();
const BillItem = require('../models/BillItem');
const DeletedBill = require('../models/DeletedBill');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const { format } = require('date-fns');

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

    if (dateType === 'custom' && dateRange && dateRange.startDate && dateRange.endDate) {
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
    } else {
      // Default case: if no dateType is specified, get all bills
      // This can be adjusted based on desired default behavior
    }

    const bills = await BillItem.find(query);

    const salesByDate = bills.reduce((acc, bill) => {
      const date = format(new Date(bill.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { 'Date': date, 'Number of Bills': 0, 'Tax': 0, 'Total Sales': 0 };
      }
      acc[date]['Number of Bills'] += 1;
      acc[date]['Tax'] += bill.total * 0.1; // Assuming 10% tax
      acc[date]['Total Sales'] += bill.total;
      return acc;
    }, {});

    const sales = Object.values(salesByDate);
    
    res.json(sales);

  } catch (error) {
    console.error('Error exporting day summary:', error);
    // Ensure we haven't sent headers yet
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Error generating export file',
        error: error.message 
      });
    }
  }
});

// Export bill sales
router.post('/billSales', async (req, res) => {
  try {
    const { dateRange, dateType } = req.body;
    let query = {};

    if (dateType === 'custom' && dateRange && dateRange.startDate && dateRange.endDate) {
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
      'Payment Mode': bill.paymentMode,
      'Items': bill.items.map(item => item.name).join(', '),
      'Tax': bill.total * 0.1,
      'Total Amount': bill.total
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
    const { items, type, startDate, endDate } = req.body;

    // Early validation of input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No items provided for export' 
      });
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tapbill';
    workbook.lastModifiedBy = 'Tapbill';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('Deleted Items');

    // Add headers with styling
    worksheet.columns = [
      { header: 'Item Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Deleted At', key: 'deletedAt', width: 25 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data with validation
    let rowsAdded = 0;
    items.forEach(item => {
      if (item && item.name && item.category && item.price !== undefined && item.deletedAt) {
        try {
          const deletedDate = new Date(item.deletedAt);
          if (isNaN(deletedDate.getTime())) {
            console.warn(`Invalid date for item ${item.name}: ${item.deletedAt}`);
            return; // Skip this item
          }

          worksheet.addRow({
            name: item.name,
            category: item.category,
            price: item.price,
            deletedAt: format(deletedDate, 'yyyy-MM-dd HH:mm:ss')
          });
          rowsAdded++;
        } catch (err) {
          console.warn(`Error processing item ${item.name}:`, err);
          // Continue with next item
        }
      }
    });

    // Check if any valid rows were added
    if (rowsAdded === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid items to export' 
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.min(
        Math.max(
          column.width || 10,
          ...worksheet.getColumn(column.key).values
            .filter(value => value)
            .map(value => value.toString().length)
        ),
        50 // Maximum width
      );
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=deleted_items_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    // Send the file
    return res.send(buffer);

  } catch (error) {
    console.error('Error exporting deleted items:', error);
    // Ensure we haven't sent headers yet
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Error generating export file',
        error: error.message 
      });
    }
  }
});

// Export deleted bills
router.post('/deletedBills', async (req, res) => {
  try {
    const { bills, type, startDate, endDate } = req.body;

    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No bills provided for export' 
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Deleted Bills');

    worksheet.columns = [
      { header: 'Bill No', key: 'billNo', width: 15 },
      { header: 'Date & Time', key: 'dateTime', width: 25 },
      { header: 'Payment Mode', key: 'paymentMode', width: 20 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Net Amount', key: 'netAmount', width: 15, style: { numFmt: '₹#,##0.00' } },
      { header: 'Deleted At', key: 'deletedAt', width: 25 }
    ];

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    bills.forEach(bill => {
      worksheet.addRow({
        billNo: bill.billNo,
        dateTime: format(new Date(bill.dateTime), 'yyyy-MM-dd HH:mm:ss'),
        paymentMode: bill.paymentMode,
        qty: bill.qty,
        netAmount: bill.netAmount,
        deletedAt: format(new Date(bill.deletedAt), 'yyyy-MM-dd HH:mm:ss')
      });
    });

    worksheet.columns.forEach(column => {
      column.width = Math.min(
        Math.max(
          column.width || 10,
          ...worksheet.getColumn(column.key).values
            .filter(value => value)
            .map(value => value.toString().length)
        ),
        50
      );
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=deleted_bills_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    return res.send(buffer);

  } catch (error) {
    console.error('Error exporting deleted bills:', error);
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false,
        message: 'Error generating export file',
        error: error.message 
      });
    }
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
      try {
        const stats = await db.collection(collection.name).stats();
        totalStorageBytes += stats.storageSize || 0;
      } catch (error) {
        console.warn(`Could not get stats for collection ${collection.name}:`, error);
        // If we can't get stats, estimate based on document count
        const count = await db.collection(collection.name).countDocuments();
        totalStorageBytes += count * 1024; // Estimate 1KB per document
      }
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
    // Return default values if we can't get the actual storage info
    res.json({
      used: 0,
      free: 100,
      totalSizeMB: 0,
      totalSizeKB: 0,
      storageLimit: 100
    });
  }
});

module.exports = router; 