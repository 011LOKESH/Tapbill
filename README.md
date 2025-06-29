# 🍽️ TapBill Desktop - Advanced POS System

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-Latest-blue.svg)](https://electronjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green.svg)](https://mongodb.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue.svg)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Professional Point of Sale (POS) Desktop Application** designed for restaurants, cafes, and retail businesses with advanced thermal printing, barcode scanning, and comprehensive reporting capabilities.

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [✨ Unique Features](#-unique-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [📋 System Requirements](#-system-requirements)
- [🚀 Quick Start](#-quick-start)
- [💻 Installation Guide](#-installation-guide)
- [🔧 Development Setup](#-development-setup)
- [📊 Features Overview](#-features-overview)
- [🖨️ Thermal Printing](#️-thermal-printing)
- [📱 Barcode Integration](#-barcode-integration)
- [📈 Reporting System](#-reporting-system)
- [🗄️ Database Architecture](#️-database-architecture)
- [🔧 Configuration](#-configuration)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Project Overview

**TapBill Desktop** is a comprehensive Point of Sale (POS) application built specifically for small to medium-sized restaurants, cafes, and retail businesses. Unlike cloud-based solutions, TapBill operates entirely offline with local data storage, ensuring business continuity even without internet connectivity.

### 🎯 Target Audience
- **Restaurants & Cafes**: Full-service dining, quick-service restaurants, coffee shops
- **Retail Stores**: Small to medium retail businesses requiring inventory management
- **Food Trucks**: Mobile food service businesses needing portable POS solutions
- **Bakeries & Delis**: Specialty food businesses with custom menu requirements

### 🌟 What Makes TapBill Different
- **100% Offline Operation**: No internet dependency for core functionality
- **Advanced Thermal Printing**: Native support for 58mm and 80mm thermal printers
- **Integrated Barcode Scanning**: USB/wireless barcode scanner compatibility
- **Real-time Local Database**: Instant data persistence with MongoDB
- **Cross-platform Desktop**: Runs on Windows, macOS, and Linux
- **Zero Monthly Fees**: One-time setup, no recurring subscription costs

## ✨ Unique Features

### 🖨️ **Advanced Thermal Printing System**
- **Dual Format Support**: 58mm and 80mm thermal printer compatibility
- **Dynamic Layout Adjustment**: Automatic column spacing optimization
- **Print Fallback System**: PDF generation when printer unavailable
- **Custom Receipt Templates**: Configurable shop details and formatting
- **Real-time Print Status**: Connection monitoring and error handling

### 📱 **Barcode Scanning Integration**
- **USB/Wireless Scanner Support**: Compatible with standard barcode scanners
- **Automatic Item Recognition**: Instant product lookup and cart addition
- **Inventory Management**: Barcode-based stock tracking
- **Custom Barcode Assignment**: Link existing products to barcodes
- **Scan-to-Bill Workflow**: Streamlined checkout process

### 💾 **Offline-First Architecture**
- **Local MongoDB Storage**: Complete data persistence without internet
- **Real-time Synchronization**: Instant updates across application modules
- **Data Backup System**: Automatic local data backup and recovery
- **Cross-session Persistence**: Data retention across application restarts

### 📊 **Comprehensive Reporting**
- **Day-wise Sales Reports**: Daily revenue and transaction analysis
- **Bill-wise Sales Tracking**: Individual transaction monitoring
- **Deleted Items/Bills Audit**: Complete deletion history with timestamps
- **Custom Date Range Reports**: Flexible reporting periods
- **Export Capabilities**: PDF and Excel export functionality

### 🎛️ **Advanced Configuration**
- **Dynamic Printer Settings**: Real-time printer width adjustment
- **Menu Customization**: Category and item management
- **User Interface Themes**: Customizable appearance options
- **Print Template Editor**: Receipt layout customization

## 🛠️ Technology Stack

### **Frontend**
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and development server

### **Backend**
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for local storage
- **Mongoose** - MongoDB object modeling

### **Desktop Framework**
- **Electron** - Cross-platform desktop application framework
- **Electron Builder** - Application packaging and distribution

### **Printing & Hardware**
- **jsPDF** - PDF generation for receipts
- **Node Thermal Printer** - Direct thermal printer communication
- **USB HID** - Barcode scanner integration

### **Development Tools**
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Concurrently** - Parallel script execution

## 📋 System Requirements

### **Minimum Requirements**
- **Operating System**: Windows 10, macOS 10.14, or Ubuntu 18.04+
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Processor**: Intel i3 or AMD equivalent

### **Required Software**
- **Node.js**: Version 16.0 or higher
- **MongoDB**: Version 5.0 or higher
- **Git**: For repository cloning (optional)

### **Hardware Compatibility**
- **Thermal Printers**: ESC/POS compatible (58mm/80mm)
- **Barcode Scanners**: USB HID or wireless scanners
- **Receipt Printers**: Standard thermal receipt printers

## 🚀 Quick Start

### **Option 1: Download Release (Recommended)**
```bash
# Download the latest release from GitHub
# Extract to desired location
# Run TapBill.exe (Windows) or TapBill.app (macOS)
```

### **Option 2: Clone and Build**
```bash
# Clone the repository
git clone https://github.com/yourusername/tapbill-desktop.git
cd tapbill-desktop

# Install dependencies and start
npm install
npm start
```

### **🔑 Default Login Credentials**
- **Username**: `admin`
- **Password**: `admin123`

## 💻 Installation Guide

### **Step 1: Prerequisites Installation**

#### **Install Node.js**
```bash
# Download from https://nodejs.org/
# Choose LTS version for stability
# Verify installation
node --version
npm --version
```

#### **Install MongoDB**
```bash
# Download MongoDB Community Server
# From: https://www.mongodb.com/try/download/community
# Start MongoDB service
net start MongoDB  # Windows
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### **Step 2: Application Setup**
```bash
# Clone repository
git clone https://github.com/yourusername/tapbill-desktop.git
cd tapbill-desktop

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root and build
cd ..
npm run build
```

### **Step 3: Database Configuration**
```bash
# Create .env file in backend directory
cd backend
echo "MONGODB_URI=mongodb://127.0.0.1:27017/tapbill" > .env
echo "PORT=5000" >> .env
```

### **Step 4: Launch Application**
```bash
# Start the application
npm start
```

## 🔧 Development Setup

### **Prerequisites for Development**
- Node.js 16+
- MongoDB 5.0+
- Git
- Code editor (VS Code recommended)

### **Development Environment Setup**
```bash
# Clone repository
git clone https://github.com/yourusername/tapbill-desktop.git
cd tapbill-desktop

# Install all dependencies
npm run install-all

# Start development servers
npm run dev
```

### **Available Scripts**
```bash
npm start          # Start production application
npm run dev        # Start development with hot reload
npm run build      # Build frontend for production
npm run test       # Run test suite
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run package    # Package for distribution
```

### **Project Structure**
```
tapbill-desktop/
├── backend/           # Node.js/Express backend
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API endpoints
│   ├── middleware/   # Custom middleware
│   └── server.js     # Main server file
├── frontend/         # React/TypeScript frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Application pages
│   │   ├── services/   # API and utility services
│   │   └── types/      # TypeScript definitions
│   └── dist/         # Built frontend files
├── electron/         # Electron main process
│   └── main.js       # Electron configuration
├── docs/            # Documentation
└── package.json     # Project configuration
```

## 📊 Features Overview

### **🏪 Core POS Functionality**
- **Bill Management**: Create, edit, and manage customer bills
- **Menu Management**: Add, edit, and organize menu items by category
- **Customer Management**: Track customer information and purchase history
- **Inventory Tracking**: Real-time stock management with barcode integration
- **User Authentication**: Secure login system with role-based access

### **💳 Payment Processing**
- **Multiple Payment Methods**: Cash, card, and digital payment support
- **Split Bills**: Divide bills among multiple customers
- **Discounts & Offers**: Apply percentage or fixed amount discounts
- **Tax Calculation**: Automatic tax computation with configurable rates
- **Receipt Generation**: Instant thermal and PDF receipt creation

### **📋 Order Management**
- **Table Management**: Assign orders to specific tables or customers
- **Order Modifications**: Edit orders before and after placement
- **Kitchen Display**: Order tracking for kitchen staff
- **Order History**: Complete transaction history with search capabilities
- **Void/Refund**: Handle order cancellations and refunds

## 🖨️ Thermal Printing

### **Printer Compatibility**
- **58mm Thermal Printers**: Compact format for small spaces
- **80mm Thermal Printers**: Standard format for detailed receipts
- **ESC/POS Protocol**: Compatible with most thermal printer brands
- **USB & Network**: Support for both USB and network-connected printers

### **Print Features**
```javascript
// Dynamic printer width detection
const printerSettings = PrinterConfigService.getSettings();
const layout = PrinterConfigService.getPDFLayout(printerSettings.selectedWidth);

// Automatic layout adjustment
if (layout.paperWidth <= 200) { // 58mm
  // Compact layout with optimized spacing
} else { // 80mm
  // Standard layout with full details
}
```

### **Receipt Customization**
- **Shop Details**: Configurable business name, address, and contact
- **Logo Integration**: Add business logo to receipts
- **Custom Footer**: Personalized thank you messages
- **Date/Time Format**: DD/MM/YYYY HH:MM format across all receipts
- **Column Optimization**: Dynamic spacing to prevent text collision

### **Print Fallback System**
```javascript
// Intelligent print handling
if (printerConnected) {
  await directPrint(receiptData);
  showSuccess("Receipt printed successfully!");
} else {
  generatePDF(receiptData);
  showWarning("Printer offline. PDF saved as backup.");
}
```

## 📱 Barcode Integration

### **Scanner Compatibility**
- **USB Barcode Scanners**: Plug-and-play USB HID scanners
- **Wireless Scanners**: Bluetooth and WiFi-enabled scanners
- **Mobile Scanners**: Smartphone camera-based scanning
- **Multi-format Support**: UPC, EAN, Code 128, QR codes

### **Barcode Workflow**
```javascript
// Automatic item lookup
const scannedItem = await barcodeService.lookupItem(barcode);
if (scannedItem.success) {
  addToCart(scannedItem.item);
  showSuccess(`Added: ${scannedItem.item.name}`);
} else {
  showPrompt("Item not found. Add new item?");
}
```

### **Inventory Management**
- **Barcode Assignment**: Link existing products to barcodes
- **Stock Tracking**: Real-time inventory updates on sales
- **Low Stock Alerts**: Automatic notifications for reorder points
- **Batch Operations**: Bulk barcode assignment and updates

## 📈 Reporting System

### **Sales Reports**
- **Day-wise Sales**: Daily revenue analysis with date filtering
- **Bill-wise Sales**: Individual transaction tracking
- **Item-wise Sales**: Product performance analytics
- **Category Analysis**: Sales breakdown by menu categories
- **Time-based Reports**: Hourly, daily, weekly, monthly views

### **Audit Reports**
- **Deleted Bills**: Complete deletion history with timestamps
- **Deleted Items**: Removed menu items tracking
- **User Activity**: Login and action logs
- **System Changes**: Configuration and settings modifications

### **Export Capabilities**
```javascript
// Multiple export formats
exportToExcel(reportData);  // Excel spreadsheet
exportToPDF(reportData);    // PDF document
exportToCSV(reportData);    // CSV file
```

## 🗄️ Database Architecture

### **MongoDB Collections**
```javascript
// Core collections
billitems     // Customer bills and transactions
menuitems     // Restaurant menu and inventory
customers     // Customer information
users         // System users and authentication
counters      // Auto-incrementing bill numbers
deletedItems  // Audit trail for deleted items
deletedBills  // Audit trail for deleted bills
```

### **Data Models**
```javascript
// Bill Item Schema
{
  _id: Number,           // Auto-generated ID
  billNo: Number,        // Sequential bill number
  items: [{
    name: String,        // Item name
    quantity: Number,    // Quantity ordered
    price: Number,       // Unit price
    total: Number        // Line total
  }],
  total: Number,         // Bill total
  createdAt: Date        // Transaction timestamp
}

// Menu Item Schema
{
  category: String,      // Item category
  name: String,          // Item name
  price: Number,         // Item price
  isVeg: Boolean,        // Vegetarian flag
  isAvailable: Boolean,  // Availability status
  barcode: String,       // Unique barcode (optional)
  isDeleted: Boolean     // Soft delete flag
}
```

### **Data Persistence**
- **Local Storage**: All data stored locally in MongoDB
- **Automatic Backup**: JSON backup files in `/data` directory
- **Data Recovery**: Restore from backup files if needed
- **Cross-session**: Data persists across application restarts

## 🔧 Configuration

### **Environment Variables**
```bash
# Backend configuration (.env file)
MONGODB_URI=mongodb://127.0.0.1:27017/tapbill
PORT=5000
NODE_ENV=production
```

### **Printer Configuration**
```javascript
// Print settings configuration
{
  selectedWidth: "58mm" | "80mm",
  printerName: "Thermal Printer",
  paperSize: { width: 58000, height: 297000 }, // micrometers
  margins: { top: 8, bottom: 8, left: 8, right: 8 }
}
```

### **Application Settings**
- **Shop Details**: Business name, address, phone number
- **Tax Configuration**: Default tax rates and calculation methods
- **Currency Settings**: Currency symbol and decimal places
- **Date/Time Format**: Regional date and time formatting
- **Theme Customization**: UI colors and layout preferences

### **Hardware Configuration**
```javascript
// Barcode scanner settings
{
  scannerType: "USB" | "Wireless",
  autoAddToCart: true,
  scanBeep: true,
  duplicateHandling: "increment" | "ignore"
}

// Thermal printer settings
{
  connectionType: "USB" | "Network",
  ipAddress: "192.168.1.100", // For network printers
  port: 9100,
  encoding: "GB18030"
}
```

## 🐛 Troubleshooting

### **Common Issues & Solutions**

#### **MongoDB Connection Issues**
```bash
# Problem: MongoDB not running
# Solution: Start MongoDB service
net start MongoDB  # Windows
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux

# Problem: Database connection timeout
# Solution: Check MongoDB status and restart if needed
mongod --dbpath "C:\data\db"  # Manual start with custom path
```

#### **Port Conflicts**
```bash
# Problem: Port 5000 already in use
# Solution: Find and kill the process
netstat -ano | findstr :5000  # Windows
lsof -ti:5000 | xargs kill -9  # macOS/Linux

# Alternative: Change port in .env file
PORT=5001
```

#### **Printer Connection Issues**
```javascript
// Problem: Thermal printer not detected
// Solutions:
1. Check USB connection and drivers
2. Verify printer is ESC/POS compatible
3. Test with different USB port
4. Update printer drivers
5. Check printer settings in application

// Problem: Print jobs failing
// Solutions:
1. Restart printer and application
2. Clear print queue
3. Check paper and ribbon
4. Verify printer width settings (58mm/80mm)
```

#### **Barcode Scanner Issues**
```javascript
// Problem: Scanner not responding
// Solutions:
1. Check USB connection
2. Verify scanner is in HID mode
3. Test scanner with notepad
4. Restart application
5. Check scanner configuration

// Problem: Barcodes not recognized
// Solutions:
1. Verify barcode format compatibility
2. Check database for existing barcodes
3. Clean scanner lens
4. Adjust scanner sensitivity
```

#### **Application Performance**
```bash
# Problem: Slow application startup
# Solutions:
1. Clear npm cache: npm cache clean --force
2. Rebuild node modules: rm -rf node_modules && npm install
3. Check available disk space
4. Close unnecessary applications

# Problem: Database queries slow
# Solutions:
1. Restart MongoDB service
2. Check database indexes
3. Clear old data if necessary
4. Optimize queries
```

### **Log Files & Debugging**
```bash
# Application logs location
Windows: %APPDATA%/TapBill/logs/
macOS: ~/Library/Logs/TapBill/
Linux: ~/.local/share/TapBill/logs/

# Enable debug mode
NODE_ENV=development npm start

# MongoDB logs
Windows: C:\Program Files\MongoDB\Server\5.0\log\
macOS: /usr/local/var/log/mongodb/
Linux: /var/log/mongodb/
```

## 🤝 Contributing

We welcome contributions to TapBill Desktop! Here's how you can help:

### **Development Workflow**
```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/yourusername/tapbill-desktop.git

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make your changes and test
npm run test
npm run lint

# 5. Commit your changes
git commit -m "Add: your feature description"

# 6. Push to your fork
git push origin feature/your-feature-name

# 7. Create a Pull Request
```

### **Contribution Guidelines**
- **Code Style**: Follow ESLint and Prettier configurations
- **Testing**: Add tests for new features
- **Documentation**: Update README and code comments
- **Commit Messages**: Use conventional commit format
- **Pull Requests**: Provide clear description and screenshots

### **Areas for Contribution**
- **New Features**: Additional POS functionality
- **Hardware Support**: New printer and scanner integrations
- **Localization**: Multi-language support
- **Performance**: Optimization and bug fixes
- **Documentation**: Tutorials and guides
- **Testing**: Unit and integration tests

### **Development Environment**
```bash
# Required tools
Node.js 16+
MongoDB 5.0+
Git
VS Code (recommended)

# Recommended VS Code extensions
- ESLint
- Prettier
- TypeScript
- MongoDB for VS Code
- GitLens
```

## 📞 Support & Community

### **Getting Help**
- **Documentation**: Check this README and `/docs` folder
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Email**: contact@tapbill.com (if available)

### **Commercial Support**
- **Custom Development**: Feature customization for businesses
- **Installation Services**: Professional setup and configuration
- **Training**: Staff training for restaurant operations
- **Maintenance**: Ongoing support and updates

### **Community Resources**
- **GitHub Repository**: Source code and issue tracking
- **Wiki**: Detailed documentation and tutorials
- **Releases**: Download stable versions
- **Roadmap**: Upcoming features and improvements

## 📄 License

```
MIT License

Copyright (c) 2024 TapBill Desktop

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🚀 **Ready to Transform Your Business?**

TapBill Desktop brings enterprise-level POS functionality to small and medium businesses without the complexity and recurring costs of cloud-based solutions. With advanced thermal printing, barcode integration, and comprehensive reporting, you have everything needed to streamline operations and grow your business.

**Download TapBill Desktop today and experience the difference!**

---

*Made with ❤️ for restaurants, cafes, and retail businesses worldwide.*
