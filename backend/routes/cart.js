// Cart routes - Shopping cart management
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/cart - Get user's cart items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [cartItems] = await db.execute(`
      SELECT ci.*, p.title, p.price, p.is_available, u.username as seller_username,
             pi.image_url as product_image
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE c.user_id = ?
      ORDER BY ci.added_at DESC
    `, [req.user.id]);
    
    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    const formattedItems = cartItems.map(item => ({
      id: item.id,
      productId: item.product_id,
      title: item.title,
      price: parseFloat(item.price),
      quantity: item.quantity,
      isAvailable: item.is_available,
      sellerUsername: item.seller_username,
      productImage: item.product_image,
      subtotal: parseFloat(item.price) * item.quantity,
      addedAt: item.added_at
    }));
    
    res.json({
      items: formattedItems,
      total: parseFloat(total.toFixed(2)),
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
});

// POST /api/cart - Add item to cart
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    const db = req.app.locals.db;
    
    // Check if product exists and is available
    const [products] = await db.execute(
      'SELECT id, seller_id, title, is_available FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = products[0];
    
    if (!product.is_available) {
      return res.status(400).json({ message: 'Product is not available' });
    }
    
    if (product.seller_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot add your own product to cart' });
    }
    
    // Get or create user's cart
    let [carts] = await db.execute(
      'SELECT id FROM carts WHERE user_id = ?',
      [req.user.id]
    );
    
    let cartId;
    if (carts.length === 0) {
      const [result] = await db.execute(
        'INSERT INTO carts (user_id) VALUES (?)',
        [req.user.id]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }
    
    // Check if item already in cart
    const [existingItems] = await db.execute(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );
    
    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      await db.execute(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
      
      res.json({ 
        message: 'Cart item quantity updated',
        quantity: newQuantity 
      });
    } else {
      // Add new item
      await db.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, productId, quantity]
      );
      
      res.status(201).json({ 
        message: 'Item added to cart successfully',
        quantity: quantity 
      });
    }
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
});

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const db = req.app.locals.db;
    
    // Check if cart item belongs to user
    const [cartItems] = await db.execute(`
      SELECT ci.id FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [req.params.itemId, req.user.id]);
    
    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    // Update quantity
    await db.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, req.params.itemId]
    );
    
    res.json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Error updating cart item' });
  }
});

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Check if cart item belongs to user
    const [cartItems] = await db.execute(`
      SELECT ci.id FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [req.params.itemId, req.user.id]);
    
    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    // Delete cart item
    await db.execute('DELETE FROM cart_items WHERE id = ?', [req.params.itemId]);
    
    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Error removing item from cart' });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    await db.execute(`
      DELETE ci FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = ?
    `, [req.user.id]);
    
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
});

module.exports = router;
