@echo off
echo ========================================
echo TapBill Desktop App - Setup Script
echo ========================================
echo.

echo Step 1: Copying environment configuration...
if not exist "backend\.env" (
    copy ".env.example" "backend\.env"
    echo ✅ Environment file created
) else (
    echo ⚠️  Environment file already exists
)
echo.

echo Step 2: Installing main dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install main dependencies
    pause
    exit /b 1
)
echo ✅ Main dependencies installed
echo.

echo Step 3: Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Backend dependencies installed
echo.

echo Step 4: Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Frontend dependencies installed
echo.

echo Step 5: Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build application
    pause
    exit /b 1
)
echo ✅ Application built successfully
echo.

echo ========================================
echo 🎉 Setup Complete!
echo ========================================
echo.
echo To start the application, run: npm start
echo Or double-click on Start-TapBill.bat
echo.
echo Default login credentials:
echo Username: admin
echo Password: admin123
echo.
pause
