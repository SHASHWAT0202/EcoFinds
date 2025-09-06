// Order routes - Handle order creation and management with QR code generation
const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/orders - Create order from cart (mock checkout)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'mock' } = req.body;
    
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    
    const db = req.app.locals.db;
    
    // Get cart items
    const [cartItems] = await db.execute(`
      SELECT ci.*, p.price, p.title, p.seller_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      WHERE c.user_id = ? AND p.is_available = true
    `, [req.user.id]);
    
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'No items in cart or items unavailable' });
    }
    
    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    // Start transaction
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (buyer_id, total_amount, shipping_address, status, payment_status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, totalAmount, shippingAddress, 'pending', 'pending']
      );
      
      const orderId = orderResult.insertId;
      
      // Create order items
      for (const item of cartItems) {
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.seller_id, item.quantity, item.price]
        );
        
        // Create notifications for sellers
        await connection.execute(
          'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
          [
            item.seller_id,
            'New Order Received',
            `You received an order for "${item.title}"`,
            'order',
            orderId
          ]
        );
      }
      
      // Generate QR code for order
      const qrData = JSON.stringify({
        orderId: orderId,
        buyerId: req.user.id,
        totalAmount: totalAmount,
        timestamp: new Date().toISOString()
      });
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Update order with QR code
      await connection.execute(
        'UPDATE orders SET qr_code = ? WHERE id = ?',
        [qrCodeDataURL, orderId]
      );
      
      // Clear cart
      await connection.execute(`
        DELETE ci FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.user_id = ?
      `, [req.user.id]);
      
      await connection.commit();
      
      res.status(201).json({
        message: 'Order created successfully',
        orderId,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        qrCode: qrCodeDataURL,
        itemCount: cartItems.length,
        status: 'pending'
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// GET /api/orders - Get user's orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type = 'all' } = req.query; // 'buy', 'sell', or 'all'
    const db = req.app.locals.db;
    
    let orders = [];
    
    if (type === 'buy' || type === 'all') {
      // Orders as buyer
      const [buyOrders] = await db.execute(`
        SELECT o.*, 'buyer' as order_type,
               COUNT(oi.id) as item_count,
               GROUP_CONCAT(DISTINCT CONCAT(oi.quantity, 'x ', p.title)) as items_summary
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.buyer_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `, [req.user.id]);
      
      orders.push(...buyOrders);
    }
    
    if (type === 'sell' || type === 'all') {
      // Orders as seller
      const [sellOrders] = await db.execute(`
        SELECT DISTINCT o.*, 'seller' as order_type,
               u.username as buyer_username,
               COUNT(oi.id) as item_count,
               SUM(oi.price * oi.quantity) as seller_total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN users u ON o.buyer_id = u.id
        WHERE oi.seller_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `, [req.user.id]);
      
      orders.push(...sellOrders);
    }
    
    // Format response
    const formattedOrders = orders.map(order => ({
      ...order,
      totalAmount: parseFloat(order.total_amount || order.seller_total || 0),
      itemCount: order.item_count,
      orderType: order.order_type,
      buyerUsername: order.buyer_username || null,
      itemsSummary: order.items_summary || null
    }));
    
    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// GET /api/orders/:id - Get specific order details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Get order with access check
    const [orders] = await db.execute(`
      SELECT o.*, u.username as buyer_username, u.full_name as buyer_name,
             (o.buyer_id = ? OR EXISTS(
               SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.seller_id = ?
             )) as has_access
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.id = ?
    `, [req.user.id, req.user.id, req.params.id]);
    
    if (orders.length === 0 || !orders[0].has_access) {
      return res.status(404).json({ message: 'Order not found or access denied' });
    }
    
    // Get order items
    const [orderItems] = await db.execute(`
      SELECT oi.*, p.title, p.description, u.username as seller_username,
             pi.image_url as product_image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON oi.seller_id = u.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE oi.order_id = ?
    `, [req.params.id]);
    
    const order = {
      ...orders[0],
      totalAmount: parseFloat(orders[0].total_amount),
      items: orderItems.map(item => ({
        id: item.id,
        productId: item.product_id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.price) * item.quantity,
        sellerUsername: item.seller_username,
        productImage: item.product_image
      }))
    };
    
    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

// PUT /api/orders/:id/status - Update order status (seller only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const db = req.app.locals.db;
    
    // Check if user is seller for this order
    const [orders] = await db.execute(`
      SELECT DISTINCT o.id, o.buyer_id
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ? AND oi.seller_id = ?
    `, [req.params.id, req.user.id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found or you are not authorized to update it' });
    }
    
    // Update status
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    
    // Create notification for buyer
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
      [
        orders[0].buyer_id,
        'Order Status Updated',
        `Your order status has been updated to: ${status}`,
        'order',
        req.params.id
      ]
    );
    
    res.json({ message: 'Order status updated successfully', status });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

module.exports = router;
