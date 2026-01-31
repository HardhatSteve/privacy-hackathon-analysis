@echo off
echo ========================================
echo   ArcShield Finance - Starting Frontend
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Checking if Node.js is installed...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting development server...
echo.
echo The app will open in your browser at http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

call npm start

pause
