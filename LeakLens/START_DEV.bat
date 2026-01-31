@echo off
echo ============================================================
echo LeakLens Development Server
echo ============================================================
echo.
echo This will start BOTH servers:
echo   - Python Backend: http://localhost:8000 (API)
echo   - Next.js Frontend: http://localhost:3000 (UI)
echo.
echo Open http://localhost:3000 in your browser
echo.
echo Press Ctrl+C in each window to stop
echo ============================================================
echo.

:: Start Python backend in a new window
start "LeakLens Backend" cmd /k "cd /d %~dp0 && python run_server.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start Next.js frontend in a new window
start "LeakLens Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo.
pause
