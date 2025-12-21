@echo off
cd /d "%~dp0"
echo Starting CustomPC.tech Website...
echo.

echo Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo Installing Server Dependencies...
call npm install

echo.
echo Starting server on http://localhost:5000
echo Access the site at: http://localhost:5000/
echo.

node server.js

pause