@echo off
echo 🎯 Setting up Raffle Draw Frontend...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v14 or higher) first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create environment file if it doesn't exist
if not exist .env (
    echo 🔧 Creating environment file...
    echo REACT_APP_API_URL=http://localhost:8000 > .env
    echo ✅ Environment file created
) else (
    echo ℹ️  Environment file already exists
)

echo.
echo 🎉 Setup complete!
echo.
echo To start the development server, run:
echo   npm start
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
echo Make sure your backend API is running on:
echo   http://localhost:8000
echo.
echo Happy coding! 🚀
pause
