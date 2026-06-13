@echo off
title Rangi Hotel POS Launcher
echo ===================================================
echo   Rangi Hotel - POS (MERN Stack Startup)
echo ===================================================
echo.
echo Make sure MongoDB is running on port 27017!
echo.
echo [1/2] Launching Backend Server on port 5000...
start cmd.exe /k "echo Starting Express Server... && cd server && npm run dev"
echo.
echo [2/2] Launching Frontend Client on port 3000...
start cmd.exe /k "echo Starting React Client... && cd client && npm run dev"
echo.
echo ===================================================
echo Done! Both servers have been launched.
echo Web app will run at: http://localhost:3000
echo ===================================================
echo.
pause
