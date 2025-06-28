@echo off
echo ========================================
echo TapBill - Cleanup Unnecessary Files
echo ========================================
echo.

echo Stopping any running TapBill processes...
taskkill /F /IM TapbillApp.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo Removing unnecessary build folders...

if exist "dist2" (
    echo Removing dist2 folder...
    rmdir /s /q "dist2" 2>nul
    if exist "dist2" (
        echo ⚠️  Could not remove dist2 - files may be in use
    ) else (
        echo ✅ dist2 folder removed
    )
)

if exist "build-temp" (
    echo Removing build-temp folder...
    rmdir /s /q "build-temp" 2>nul
    if exist "build-temp" (
        echo ⚠️  Could not remove build-temp - files may be in use
    ) else (
        echo ✅ build-temp folder removed
    )
)

if exist "dist" (
    echo Removing dist folder...
    rmdir /s /q "dist" 2>nul
    if exist "dist" (
        echo ⚠️  Could not remove dist - files may be in use
    ) else (
        echo ✅ dist folder removed
    )
)

echo.
echo ========================================
echo 🎉 Cleanup Complete!
echo ========================================
echo.
echo The app can still be started with:
echo - Start-TapBill.bat (recommended)
echo - npm start
echo.
pause
