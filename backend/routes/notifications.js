// Notification routes - Handle user notifications
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/notifications - Get user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Normalize & sanitize query params to avoid driver/SQL edge cases on older servers
    const raw = req.query || {};
    const unread_only = Array.isArray(raw.unread_only) ? raw.unread_only[0] : (raw.unread_only ?? 'false');
    const page = parseInt(Array.isArray(raw.page) ? raw.page[0] : (raw.page ?? '1'), 10) || 1;
    const limit = parseInt(Array.isArray(raw.limit) ? raw.limit[0] : (raw.limit ?? '20'), 10) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = String(unread_only) === 'true';

    const db = req.app.locals.db;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Use a safe alias name (older SQL parsers may misinterpret short reserved tokens)
    let query = `
      SELECT n.*, 
             CASE 
               WHEN n.type = 'order' THEN o.total_amount
               WHEN n.type = 'offer' THEN offer_tbl.offered_price
               ELSE NULL
             END as related_amount,
             CASE 
               WHEN n.type = 'order' THEN CONCAT('Order #', n.related_id)
               WHEN n.type = 'offer' THEN CONCAT('Offer #', n.related_id)
               WHEN n.type = 'message' THEN 'Message'
               ELSE 'System'
             END as type_label
      FROM notifications n
      LEFT JOIN orders o ON n.type = 'order' AND n.related_id = o.id
      LEFT JOIN offers offer_tbl ON n.type = 'offer' AND n.related_id = offer_tbl.id
      WHERE n.user_id = ?
    `;

    const params = [Number(req.user.id)];

    if (unreadOnly) {
      query += ' AND n.is_read = false';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    // Sanitize param array to primitives and validate placeholder count
    const sanitizedParams = params.map(p => (Array.isArray(p) ? p[0] : (p === undefined ? null : p)));
    try {
      const placeholderCount = (query.match(/\?/g) || []).length;
      if (placeholderCount !== sanitizedParams.length) {
        console.error('Get notifications error: placeholder/param count mismatch', { placeholderCount, paramCount: sanitizedParams.length, query, params: sanitizedParams });
        return res.status(500).json({ message: 'Internal server error preparing database query' });
      }
    } catch (e) {
      console.error('Error validating notifications query params', e);
    }

    console.debug('Executing notifications query', { query, params: sanitizedParams.map(p => (p === null ? 'null' : typeof p + ':' + p)) });

    // Use non-prepared query to avoid mysql2 prepared-statement argument edge-cases on some server versions
    const [notifications] = await db.query(query, sanitizedParams);
    
    // Get unread count
    const [unreadCount] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [req.user.id]
    );
    
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      typeLabel: notification.type_label,
      relatedId: notification.related_id,
      relatedAmount: notification.related_amount ? parseFloat(notification.related_amount) : null,
      isRead: notification.is_read,
      createdAt: notification.created_at
    }));
    
    res.json({
      notifications: formattedNotifications,
      unreadCount: unreadCount[0].count,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: formattedNotifications.length
      }
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Verify notification belongs to user
    const [notifications] = await db.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await db.execute(
      'UPDATE notifications SET is_read = true WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [req.user.id]
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Verify notification belongs to user
    const [notifications] = await db.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await db.execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// POST /api/notifications/test - Create test notification (development only)
router.post('/test', authMiddleware, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Test endpoints not available in production' });
    }
    
    const { title = 'Test Notification', message = 'This is a test notification', type = 'system' } = req.body;
    
    const db = req.app.locals.db;
    
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req.user.id, title, message, type]
    );
    
    res.status(201).json({
      message: 'Test notification created',
      notificationId: result.insertId
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({ message: 'Error creating test notification' });
  }
});

module.exports = router;
