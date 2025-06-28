@echo off
echo ========================================
echo TapBill Desktop App - Starting...
echo ========================================
echo.

cd /d "%~dp0"

echo Checking MongoDB connection...
node check-mongodb.js
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running or not installed
    echo Please install and start MongoDB first
    echo Download from: https://www.mongodb.com/try/download/community
    pause
    exit /b 1
)
echo ✅ MongoDB is running
echo.

echo Starting TapBill Desktop App...
echo Please wait while the app loads...
echo.

npm start

if %errorlevel% neq 0 (
    echo ❌ Failed to start the application
    echo Make sure you have run setup.bat first
    pause
    exit /b 1
)

pause
