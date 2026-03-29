@echo off
title SenseChain Launcher
color 0A

echo ============================================
echo   SENSECHAIN - Auto Launcher
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend...
cd /d C:\Users\thaku\OneDrive\Desktop\SENSECHAIN\Backend
call myenv\Scripts\activate
pip install -r requirements.txt --quiet

start "SenseChain Backend" cmd /k "cd /d C:\Users\thaku\OneDrive\Desktop\SENSECHAIN\Backend && myenv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

:: Start Frontend
echo [2/2] Starting Frontend...
start "SenseChain Frontend" cmd /k "cd /d C:\Users\thaku\OneDrive\Desktop\SENSECHAIN\Frontend && npm run dev"

:: Wait then open browser
timeout /t 5 /nobreak > nul
echo Opening browser...
start http://localhost:5173

echo.
echo ============================================
echo   Both servers are running!
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:5173
echo ============================================
pause