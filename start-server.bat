@echo off
echo Starting CustomPC.tech Payment Server...
echo.

cd backend
echo Installing dependencies...
call npm install

echo.
echo Starting server on http://localhost:3000
echo Admin panel: http://localhost:3000/payments.html
echo Messaging: http://localhost:3000/messaging.html
echo.

call npm start

pause