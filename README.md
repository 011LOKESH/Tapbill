# TapBill Desktop App

A modern billing application built with Electron, React, and MongoDB for restaurants and small businesses.

## 🚀 Features

- ✅ Create and manage bills with automatic numbering
- ✅ Customer management system
- ✅ Menu item management with categories
- ✅ Export functionality (Excel, CSV)
- ✅ Offline-first with local MongoDB storage
- ✅ User authentication and authorization
- ✅ Real-time bill tracking
- ✅ Data persistence and backup

## 📋 Prerequisites

Before installing, make sure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** (v6.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)

## 🛠️ Quick Setup (Windows)

### For End Users:
1. **Double-click `setup.bat`** - This will install everything automatically
2. **Double-click `Start-TapBill.bat`** - This will start the application

### For Developers:
```bash
# Clone the repository
git clone <your-repo-url>
cd TapBill

# Run setup
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build and start
npm run build
npm start
```

## 🔑 Default Login

- **Username**: `admin`
- **Password**: `admin123`

## 📖 Documentation

- [Detailed Deployment Guide](DEPLOYMENT.md)
- [Commands Reference](CommanToRun.txt)

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Desktop**: Electron
- **Authentication**: JWT
- **Database**: MongoDB (local)

## 📁 Project Structure

```
TapBill/
├── frontend/          # React frontend
├── backend/           # Node.js backend
├── electron/          # Electron main process
├── setup.bat         # Windows setup script
├── Start-TapBill.bat # Windows start script
└── DEPLOYMENT.md     # Detailed deployment guide
```

## 🔧 Development Scripts

```bash
npm start              # Start the Electron app
npm run dev           # Development mode with hot reload
npm run build         # Build for production
npm run dist          # Create distributable package
```

## 📊 Data Storage

- **Database**: MongoDB (local instance)
- **Collections**: billitems, customers, menuitems, users, counters
- **Backup**: Automatic JSON backup in `data/` folder

## 🆘 Troubleshooting

1. **MongoDB not running**: Install and start MongoDB service
2. **Port 5000 in use**: Close other applications or change port in `.env`
3. **Dependencies issues**: Run `npm cache clean --force` and reinstall

## 📞 Support

For issues or questions, check the [DEPLOYMENT.md](DEPLOYMENT.md) guide or contact the development team.

## 📄 License

MIT License - feel free to use for commercial purposes.
