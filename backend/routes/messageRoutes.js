const express = require('express');
const router = express.Router();
const { body, validationResult, query, param } = require('express-validator');
const Message = require('../models/Message');
const Ceremony = require('../models/Ceremony');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * GET /api/messages/ceremony/:ceremonyId
 * Get all messages for a specific ceremony
 */
router.get('/ceremony/:ceremonyId', [
  authMiddleware,
  param('ceremonyId').isMongoId().withMessage('Invalid ceremony ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ceremonyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;

    // Check if user has access to this ceremony
    const ceremony = await Ceremony.findById(ceremonyId);
    if (!ceremony) {
      return res.status(404).json({ error: 'Ceremony not found' });
    }

    if (!ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query
    let query = {
      ceremonyId,
      isDeleted: false
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } }
      ];
    }

    // Get messages with pagination
    const messages = await Message.find(query)
      .populate('ceremonyId', 'ceremonyName brideName groomName')
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / limit);

    // Mark messages as read by current user
    await Message.updateMany(
      {
        ceremonyId,
        isDeleted: false,
        'readBy.userId': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            userId: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/messages/send
 * Send a new message via email
 */
router.post('/send', [
  authMiddleware,
  body('ceremonyId').isMongoId().withMessage('Invalid ceremony ID'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('body').trim().isLength({ min: 1 }).withMessage('Message body is required'),
  body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('recipients.*.email').isEmail().withMessage('Invalid recipient email'),
  body('recipients.*.type').isIn(['to', 'cc', 'bcc']).withMessage('Invalid recipient type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ceremonyId, subject, body, recipients, htmlBody, attachments } = req.body;

    // Verify ceremony access
    const ceremony = await Ceremony.findById(ceremonyId)
      .populate('officiantId', 'firstName lastName email')
      .populate('brideId', 'firstName lastName email')
      .populate('groomId', 'firstName lastName email');

    if (!ceremony) {
      return res.status(404).json({ error: 'Ceremony not found' });
    }

    if (!ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get sender information
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Determine sender type
    let senderType = 'system';
    if (ceremony.officiantId._id.toString() === req.user.id) senderType = 'officiant';
    else if (ceremony.brideId._id.toString() === req.user.id) senderType = 'bride';
    else if (ceremony.groomId._id.toString() === req.user.id) senderType = 'groom';

    // Prepare message data
    const messageData = {
      ceremonyId,
      subject,
      body,
      htmlBody: htmlBody || body.replace(/\n/g, '<br>'),
      senderEmail: sender.email,
      senderName: sender.fullName,
      senderType,
      recipients: recipients.map(r => ({
        email: r.email.toLowerCase(),
        name: r.name || r.email,
        type: r.type || 'to'
      })),
      attachments: attachments || []
    };

    // Send email using EmailService
    const emailService = req.app.locals.emailService;
    const result = await emailService.sendEmail(messageData);

    if (result.success) {
      // Emit real-time notification
      const socketService = req.app.locals.socketService;
      if (socketService) {
        socketService.emitToRoom(`ceremony-${ceremonyId}`, 'new-message', {
          message: result.message,
          ceremony
        });
      }

      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/messages/thread/:threadId
 * Get all messages in a conversation thread
 */
router.get('/thread/:threadId', [
  authMiddleware,
  param('threadId').trim().isLength({ min: 1 }).withMessage('Invalid thread ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { threadId } = req.params;

    // Get all messages in thread
    const messages = await Message.getThread(threadId);

    if (messages.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Check access to ceremony
    const ceremony = await Ceremony.findById(messages[0].ceremonyId);
    if (!ceremony || !ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ messages });

  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/messages/:messageId/read
 * Mark message as read by current user
 */
router.put('/:messageId/read', [
  authMiddleware,
  param('messageId').isMongoId().withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check access
    const ceremony = await Ceremony.findById(message.ceremonyId);
    if (!ceremony || !ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read
    await message.markAsReadBy(req.user.id);

    res.json({ success: true, message: 'Message marked as read' });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/messages/unread/count
 * Get count of unread messages for user's ceremonies
 */
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    // Get user's ceremonies
    const ceremonies = await Ceremony.findByParticipant(req.user.id);
    const ceremonyIds = ceremonies.map(c => c._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
      ceremonyId: { $in: ceremonyIds },
      isDeleted: false,
      'readBy.userId': { $ne: req.user.id }
    });

    res.json({ unreadCount });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Soft delete a message
 */
router.delete('/:messageId', [
  authMiddleware,
  param('messageId').isMongoId().withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check access and permissions
    const ceremony = await Ceremony.findById(message.ceremonyId);
    if (!ceremony || !ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow deletion by sender or officiant
    if (message.senderEmail !== req.user.email && ceremony.officiantId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    res.json({ success: true, message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/messages/:messageId/archive
 * Archive/unarchive a message
 */
router.put('/:messageId/archive', [
  authMiddleware,
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('archived').isBoolean().withMessage('Archived must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { archived } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check access
    const ceremony = await Ceremony.findById(message.ceremonyId);
    if (!ceremony || !ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    message.isArchived = archived;
    await message.save();

    res.json({
      success: true,
      message: `Message ${archived ? 'archived' : 'unarchived'} successfully`
    });

  } catch (error) {
    console.error('Error archiving message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/messages/bulk-action
 * Perform bulk actions on messages
 */
router.post('/bulk-action', [
  authMiddleware,
  body('messageIds').isArray({ min: 1 }).withMessage('At least one message ID is required'),
  body('messageIds.*').isMongoId().withMessage('Invalid message ID'),
  body('action').isIn(['delete', 'archive', 'unarchive', 'mark-read', 'mark-unread']).withMessage('Invalid action')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageIds, action } = req.body;

    // Get messages and verify access
    const messages = await Message.find({
      _id: { $in: messageIds },
      isDeleted: false
    });

    if (messages.length === 0) {
      return res.status(404).json({ error: 'No messages found' });
    }

    // Verify access to all messages
    const ceremonyIds = [...new Set(messages.map(m => m.ceremonyId.toString()))];
    const ceremonies = await Ceremony.find({ _id: { $in: ceremonyIds } });

    for (const ceremony of ceremonies) {
      if (!ceremony.isParticipant(req.user.id)) {
        return res.status(403).json({ error: 'Access denied to some messages' });
      }
    }

    // Perform bulk action
    let updateQuery = {};
    switch (action) {
      case 'delete':
        updateQuery = { isDeleted: true };
        break;
      case 'archive':
        updateQuery = { isArchived: true };
        break;
      case 'unarchive':
        updateQuery = { isArchived: false };
        break;
      case 'mark-read':
        // Handle read status separately
        for (const message of messages) {
          await message.markAsReadBy(req.user.id);
        }
        return res.json({ success: true, message: 'Messages marked as read' });
      case 'mark-unread':
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $pull: { readBy: { userId: req.user.id } } }
        );
        return res.json({ success: true, message: 'Messages marked as unread' });
    }

    if (Object.keys(updateQuery).length > 0) {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        updateQuery
      );
    }

    res.json({ success: true, message: `Bulk ${action} completed successfully` });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
