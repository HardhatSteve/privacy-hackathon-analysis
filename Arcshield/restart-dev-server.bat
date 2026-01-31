@echo off
echo ========================================
echo   Stopping existing dev server...
echo ========================================
echo.

REM Kill any Node processes (be careful with this in production!)
taskkill /F /IM node.exe 2>nul

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Starting dev server with new config...
echo ========================================
echo.

cd /d "%~dp0frontend"

REM Clear cache
if exist "node_modules\.cache" (
    echo Clearing cache...
    rmdir /s /q "node_modules\.cache"
)

echo Starting server...
echo.
call npm start

pause
