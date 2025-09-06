#!/bin/bash

# EcoFinds Setup Script
# This script helps set up the EcoFinds project for development

echo "🌱 Welcome to EcoFinds Setup!"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v16 or higher.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL command not found. Please ensure MySQL is installed and running.${NC}"
else
    echo -e "${GREEN}✅ MySQL is available${NC}"
fi

echo ""
echo "📦 Installing dependencies..."
echo "=============================="

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "⚙️  Setting up configuration..."
echo "==============================="

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your MySQL credentials${NC}"
else
    echo -e "${GREEN}✅ Backend .env file already exists${NC}"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. ${YELLOW}Configure your MySQL database:${NC}"
echo "   - Create a MySQL database named 'ecofinds'"
echo "   - Import the schema: mysql -u root -p ecofinds < backend/db/schema.sql"
echo "   - Update backend/.env with your database credentials"
echo ""
echo "2. ${YELLOW}Start the development servers:${NC}"
echo "   - Run: npm run dev"
echo "   - Backend will be available at: http://localhost:3001"
echo "   - Frontend will be available at: http://localhost:3000"
echo ""
echo "3. ${YELLOW}Alternative - Start servers separately:${NC}"
echo "   - Backend: npm run dev:backend"
echo "   - Frontend: npm run dev:frontend"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
