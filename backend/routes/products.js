// Product routes - CRUD operations for products with image upload
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Calculate eco score based on category, year, and condition
function calculateEcoScore(categoryId, yearOfManufacture, condition) {
  let score = 50; // Base score
  
  // Age bonus (newer items get higher scores for reuse)
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearOfManufacture;
  
  if (age <= 1) score += 30;
  else if (age <= 3) score += 20;
  else if (age <= 5) score += 10;
  else if (age <= 10) score += 5;
  
  // Condition bonus
  const conditionScores = {
    'excellent': 20,
    'good': 15,
    'fair': 10,
    'poor': 5
  };
  score += conditionScores[condition] || 10;
  
  // Category bonus (some categories are more eco-friendly when reused)
  const categoryBonuses = {
    3: 15, // Clothing - high reuse value
    2: 12, // Furniture - durable goods
    1: 10, // Electronics - valuable components
    4: 8,  // Books - knowledge sharing
  };
  score += categoryBonuses[categoryId] || 5;
  
  return Math.min(100, Math.max(0, score)); // Clamp between 0-100
}

// GET /api/products - Get all products with filtering
router.get('/', async (req, res) => {
  try {
    // Normalize query parameters: if multiple values are passed they may appear as arrays
    const raw = req.query || {};
    const category = Array.isArray(raw.category) ? raw.category[0] : raw.category;
    const search = Array.isArray(raw.search) ? raw.search[0] : raw.search;
    const minPrice = Array.isArray(raw.minPrice) ? raw.minPrice[0] : raw.minPrice;
    const maxPrice = Array.isArray(raw.maxPrice) ? raw.maxPrice[0] : raw.maxPrice;
    const condition = Array.isArray(raw.condition) ? raw.condition[0] : raw.condition;
    const page = parseInt(Array.isArray(raw.page) ? raw.page[0] : (raw.page ?? '1'), 10) || 1;
    const limit = parseInt(Array.isArray(raw.limit) ? raw.limit[0] : (raw.limit ?? '20'), 10) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name, u.username as seller_username, u.trust_score,
             GROUP_CONCAT(pi.image_url) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_available = true
    `;

    const params = [];
    
    if (category) {
      query += ' AND p.category_id = ?';
      params.push(parseInt(category, 10));
    }
    
    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (condition) {
      query += ' AND p.condition_rating = ?';
      params.push(condition);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const db = req.app.locals.db;

    // Sanitize params: ensure scalars and primitive types only
    const sanitizedParams = params.map(p => {
      if (Array.isArray(p)) return p[0];
      if (p === undefined) return null;
      if (p === null) return null;
      if (typeof p === 'number' || typeof p === 'string' || typeof p === 'boolean') return p;
      return String(p);
    });

    // Debug: log query + param types to help trace ER_WRONG_ARGUMENTS issues
    try {
      const placeholderCount = (query.match(/\?/g) || []).length;
      if (placeholderCount !== sanitizedParams.length) {
        console.error('Get products error: placeholder/param count mismatch', { placeholderCount, paramCount: sanitizedParams.length, query, params: sanitizedParams });
        return res.status(500).json({ message: 'Internal server error preparing database query' });
      }
    } catch (e) {
      console.error('Error while validating query params', e);
    }

    console.debug('Executing products query', { query, params: sanitizedParams.map(p => (p === null ? 'null' : typeof p + ':' + p)) });

    let products;
    try {
      // Use query (non-prepared) to avoid mysql2 prepared-statement argument edge-cases
      const [rows] = await db.query(query, sanitizedParams);
      products = rows;
    } catch (err) {
      console.error('Get products error (db.query):', err && err.message ? err.message : err, { query, params: sanitizedParams });
      throw err;
    }
    
    // Format response
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? product.images.split(',') : [],
      price: parseFloat(product.price),
      trustScore: parseFloat(product.trust_score)
    }));
    
    res.json({
      products: formattedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalItems: formattedProducts.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [products] = await db.execute(`
      SELECT p.*, c.name as category_name, u.username as seller_username, 
             u.trust_score, u.full_name as seller_name, u.profile_image as seller_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get product images
    const [images] = await db.execute(
      'SELECT image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
      [req.params.id]
    );
    
    const product = {
      ...products[0],
      images: images.map(img => img.image_url),
      price: parseFloat(products[0].price),
      trustScore: parseFloat(products[0].trust_score)
    };
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// POST /api/products - Create new product (protected)
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, categoryId, yearOfManufacture, condition, location } = req.body;
    
    if (!title || !price || !categoryId) {
      return res.status(400).json({ message: 'Title, price, and category are required' });
    }
    
    const ecoScore = calculateEcoScore(
      parseInt(categoryId), 
      parseInt(yearOfManufacture) || new Date().getFullYear(),
      condition || 'good'
    );
    
    const db = req.app.locals.db;
    
    // Insert product
    const [result] = await db.execute(`
      INSERT INTO products (seller_id, category_id, title, description, price, 
                          year_of_manufacture, condition_rating, eco_score, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, categoryId, title, description, price,
      yearOfManufacture || null, condition || 'good', ecoScore, location
    ]);
    
    const productId = result.insertId;
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        return db.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, file.filename, index === 0]
        );
      });
      await Promise.all(imagePromises);
    }
    
    res.status(201).json({
      message: 'Product created successfully',
      productId,
      ecoScore,
      imagesUploaded: req.files ? req.files.length : 0
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// PUT /api/products/:id - Update product (owner only)
router.put('/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Check if user owns the product
    const [products] = await db.execute(
      'SELECT seller_id FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (products[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own products' });
    }
    
    const { title, description, price, categoryId, yearOfManufacture, condition, location, isAvailable } = req.body;
    
    // Recalculate eco score if relevant fields changed
    const ecoScore = calculateEcoScore(
      parseInt(categoryId) || products[0].category_id,
      parseInt(yearOfManufacture) || products[0].year_of_manufacture || new Date().getFullYear(),
      condition || products[0].condition_rating
    );
    
    // Update product
    await db.execute(`
      UPDATE products 
      SET title = COALESCE(?, title), 
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          category_id = COALESCE(?, category_id),
          year_of_manufacture = COALESCE(?, year_of_manufacture),
          condition_rating = COALESCE(?, condition_rating),
          eco_score = ?,
          location = COALESCE(?, location),
          is_available = COALESCE(?, is_available),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, description, price, categoryId, yearOfManufacture, 
      condition, ecoScore, location, isAvailable, req.params.id
    ]);
    
    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        return db.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [req.params.id, file.filename, index === 0]
        );
      });
      await Promise.all(imagePromises);
    }
    
    res.json({ 
      message: 'Product updated successfully', 
      ecoScore,
      imagesUploaded: req.files ? req.files.length : 0 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE /api/products/:id - Delete product (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Check if product exists and user owns it
    const [products] = await db.execute(
      'SELECT seller_id FROM products WHERE id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (products[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    // Delete product (images will be cascade deleted if FK is set)
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;
