// Main server file for EcoFinds backend - Express.js server with MySQL connection
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecofinds',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Make pool available to routes
app.locals.db = pool;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/messages', require('./routes/messages'));
// Notifications route temporarily disabled to prevent SQL compatibility issues
// Re-enable after fixing/porting notifications SQL for your server version
// app.use('/api/notifications', require('./routes/notifications'));
console.log('\u26a0\ufe0f Notifications routes are disabled (temporary)');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EcoFinds API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
    
    app.listen(PORT, () => {
      console.log(`🚀 EcoFinds backend server running on http://localhost:${PORT}`);
      console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.log('Please ensure MySQL is running and credentials are correct in .env file');
    process.exit(1);
  }
}

startServer();
