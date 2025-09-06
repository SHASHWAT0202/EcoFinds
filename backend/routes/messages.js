// Message routes - Handle messaging between users
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Generate conversation ID between two users
function generateConversationId(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort((a, b) => a - b);
  return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
}

// POST /api/messages - Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content, productId } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }
    
    const db = req.app.locals.db;
    
    // Verify receiver exists
    const [receivers] = await db.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [receiverId]
    );
    
    if (receivers.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Generate conversation ID
    const conversationId = generateConversationId(req.user.id, receiverId);
    
    // Insert message
    const [result] = await db.execute(
      'INSERT INTO messages (conversation_id, sender_id, receiver_id, product_id, content) VALUES (?, ?, ?, ?, ?)',
      [conversationId, req.user.id, receiverId, productId || null, content]
    );
    
    // Create notification for receiver
    let notificationMessage = `New message from ${req.user.username}`;
    if (productId) {
      const [products] = await db.execute('SELECT title FROM products WHERE id = ?', [productId]);
      if (products.length > 0) {
        notificationMessage += ` about "${products[0].title}"`;
      }
    }
    
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
      [receiverId, 'New Message', notificationMessage, 'message', result.insertId]
    );
    
    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertId,
      conversationId,
      sentAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// GET /api/messages - Get messages for a conversation
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { conversation_id, with_user, product_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let conversationId = conversation_id;
    
    // If with_user is provided instead of conversation_id, generate it
    if (!conversationId && with_user) {
      conversationId = generateConversationId(req.user.id, parseInt(with_user));
    }
    
    if (!conversationId) {
      return res.status(400).json({ message: 'conversation_id or with_user parameter is required' });
    }
    
    const db = req.app.locals.db;
    
    let query = `
      SELECT m.*, 
             s.username as sender_username, s.full_name as sender_name,
             r.username as receiver_username, r.full_name as receiver_name,
             p.title as product_title
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      LEFT JOIN products p ON m.product_id = p.id
      WHERE m.conversation_id = ? 
        AND (m.sender_id = ? OR m.receiver_id = ?)
    `;
    
    const params = [conversationId, req.user.id, req.user.id];
    
    if (product_id) {
      query += ' AND m.product_id = ?';
      params.push(product_id);
    }
    
    query += ' ORDER BY m.created_at ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [messages] = await db.execute(query, params);
    
    // Mark messages as read for current user
    if (messages.length > 0) {
      await db.execute(
        'UPDATE messages SET is_read = true WHERE conversation_id = ? AND receiver_id = ?',
        [conversationId, req.user.id]
      );
    }
    
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      productId: msg.product_id,
      content: msg.content,
      isRead: msg.is_read,
      createdAt: msg.created_at,
      senderUsername: msg.sender_username,
      senderName: msg.sender_name,
      receiverUsername: msg.receiver_username,
      receiverName: msg.receiver_name,
      productTitle: msg.product_title,
      isOwnMessage: msg.sender_id === req.user.id
    }));
    
    res.json({
      messages: formattedMessages,
      conversationId,
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: formattedMessages.length
      }
    });
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// GET /api/messages/conversations - Get user's conversations list
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [conversations] = await db.execute(`
      SELECT DISTINCT 
        m.conversation_id,
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        CASE 
          WHEN m.sender_id = ? THEN u2.username 
          ELSE u1.username 
        END as other_username,
        CASE 
          WHEN m.sender_id = ? THEN u2.full_name 
          ELSE u1.full_name 
        END as other_user_name,
        p.title as product_title,
        p.id as product_id,
        last_msg.content as last_message,
        last_msg.created_at as last_message_time,
        last_msg.sender_id as last_sender_id,
        unread.unread_count
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      LEFT JOIN products p ON m.product_id = p.id
      JOIN (
        SELECT conversation_id, MAX(created_at) as max_time
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY conversation_id
      ) latest ON m.conversation_id = latest.conversation_id AND m.created_at = latest.max_time
      LEFT JOIN messages last_msg ON m.id = last_msg.id
      LEFT JOIN (
        SELECT conversation_id, COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = ? AND is_read = false
        GROUP BY conversation_id
      ) unread ON m.conversation_id = unread.conversation_id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY last_msg.created_at DESC
    `, [
      req.user.id, req.user.id, req.user.id, 
      req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id
    ]);
    
    const formattedConversations = conversations.map(conv => ({
      conversationId: conv.conversation_id,
      otherUserId: conv.other_user_id,
      otherUsername: conv.other_username,
      otherUserName: conv.other_user_name,
      productId: conv.product_id,
      productTitle: conv.product_title,
      lastMessage: conv.last_message,
      lastMessageTime: conv.last_message_time,
      isLastMessageFromMe: conv.last_sender_id === req.user.id,
      unreadCount: conv.unread_count || 0
    }));
    
    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Verify user is the receiver of this message
    const [messages] = await db.execute(
      'SELECT id FROM messages WHERE id = ? AND receiver_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found or you are not the receiver' });
    }
    
    await db.execute(
      'UPDATE messages SET is_read = true WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

module.exports = router;
