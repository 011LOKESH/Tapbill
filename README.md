# TapBill - Restaurant Billing System

A modern restaurant billing system built with React and Node.js.

## Project Structure

```
Tapbill/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── pages/    # React components
│   │   └── App.js    # Main React component
│   └── package.json
│
└── backend/          # Node.js/Express backend application
    ├── routes/      # API routes
    ├── server.js    # Express server
    └── package.json
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/tapbill
   JWT_SECRET=your_jwt_secret_here
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm start
   ```

## Features
- User Authentication
- Menu Management
- Order Processing
- Bill Generation
- Dashboard Analytics

## Technologies Used
- Frontend: React, Material-UI
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT 
