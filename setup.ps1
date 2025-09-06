# EcoFinds Setup Script for Windows PowerShell
# This script helps set up the EcoFinds project for development

Write-Host "🌱 Welcome to EcoFinds Setup!" -ForegroundColor Green
Write-Host "=================================="

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or higher." -ForegroundColor Red
    exit 1
}

# Check if MySQL is installed
try {
    mysql --version | Out-Null
    Write-Host "✅ MySQL is available" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MySQL command not found. Please ensure MySQL is installed and running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
Write-Host "=============================="

# Install root dependencies
Write-Host "Installing root dependencies..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "Installing backend dependencies..."
Set-Location backend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
Set-Location frontend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "⚙️  Setting up configuration..." -ForegroundColor Cyan
Write-Host "==============================="

# Copy environment file if it doesn't exist
if (!(Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env file" -ForegroundColor Green
    Write-Host "⚠️  Please edit backend\.env with your MySQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ Backend .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================="
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Configure your MySQL database:" -ForegroundColor Yellow
Write-Host "   - Create a MySQL database named 'ecofinds'"
Write-Host "   - Import the schema: Get-Content backend\db\schema.sql | mysql -u root -p ecofinds"
Write-Host "   - Update backend\.env with your database credentials"
Write-Host ""
Write-Host "2. Start the development servers:" -ForegroundColor Yellow
Write-Host "   - Run: npm run dev"
Write-Host "   - Backend will be available at: http://localhost:3001"
Write-Host "   - Frontend will be available at: http://localhost:3000"
Write-Host ""
Write-Host "3. Alternative - Start servers separately:" -ForegroundColor Yellow
Write-Host "   - Backend: npm run dev:backend"
Write-Host "   - Frontend: npm run dev:frontend"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
