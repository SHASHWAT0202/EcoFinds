# 🚀 Quick Start Guide

## Automatic Setup (Recommended)

### Windows PowerShell:
```powershell
# Run the setup script
.\setup.ps1

# Or manually run:
npm run install-all
```

### Linux/Mac:
```bash
# Make setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh

# Or manually run:
npm run install-all
```

## Manual Setup

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies  
cd frontend
npm install
cd ..
```

### 2. Database Setup
```sql
-- Create database in MySQL
CREATE DATABASE ecofinds;

-- Import schema (run in MySQL or via command line)
-- Option A: MySQL Workbench - Open and execute backend/db/schema.sql
-- Option B: Command line:
mysql -u root -p ecofinds < backend/db/schema.sql
```

### 3. Environment Configuration
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your MySQL credentials:
# DB_PASSWORD=your_actual_mysql_password
# JWT_SECRET=your_very_long_secret_key
```

### 4. Start Development Servers

#### Option A: Both servers together (Recommended)
```bash
npm run dev
```

#### Option B: Separate terminals
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## Test the Setup

1. Visit http://localhost:3000
2. Create a new user account
3. Login with your credentials
4. Try adding a product
5. Browse the product feed

## Common Issues

### Port Already in Use
```bash
# Find process using port 3000/3001
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Kill the process (Linux/Mac)
kill -9 <process_id>
```

### MySQL Connection Error
1. Ensure MySQL server is running
2. Check credentials in `backend/.env`
3. Verify database `ecofinds` exists
4. Check if MySQL is accepting connections on port 3306

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Commands

```bash
# Root directory commands
npm run install-all     # Install all dependencies
npm run dev            # Start both servers
npm run dev:backend    # Start only backend
npm run dev:frontend   # Start only frontend
npm run build          # Build frontend for production

# Backend specific (from backend/ directory)
npm run dev            # Start backend with nodemon
npm start              # Start backend with node

# Frontend specific (from frontend/ directory) 
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
```

---

🎉 **You're all set! Happy coding with EcoFinds!** 🌱
