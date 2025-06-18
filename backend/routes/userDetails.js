const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Simple schema for user details
const userDetailsSchema = new mongoose.Schema({
  username: String,
  phone: String,
  shopName: String,
  shopAddress: String,
}, { collection: 'userdetails' });

const UserDetails = mongoose.model('UserDetails', userDetailsSchema);

// GET user details
router.get('/', async (req, res) => {
  let details = await UserDetails.findOne();
  if (!details) {
    // Return default if not set
    details = new UserDetails({
      username: '',
      phone: '',
      shopName: '',
      shopAddress: ''
    });
    await details.save();
  }
  res.json(details);
});

// PUT user details
router.put('/', async (req, res) => {
  let details = await UserDetails.findOne();
  if (!details) {
    details = new UserDetails(req.body);
  } else {
    details.username = req.body.username;
    details.phone = req.body.phone;
    details.shopName = req.body.shopName;
    details.shopAddress = req.body.shopAddress;
  }
  await details.save();
  res.json(details);
});

module.exports = router; 