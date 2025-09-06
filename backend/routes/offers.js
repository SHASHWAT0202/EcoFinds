// Offer routes - Handle price negotiations between buyers and sellers
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/offers - Make an offer on a product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, offeredPrice, message } = req.body;
    
    if (!productId || !offeredPrice) {
      return res.status(400).json({ message: 'Product ID and offered price are required' });
    }
    
    if (offeredPrice <= 0) {
      return res.status(400).json({ message: 'Offered price must be greater than 0' });
    }
    
    const db = req.app.locals.db;
    
    // Get product and seller info
    const [products] = await db.execute(
      'SELECT id, seller_id, title, price, is_available FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = products[0];
    
    if (!product.is_available) {
      return res.status(400).json({ message: 'Product is not available for offers' });
    }
    
    if (product.seller_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot make an offer on your own product' });
    }
    
    // Check if user already has a pending offer on this product
    const [existingOffers] = await db.execute(
      'SELECT id FROM offers WHERE product_id = ? AND buyer_id = ? AND status = "pending"',
      [productId, req.user.id]
    );
    
    if (existingOffers.length > 0) {
      return res.status(409).json({ message: 'You already have a pending offer on this product' });
    }
    
    // Create offer
    const [result] = await db.execute(
      'INSERT INTO offers (product_id, buyer_id, seller_id, offered_price, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, req.user.id, product.seller_id, offeredPrice, message, 'pending']
    );
    
    // Create notification for seller
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
      [
        product.seller_id,
        'New Offer Received',
        `You received an offer of $${offeredPrice} for "${product.title}"`,
        'offer',
        result.insertId
      ]
    );
    
    res.status(201).json({
      message: 'Offer submitted successfully',
      offerId: result.insertId,
      offeredPrice: parseFloat(offeredPrice),
      originalPrice: parseFloat(product.price),
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Error creating offer' });
  }
});

// GET /api/offers - Get offers (buyer's offers or seller's received offers)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { seller = 'false', status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const isSeller = seller === 'true';
    
    const db = req.app.locals.db;
    
    let query, params;
    
    if (isSeller) {
      // Get offers received as seller
      query = `
        SELECT o.*, p.title as product_title, p.price as original_price,
               u.username as buyer_username, u.full_name as buyer_name,
               pi.image_url as product_image
        FROM offers o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.buyer_id = u.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
        WHERE o.seller_id = ?
      `;
      params = [req.user.id];
    } else {
      // Get offers made as buyer
      query = `
        SELECT o.*, p.title as product_title, p.price as original_price,
               u.username as seller_username, u.full_name as seller_name,
               pi.image_url as product_image
        FROM offers o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.seller_id = u.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
        WHERE o.buyer_id = ?
      `;
      params = [req.user.id];
    }
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [offers] = await db.execute(query, params);
    
    const formattedOffers = offers.map(offer => ({
      id: offer.id,
      productId: offer.product_id,
      productTitle: offer.product_title,
      productImage: offer.product_image,
      originalPrice: parseFloat(offer.original_price),
      offeredPrice: parseFloat(offer.offered_price),
      message: offer.message,
      status: offer.status,
      buyerUsername: offer.buyer_username,
      buyerName: offer.buyer_name,
      sellerUsername: offer.seller_username,
      sellerName: offer.seller_name,
      createdAt: offer.created_at,
      updatedAt: offer.updated_at
    }));
    
    res.json({
      offers: formattedOffers,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: formattedOffers.length
      }
    });
    
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Error fetching offers' });
  }
});

// PUT /api/offers/:id - Accept or reject an offer (seller only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { action, counterOffer } = req.body; // action: 'accept', 'reject', 'counter'
    const validActions = ['accept', 'reject', 'counter'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use accept, reject, or counter' });
    }
    
    if (action === 'counter' && (!counterOffer || counterOffer <= 0)) {
      return res.status(400).json({ message: 'Counter offer price is required and must be greater than 0' });
    }
    
    const db = req.app.locals.db;
    
    // Get offer details and verify seller ownership
    const [offers] = await db.execute(`
      SELECT o.*, p.title as product_title, u.username as buyer_username
      FROM offers o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.id = ? AND o.seller_id = ?
    `, [req.params.id, req.user.id]);
    
    if (offers.length === 0) {
      return res.status(404).json({ message: 'Offer not found or you are not authorized to modify it' });
    }
    
    const offer = offers[0];
    
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending offers can be modified' });
    }
    
    let updateQuery, updateParams, notificationMessage;
    
    if (action === 'accept') {
      updateQuery = 'UPDATE offers SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      updateParams = [req.params.id];
      notificationMessage = `Your offer of $${offer.offered_price} for "${offer.product_title}" was accepted!`;
      
      // TODO: In a real app, you might want to create an order automatically or update product availability
      
    } else if (action === 'reject') {
      updateQuery = 'UPDATE offers SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      updateParams = [req.params.id];
      notificationMessage = `Your offer for "${offer.product_title}" was rejected.`;
      
    } else if (action === 'counter') {
      // For simplicity, we'll update the existing offer with counter price and reset to pending
      // In a more complex system, you might create a new offer record for the counter
      updateQuery = 'UPDATE offers SET offered_price = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      updateParams = [counterOffer, `Counter offer: $${counterOffer}`, req.params.id];
      notificationMessage = `Seller made a counter offer of $${counterOffer} for "${offer.product_title}"`;
    }
    
    // Start transaction
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update offer
      await connection.execute(updateQuery, updateParams);
      
      // Create notification for buyer
      await connection.execute(
        'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
        [
          offer.buyer_id,
          'Offer Update',
          notificationMessage,
          'offer',
          req.params.id
        ]
      );
      
      await connection.commit();
      
      res.json({
        message: `Offer ${action}ed successfully`,
        action,
        offerId: req.params.id,
        newPrice: action === 'counter' ? parseFloat(counterOffer) : parseFloat(offer.offered_price)
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ message: 'Error updating offer' });
  }
});

// DELETE /api/offers/:id - Withdraw an offer (buyer only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Check if user owns the offer and it's pending
    const [offers] = await db.execute(
      'SELECT id, status, seller_id FROM offers WHERE id = ? AND buyer_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (offers.length === 0) {
      return res.status(404).json({ message: 'Offer not found or you are not authorized to withdraw it' });
    }
    
    if (offers[0].status !== 'pending') {
      return res.status(400).json({ message: 'Only pending offers can be withdrawn' });
    }
    
    // Update offer status to withdrawn
    await db.execute(
      'UPDATE offers SET status = "withdrawn", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );
    
    // Create notification for seller
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
      [
        offers[0].seller_id,
        'Offer Withdrawn',
        'A buyer has withdrawn their offer',
        'offer',
        req.params.id
      ]
    );
    
    res.json({ message: 'Offer withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw offer error:', error);
    res.status(500).json({ message: 'Error withdrawing offer' });
  }
});

module.exports = router;
