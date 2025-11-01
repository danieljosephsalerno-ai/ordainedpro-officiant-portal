const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Ceremony = require('../models/Ceremony');
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * POST /api/email/send-meeting-invite
 * Send calendar meeting invitation
 */
router.post('/send-meeting-invite', [
  authMiddleware,
  body('ceremonyId').isMongoId().withMessage('Invalid ceremony ID'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('body').trim().isLength({ min: 1 }).withMessage('Message body is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('meetingType').isIn(['video', 'phone', 'in-person']).withMessage('Invalid meeting type'),
  body('responseDeadline').isISO8601().withMessage('Invalid response deadline format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      ceremonyId,
      subject,
      body,
      date,
      time,
      duration,
      meetingType,
      location,
      responseDeadline
    } = req.body;

    // Verify ceremony and access
    const ceremony = await Ceremony.findById(ceremonyId)
      .populate('officiantId', 'firstName lastName email')
      .populate('brideId', 'firstName lastName email')
      .populate('groomId', 'firstName lastName email');

    if (!ceremony) {
      return res.status(404).json({ error: 'Ceremony not found' });
    }

    // Only officiant can send meeting invites
    if (ceremony.officiantId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the officiant can send meeting invitations' });
    }

    // Prepare meeting data
    const meetingData = {
      subject,
      body,
      date,
      time,
      duration,
      meetingType,
      location: location || '',
      responseDeadline
    };

    // Send calendar invitation using EmailService
    const emailService = req.app.locals.emailService;
    const result = await emailService.sendCalendarInvitation(meetingData, ceremony);

    if (result.success) {
      // Add meeting to ceremony record
      await ceremony.addMeeting({
        date: new Date(`${date}T${time}`),
        duration,
        type: 'consultation',
        notes: body,
        attendees: [
          { userId: ceremony.brideId._id, attended: false },
          { userId: ceremony.groomId._id, attended: false }
        ]
      });

      // Emit real-time notification
      const socketService = req.app.locals.socketService;
      if (socketService) {
        socketService.emitToRoom(`ceremony-${ceremonyId}`, 'meeting-invite-sent', {
          meeting: meetingData,
          ceremony
        });
      }

      res.json({
        success: true,
        message: 'Meeting invitation sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ error: 'Failed to send meeting invitation' });
    }

  } catch (error) {
    console.error('Error sending meeting invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email/process-response
 * Process email responses (ACCEPT/DECLINE/RESCHEDULE)
 */
router.post('/process-response', [
  authMiddleware,
  body('messageId').trim().isLength({ min: 1 }).withMessage('Message ID is required'),
  body('response').isIn(['ACCEPT', 'DECLINE', 'RESCHEDULE']).withMessage('Invalid response'),
  body('senderEmail').isEmail().withMessage('Invalid sender email'),
  body('responseBody').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId, response, senderEmail, responseBody } = req.body;

    // Find the original message
    const originalMessage = await Message.findOne({ messageId })
      .populate('ceremonyId');

    if (!originalMessage) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const ceremony = originalMessage.ceremonyId;

    // Verify the sender is a ceremony participant
    const participant = ceremony.getParticipantByEmail(senderEmail);
    if (!participant) {
      return res.status(403).json({ error: 'Sender not authorized for this ceremony' });
    }

    // Create response message
    const responseMessageData = {
      ceremonyId: ceremony._id,
      subject: `Re: ${originalMessage.subject}`,
      body: `${response}: ${responseBody || 'No additional message'}`,
      senderEmail: senderEmail,
      senderName: participant.fullName,
      senderType: participant.userType,
      recipients: [
        {
          email: ceremony.officiant.email,
          name: ceremony.officiant.fullName,
          type: 'to'
        }
      ],
      threadId: originalMessage.threadId,
      isReply: true,
      parentMessageId: originalMessage.messageId
    };

    // Save response message
    const responseMessage = new Message(responseMessageData);
    await responseMessage.save();

    // Update meeting status based on response
    const meetingResponse = {
      messageId: originalMessage.messageId,
      response: response.toLowerCase(),
      respondedBy: participant._id,
      respondedAt: new Date(),
      responseMessage: responseBody
    };

    // Update ceremony meeting record
    await Ceremony.updateOne(
      {
        _id: ceremony._id,
        'meetings.date': { $exists: true }
      },
      {
        $push: { 'meetings.$.responses': meetingResponse }
      }
    );

    // Emit real-time notification to officiant
    const socketService = req.app.locals.socketService;
    if (socketService) {
      socketService.emitToRoom(`ceremony-${ceremony._id}`, 'meeting-response', {
        response: response.toLowerCase(),
        participant: participant.fullName,
        message: responseBody,
        ceremony
      });
    }

    // Send confirmation email to participant
    const confirmationData = {
      ceremonyId: ceremony._id,
      subject: `Meeting Response Received: ${response}`,
      body: `Thank you for your response. We have received your ${response.toLowerCase()} for the meeting invitation.${responseBody ? `\n\nYour message: ${responseBody}` : ''}\n\nWe will be in touch soon with next steps.`,
      senderEmail: process.env.SMTP_USER,
      senderName: ceremony.officiant.fullName,
      senderType: 'system',
      recipients: [
        {
          email: senderEmail,
          name: participant.fullName,
          type: 'to'
        }
      ]
    };

    const emailService = req.app.locals.emailService;
    await emailService.sendEmail(confirmationData);

    res.json({
      success: true,
      message: 'Response processed successfully',
      response: response.toLowerCase()
    });

  } catch (error) {
    console.error('Error processing email response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/email/status
 * Get email service status
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const emailService = req.app.locals.emailService;
    const status = emailService.getStatus();

    res.json({
      emailService: status,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/email/test-connection
 * Test email connection
 */
router.post('/test-connection', authMiddleware, async (req, res) => {
  try {
    // Only allow officiants to test email connection
    if (req.user.userType !== 'officiant') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const emailService = req.app.locals.emailService;

    // Test SMTP connection
    const testResult = await emailService.smtpTransporter.verify();

    if (testResult) {
      res.json({
        success: true,
        message: 'Email connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email connection failed'
      });
    }

  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      error: 'Email connection test failed',
      details: error.message
    });
  }
});

/**
 * POST /api/email/send-test
 * Send test email
 */
router.post('/send-test', [
  authMiddleware,
  body('to').isEmail().withMessage('Invalid recipient email'),
  body('subject').optional().trim(),
  body('body').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only allow officiants to send test emails
    if (req.user.userType !== 'officiant') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { to, subject, body } = req.body;

    const testEmailData = {
      ceremonyId: null, // Test email doesn't need ceremony
      subject: subject || 'Test Email from OrdainedPro Portal',
      body: body || 'This is a test email from the OrdainedPro communication portal. If you received this, the email system is working correctly.',
      senderEmail: req.user.email,
      senderName: req.user.fullName,
      senderType: 'officiant',
      recipients: [{ email: to, type: 'to' }]
    };

    const emailService = req.app.locals.emailService;
    const result = await emailService.sendEmail(testEmailData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/email/auto-reply/:ceremonyId
 * Update auto-reply settings for ceremony
 */
router.put('/auto-reply/:ceremonyId', [
  authMiddleware,
  param('ceremonyId').isMongoId().withMessage('Invalid ceremony ID'),
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be 500 characters or less')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ceremonyId } = req.params;
    const { enabled, message } = req.body;

    const ceremony = await Ceremony.findById(ceremonyId);
    if (!ceremony) {
      return res.status(404).json({ error: 'Ceremony not found' });
    }

    // Only officiant can update auto-reply settings
    if (ceremony.officiantId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the officiant can update auto-reply settings' });
    }

    // Update auto-reply settings
    ceremony.emailConfig = ceremony.emailConfig || {};
    ceremony.emailConfig.autoReplyEnabled = enabled;
    if (message) {
      ceremony.emailConfig.autoReplyMessage = message;
    }

    await ceremony.save();

    res.json({
      success: true,
      message: 'Auto-reply settings updated successfully',
      settings: {
        enabled: ceremony.emailConfig.autoReplyEnabled,
        message: ceremony.emailConfig.autoReplyMessage
      }
    });

  } catch (error) {
    console.error('Error updating auto-reply settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/email/analytics/:ceremonyId
 * Get email analytics for ceremony
 */
router.get('/analytics/:ceremonyId', [
  authMiddleware,
  param('ceremonyId').isMongoId().withMessage('Invalid ceremony ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ceremonyId } = req.params;

    const ceremony = await Ceremony.findById(ceremonyId);
    if (!ceremony) {
      return res.status(404).json({ error: 'Ceremony not found' });
    }

    if (!ceremony.isParticipant(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get email analytics
    const analytics = await Message.aggregate([
      { $match: { ceremonyId: ceremony._id, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          messagesBySender: {
            $push: {
              senderType: '$senderType',
              sentAt: '$sentAt'
            }
          }
        }
      },
      {
        $project: {
          totalMessages: 1,
          messagesByType: {
            $reduce: {
              input: '$messagesBySender',
              initialValue: { officiant: 0, bride: 0, groom: 0, system: 0 },
              in: {
                officiant: {
                  $cond: [
                    { $eq: ['$$this.senderType', 'officiant'] },
                    { $add: ['$$value.officiant', 1] },
                    '$$value.officiant'
                  ]
                },
                bride: {
                  $cond: [
                    { $eq: ['$$this.senderType', 'bride'] },
                    { $add: ['$$value.bride', 1] },
                    '$$value.bride'
                  ]
                },
                groom: {
                  $cond: [
                    { $eq: ['$$this.senderType', 'groom'] },
                    { $add: ['$$value.groom', 1] },
                    '$$value.groom'
                  ]
                },
                system: {
                  $cond: [
                    { $eq: ['$$this.senderType', 'system'] },
                    { $add: ['$$value.system', 1] },
                    '$$value.system'
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    // Get response rates for meeting invitations
    const meetingInvites = await Message.countDocuments({
      ceremonyId: ceremony._id,
      subject: { $regex: /meeting.*request|invitation/i },
      senderType: 'officiant'
    });

    const meetingResponses = await Message.countDocuments({
      ceremonyId: ceremony._id,
      subject: { $regex: /re:.*meeting/i },
      senderType: { $in: ['bride', 'groom'] }
    });

    const responseRate = meetingInvites > 0 ? (meetingResponses / meetingInvites * 100) : 0;

    res.json({
      analytics: analytics[0] || { totalMessages: 0, messagesByType: {} },
      meetingInvites,
      meetingResponses,
      responseRate: Math.round(responseRate),
      ceremony: {
        name: ceremony.displayName,
        date: ceremony.ceremonyDate,
        status: ceremony.status
      }
    });

  } catch (error) {
    console.error('Error getting email analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
