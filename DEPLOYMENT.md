# TapBill Desktop App - Deployment Guide

## 📋 Overview
This guide explains how to deploy TapBill Desktop App to client PCs/laptops.

## 🔧 What Clients Need to Install

### 1. **Node.js** (Required)
- **Download**: https://nodejs.org/
- **Version**: Node.js 18.x or higher
- **Why**: Required to run the Electron app and backend server

### 2. **MongoDB** (Required for Data Persistence)
- **Download**: https://www.mongodb.com/try/download/community
- **Version**: MongoDB 6.0 or higher
- **Installation**: 
  - Install MongoDB Community Server
  - Make sure MongoDB service is running
  - Default connection: `mongodb://127.0.0.1:27017`

### 3. **Git** (Optional - for cloning)
- **Download**: https://git-scm.com/downloads
- **Alternative**: Download ZIP from GitHub

## 📦 Deployment Methods

### Method 1: Git Clone (Recommended for Developers)
```bash
# Clone the repository
git clone <your-repo-url>
cd Tapbill

# Copy environment file
copy .env.example backend\.env

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Build and run
npm run build
npm start
```

### Method 2: Download ZIP (Recommended for End Users)
1. Download ZIP from GitHub
2. Extract to desired location
3. Follow the same steps as Method 1 (except git clone)

### Method 3: Pre-built Executable (Best for End Users)
```bash
# Build executable for distribution
npm run dist

# This creates an installer in dist/ folder
# Share the installer with clients
```

## 🚀 Quick Start for Clients

### Step 1: Install Prerequisites
1. Install Node.js from https://nodejs.org/
2. Install MongoDB from https://www.mongodb.com/try/download/community
3. Ensure MongoDB service is running

### Step 2: Setup Application
1. Download/clone the TapBill application
2. Open Command Prompt/Terminal in the TapBill folder
3. Run these commands:
```bash
# Copy environment configuration
copy .env.example backend\.env

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build the application
npm run build
```

### Step 3: Run Application
```bash
# Start the application
npm start
```

## 🔧 Configuration

### Environment Variables (backend/.env)
```
PORT=5000
JWT_SECRET=your-secret-key-for-tapbill-desktop-app
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/tapbill
```

### Default Login Credentials
- **Username**: admin
- **Password**: admin123

## 📁 What to Upload to Git Repository

### Include:
- All source code files
- package.json files
- .env.example file
- README.md and DEPLOYMENT.md
- Configuration files

### Exclude (already in .gitignore):
- node_modules/ folders
- .env files (contains secrets)
- dist/ and build/ folders
- Temporary files

## 🔍 Verification Steps

### 1. Check MongoDB Connection
```bash
# Run this command to verify MongoDB is working
node check-mongodb.js
```
Expected output: "✅ Local MongoDB is available and running"

### 2. Test Application
1. Start the app: `npm start`
2. App should open automatically
3. Login with admin/admin123
4. Create a test bill
5. Verify data persists after restart

## 🛠️ Troubleshooting

### Common Issues:

#### "MongoDB connection failed"
- Ensure MongoDB service is running
- Check if port 27017 is available
- Verify MongoDB installation

#### "Port 5000 already in use"
- Close other applications using port 5000
- Or change PORT in backend/.env file

#### "npm install fails"
- Ensure Node.js is properly installed
- Try running as administrator
- Clear npm cache: `npm cache clean --force`

#### "Electron app won't start"
- Ensure all dependencies are installed
- Try rebuilding: `npm run build`
- Check for error messages in terminal

## 📊 Data Storage

### Development/Testing
- Data stored in MongoDB database: `tapbill`
- Collections: billitems, customers, menuitems, users, etc.

### Backup Recommendations
- Regular MongoDB backups using `mongodump`
- Export data using built-in export features
- Keep backup of the entire data folder

## 🔄 Updates

### To Update the Application:
1. Pull latest changes: `git pull origin main`
2. Install new dependencies: `npm install`
3. Rebuild: `npm run build`
4. Restart: `npm start`

## 📞 Support

For issues or questions:
1. Check this deployment guide
2. Review error messages in terminal
3. Verify all prerequisites are installed
4. Contact development team

---

**Note**: This application requires an active internet connection only for initial setup. Once installed, it works completely offline with local MongoDB storage.
