const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Basic message information
  messageId: {
    type: String,
    unique: true,
    required: true
  },
  ceremonyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ceremony',
    required: true
  },

  // Email details
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  htmlBody: {
    type: String
  },

  // Sender information
  senderEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderType: {
    type: String,
    enum: ['officiant', 'bride', 'groom', 'system'],
    required: true
  },

  // Recipients
  recipients: [{
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    name: String,
    type: {
      type: String,
      enum: ['to', 'cc', 'bcc']
    }
  }],

  // Timestamps
  sentAt: {
    type: Date,
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },

  // Email metadata
  emailHeaders: {
    messageId: String,
    inReplyTo: String,
    references: String,
    priority: String
  },

  // Attachments
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    url: String,
    isInline: Boolean
  }],

  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
    default: 'delivered'
  },

  // Threading
  threadId: String,
  isReply: {
    type: Boolean,
    default: false
  },
  parentMessageId: {
    type: String
  },

  // Flags
  isImportant: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },

  // Read status for each user
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Email processing
  rawEmail: {
    type: String // Store raw email for debugging
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'processed'
  },
  processingError: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
messageSchema.index({ ceremonyId: 1, sentAt: -1 });
messageSchema.index({ senderEmail: 1, sentAt: -1 });
messageSchema.index({ 'recipients.email': 1, sentAt: -1 });
messageSchema.index({ threadId: 1, sentAt: 1 });
messageSchema.index({ messageId: 1 });
messageSchema.index({ sentAt: -1 });

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  return this.sentAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted time
messageSchema.virtual('formattedTime').get(function() {
  return this.sentAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual for time ago
messageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.sentAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return this.formattedDate;
});

// Method to check if user has read the message
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.userId.toString() === userId.toString());
};

// Method to mark as read by user
messageSchema.methods.markAsReadBy = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ userId, readAt: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get conversation thread
messageSchema.statics.getThread = function(threadId) {
  return this.find({ threadId, isDeleted: false })
    .populate('ceremonyId', 'brideName groomName ceremonyDate')
    .sort({ sentAt: 1 });
};

// Static method to get messages for ceremony
messageSchema.statics.getForCeremony = function(ceremonyId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  return this.find({
    ceremonyId,
    isDeleted: false
  })
  .populate('ceremonyId', 'brideName groomName ceremonyDate')
  .sort({ sentAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Pre-save middleware to generate threadId if not exists
messageSchema.pre('save', function(next) {
  if (!this.threadId) {
    // Generate threadId based on ceremony and participants
    this.threadId = `ceremony-${this.ceremonyId}-thread`;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
