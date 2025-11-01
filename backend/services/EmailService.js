const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Message = require('../models/Message');
const Ceremony = require('../models/Ceremony');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class EmailService {
  constructor() {
    this.smtpTransporter = null;
    this.imapConnection = null;
    this.isMonitoring = false;
    this.monitoringInterval = null;

    this.initializeEmailConnections();
  }

  /**
   * Initialize SMTP and IMAP connections
   */
  async initializeEmailConnections() {
    try {
      // Initialize SMTP transporter
      this.smtpTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify SMTP connection
      await this.smtpTransporter.verify();
      console.log('✅ SMTP connection verified');

      // Initialize IMAP for receiving emails
      this.initializeIMAP();

    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
    }
  }

  /**
   * Initialize IMAP connection for receiving emails
   */
  initializeIMAP() {
    this.imapConnection = new Imap({
      user: process.env.IMAP_USER || process.env.SMTP_USER,
      password: process.env.IMAP_PASS || process.env.SMTP_PASS,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: process.env.IMAP_PORT || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    this.imapConnection.once('ready', () => {
      console.log('✅ IMAP connection ready');
      this.openInbox();
    });

    this.imapConnection.once('error', (err) => {
      console.error('❌ IMAP connection error:', err);
    });

    this.imapConnection.once('end', () => {
      console.log('📪 IMAP connection ended');
    });
  }

  /**
   * Open INBOX and start monitoring for new emails
   */
  openInbox() {
    this.imapConnection.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('❌ Error opening inbox:', err);
        return;
      }

      console.log('📧 Inbox opened successfully');
      this.startEmailMonitoring();
    });
  }

  /**
   * Start monitoring for new emails
   */
  startEmailMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Listen for new mail
    this.imapConnection.on('mail', (numNewMsgs) => {
      console.log(`📨 ${numNewMsgs} new message(s) received`);
      this.processNewEmails();
    });

    // Periodic check for new emails (every 30 seconds)
    this.monitoringInterval = setInterval(() => {
      this.processNewEmails();
    }, 30000);

    console.log('🔍 Email monitoring started');
  }

  /**
   * Stop email monitoring
   */
  stopEmailMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('⏹️ Email monitoring stopped');
  }

  /**
   * Process new emails from INBOX
   */
  async processNewEmails() {
    try {
      const search = this.imapConnection.search(['UNSEEN'], (err, results) => {
        if (err) {
          console.error('❌ Email search error:', err);
          return;
        }

        if (!results || results.length === 0) {
          return; // No new emails
        }

        const fetch = this.imapConnection.fetch(results, {
          bodies: '',
          markSeen: true
        });

        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('❌ Email parsing error:', err);
                return;
              }

              await this.processIncomingEmail(parsed);
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err);
        });
      });

    } catch (error) {
      console.error('❌ Error processing new emails:', error);
    }
  }

  /**
   * Process incoming email and save to database
   */
  async processIncomingEmail(emailData) {
    try {
      const senderEmail = emailData.from.value[0].address.toLowerCase();
      const senderName = emailData.from.value[0].name || emailData.from.value[0].address;

      // Find which ceremony this email belongs to
      const ceremony = await this.findCeremonyForEmail(senderEmail);

      if (!ceremony) {
        console.log(`📧 Email from ${senderEmail} not associated with any ceremony`);
        return;
      }

      // Determine sender type
      const senderType = this.determineSenderType(senderEmail, ceremony);

      // Extract recipients
      const recipients = this.extractRecipients(emailData);

      // Create message object
      const messageData = {
        messageId: emailData.messageId || `msg_${uuidv4()}`,
        ceremonyId: ceremony._id,
        subject: emailData.subject || '(No Subject)',
        body: emailData.text || '',
        htmlBody: emailData.html || '',
        senderEmail: senderEmail,
        senderName: senderName,
        senderType: senderType,
        recipients: recipients,
        sentAt: emailData.date || new Date(),
        emailHeaders: {
          messageId: emailData.messageId,
          inReplyTo: emailData.inReplyTo,
          references: emailData.references
        },
        attachments: this.processAttachments(emailData.attachments),
        threadId: this.generateThreadId(emailData, ceremony),
        isReply: !!(emailData.inReplyTo || emailData.references),
        rawEmail: emailData.raw || ''
      };

      // Save message to database
      const message = new Message(messageData);
      await message.save();

      console.log(`✅ Email processed and saved: ${emailData.subject}`);

      // Emit real-time notification
      this.emitNewMessage(message, ceremony);

      // Send auto-reply if configured
      await this.sendAutoReply(ceremony, senderEmail, emailData);

    } catch (error) {
      console.error('❌ Error processing incoming email:', error);
    }
  }

  /**
   * Send email message
   */
  async sendEmail(messageData) {
    try {
      const mailOptions = {
        from: {
          name: messageData.senderName || 'OrdainedPro Portal',
          address: process.env.SMTP_USER
        },
        to: messageData.recipients.filter(r => r.type === 'to').map(r => r.email),
        cc: messageData.recipients.filter(r => r.type === 'cc').map(r => r.email),
        bcc: messageData.recipients.filter(r => r.type === 'bcc').map(r => r.email),
        subject: messageData.subject,
        text: messageData.body,
        html: messageData.htmlBody,
        replyTo: messageData.senderEmail,
        headers: {
          'X-Ceremony-ID': messageData.ceremonyId,
          'X-Sender-Type': messageData.senderType
        }
      };

      // Add attachments if any
      if (messageData.attachments && messageData.attachments.length > 0) {
        mailOptions.attachments = messageData.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }));
      }

      const result = await this.smtpTransporter.sendMail(mailOptions);

      // Save sent message to database
      const message = new Message({
        ...messageData,
        messageId: result.messageId || `msg_${uuidv4()}`,
        status: 'sent',
        sentAt: new Date()
      });

      await message.save();

      console.log(`✅ Email sent successfully: ${messageData.subject}`);

      return {
        success: true,
        messageId: result.messageId,
        message: message
      };

    } catch (error) {
      console.error('❌ Error sending email:', error);

      // Save failed message to database
      const failedMessage = new Message({
        ...messageData,
        messageId: `msg_${uuidv4()}`,
        status: 'failed',
        processingError: error.message,
        sentAt: new Date()
      });

      await failedMessage.save();

      throw error;
    }
  }

  /**
   * Send calendar invitation
   */
  async sendCalendarInvitation(meetingData, ceremony) {
    try {
      const icsContent = this.generateICalContent(meetingData);

      const messageData = {
        ceremonyId: ceremony._id,
        subject: `📅 Meeting Request: ${meetingData.subject}`,
        body: this.generateMeetingEmailBody(meetingData, ceremony),
        htmlBody: this.generateMeetingEmailHTML(meetingData, ceremony),
        senderEmail: process.env.SMTP_USER,
        senderName: ceremony.officiant.fullName,
        senderType: 'officiant',
        recipients: [
          { email: ceremony.bride.email, name: ceremony.bride.fullName, type: 'to' },
          { email: ceremony.groom.email, name: ceremony.groom.fullName, type: 'to' }
        ],
        attachments: [{
          filename: `meeting-${meetingData.date}.ics`,
          content: icsContent,
          contentType: 'text/calendar'
        }]
      };

      return await this.sendEmail(messageData);

    } catch (error) {
      console.error('❌ Error sending calendar invitation:', error);
      throw error;
    }
  }

  /**
   * Send auto-reply if configured
   */
  async sendAutoReply(ceremony, senderEmail, originalEmail) {
    try {
      if (!ceremony.emailConfig?.autoReplyEnabled) {
        return;
      }

      // Don't send auto-reply to the officiant
      if (senderEmail === ceremony.officiant.email) {
        return;
      }

      // Check if we've already sent an auto-reply to this sender recently
      const recentAutoReply = await Message.findOne({
        ceremonyId: ceremony._id,
        senderType: 'system',
        'recipients.email': senderEmail,
        sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
      });

      if (recentAutoReply) {
        return; // Don't spam with auto-replies
      }

      const autoReplyData = {
        ceremonyId: ceremony._id,
        subject: `Re: ${originalEmail.subject}`,
        body: ceremony.emailConfig.autoReplyMessage,
        senderEmail: process.env.SMTP_USER,
        senderName: 'OrdainedPro Portal (Automated Response)',
        senderType: 'system',
        recipients: [{ email: senderEmail, type: 'to' }]
      };

      await this.sendEmail(autoReplyData);
      console.log(`🤖 Auto-reply sent to ${senderEmail}`);

    } catch (error) {
      console.error('❌ Error sending auto-reply:', error);
    }
  }

  /**
   * Find ceremony associated with email address
   */
  async findCeremonyForEmail(email) {
    try {
      // First try to find user by email
      const user = await User.findByEmail(email);

      if (!user) {
        return null;
      }

      // Find ceremony where this user is a participant
      const ceremony = await Ceremony.findOne({
        $or: [
          { officiantId: user._id },
          { brideId: user._id },
          { groomId: user._id }
        ],
        isArchived: false
      })
      .populate('officiantId', 'firstName lastName email')
      .populate('brideId', 'firstName lastName email')
      .populate('groomId', 'firstName lastName email');

      return ceremony;

    } catch (error) {
      console.error('❌ Error finding ceremony for email:', error);
      return null;
    }
  }

  /**
   * Determine sender type based on email and ceremony
   */
  determineSenderType(email, ceremony) {
    if (ceremony.officiant?.email === email) return 'officiant';
    if (ceremony.bride?.email === email) return 'bride';
    if (ceremony.groom?.email === email) return 'groom';
    return 'system';
  }

  /**
   * Extract recipients from email data
   */
  extractRecipients(emailData) {
    const recipients = [];

    // To recipients
    if (emailData.to) {
      emailData.to.value.forEach(addr => {
        recipients.push({
          email: addr.address.toLowerCase(),
          name: addr.name,
          type: 'to'
        });
      });
    }

    // CC recipients
    if (emailData.cc) {
      emailData.cc.value.forEach(addr => {
        recipients.push({
          email: addr.address.toLowerCase(),
          name: addr.name,
          type: 'cc'
        });
      });
    }

    // BCC recipients
    if (emailData.bcc) {
      emailData.bcc.value.forEach(addr => {
        recipients.push({
          email: addr.address.toLowerCase(),
          name: addr.name,
          type: 'bcc'
        });
      });
    }

    return recipients;
  }

  /**
   * Process email attachments
   */
  processAttachments(attachments) {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    return attachments.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      isInline: att.cid ? true : false
    }));
  }

  /**
   * Generate thread ID for email conversation
   */
  generateThreadId(emailData, ceremony) {
    // Use existing thread ID if this is a reply
    if (emailData.inReplyTo || emailData.references) {
      return `ceremony-${ceremony._id}-thread`;
    }

    // Create new thread ID
    return `ceremony-${ceremony._id}-thread`;
  }

  /**
   * Generate iCal content for calendar invitations
   */
  generateICalContent(meetingData) {
    const startDate = new Date(`${meetingData.date}T${meetingData.time}`);
    const endDate = new Date(startDate.getTime() + (meetingData.duration * 60000));

    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OrdainedPro//Wedding Planning//EN
BEGIN:VEVENT
UID:${uuidv4()}@ordainedpro.com
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${meetingData.subject}
DESCRIPTION:${meetingData.body.replace(/\n/g, '\\n')}
LOCATION:${meetingData.location || ''}
ORGANIZER:mailto:${process.env.SMTP_USER}
STATUS:TENTATIVE
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Generate meeting email body
   */
  generateMeetingEmailBody(meetingData, ceremony) {
    return `Dear ${ceremony.bride.firstName} and ${ceremony.groom.firstName},

You have been invited to a meeting!

Meeting Details:
📅 Date: ${new Date(meetingData.date).toLocaleDateString()}
🕐 Time: ${meetingData.time}
⏱️ Duration: ${meetingData.duration} minutes
📍 Type: ${meetingData.meetingType}
${meetingData.location ? `📍 Location: ${meetingData.location}` : ''}

Message:
${meetingData.body}

Please respond to this email with:
• ACCEPT - to confirm your attendance
• DECLINE - if you cannot attend
• RESCHEDULE - if you need a different time

A calendar invitation is attached to this email.

Best regards,
${ceremony.officiant.fullName}
Licensed Wedding Officiant`;
  }

  /**
   * Generate meeting email HTML
   */
  generateMeetingEmailHTML(meetingData, ceremony) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Meeting Invitation</h2>

      <p>Dear ${ceremony.bride.firstName} and ${ceremony.groom.firstName},</p>

      <p>You have been invited to a meeting!</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Meeting Details</h3>
        <p><strong>📅 Date:</strong> ${new Date(meetingData.date).toLocaleDateString()}</p>
        <p><strong>🕐 Time:</strong> ${meetingData.time}</p>
        <p><strong>⏱️ Duration:</strong> ${meetingData.duration} minutes</p>
        <p><strong>📍 Type:</strong> ${meetingData.meetingType}</p>
        ${meetingData.location ? `<p><strong>📍 Location:</strong> ${meetingData.location}</p>` : ''}
      </div>

      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Message:</h4>
        <p>${meetingData.body.replace(/\n/g, '<br>')}</p>
      </div>

      <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Please respond with:</h4>
        <ul>
          <li><strong>ACCEPT</strong> - to confirm your attendance</li>
          <li><strong>DECLINE</strong> - if you cannot attend</li>
          <li><strong>RESCHEDULE</strong> - if you need a different time</li>
        </ul>
      </div>

      <p>A calendar invitation is attached to this email.</p>

      <p>Best regards,<br>
      ${ceremony.officiant.fullName}<br>
      <em>Licensed Wedding Officiant</em></p>
    </div>`;
  }

  /**
   * Emit new message notification via Socket.IO
   */
  emitNewMessage(message, ceremony) {
    try {
      const io = require('../server').io;

      if (io) {
        io.to(`ceremony-${ceremony._id}`).emit('new-message', {
          message: message,
          ceremony: ceremony
        });

        console.log(`🔔 New message notification sent for ceremony ${ceremony._id}`);
      }
    } catch (error) {
      console.error('❌ Error emitting new message notification:', error);
    }
  }

  /**
   * Connect to IMAP and start monitoring
   */
  connect() {
    if (this.imapConnection) {
      this.imapConnection.connect();
    }
  }

  /**
   * Disconnect from IMAP
   */
  disconnect() {
    this.stopEmailMonitoring();
    if (this.imapConnection) {
      this.imapConnection.end();
    }
  }

  /**
   * Get email status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      smtpConnected: this.smtpTransporter ? true : false,
      imapConnected: this.imapConnection ? this.imapConnection.state === 'authenticated' : false
    };
  }
}

module.exports = EmailService;
