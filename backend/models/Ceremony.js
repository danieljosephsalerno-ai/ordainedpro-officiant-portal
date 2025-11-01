const mongoose = require('mongoose');

const ceremonySchema = new mongoose.Schema({
  // Basic ceremony information
  ceremonyName: {
    type: String,
    required: true,
    trim: true
  },

  // Ceremony participants
  officiantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Ceremony details
  ceremonyDate: {
    type: Date,
    required: true
  },
  ceremonyTime: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },

  // Venue information
  venue: {
    name: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'USA'
      }
    },
    contactPerson: {
      name: String,
      phone: String,
      email: String
    },
    venueType: {
      type: String,
      enum: ['indoor', 'outdoor', 'church', 'beach', 'garden', 'hall', 'other'],
      default: 'other'
    }
  },

  // Guest information
  expectedGuests: {
    type: Number,
    default: 0
  },

  // Ceremony preferences
  ceremonyType: {
    type: String,
    enum: ['religious', 'civil', 'spiritual', 'interfaith', 'secular'],
    default: 'civil'
  },
  traditions: [String],
  specialRequests: {
    type: String,
    maxlength: 1000
  },

  // Communication preferences
  communicationChannels: {
    email: {
      type: Boolean,
      default: true
    },
    phone: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },

  // Payment information
  payment: {
    totalAmount: {
      type: Number,
      required: true
    },
    depositAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'deposit_paid', 'paid_full', 'overdue'],
      default: 'pending'
    },
    dueDate: Date
  },

  // Documents and files
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['contract', 'script', 'music_list', 'photo', 'video', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: Number,
    mimeType: String
  }],

  // Status tracking
  status: {
    type: String,
    enum: ['inquiry', 'booked', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'inquiry'
  },

  // Email configuration for this ceremony
  emailConfig: {
    customDomain: String,
    emailPrefix: String, // e.g., "sarah-david-wedding"
    autoReplyEnabled: {
      type: Boolean,
      default: true
    },
    autoReplyMessage: {
      type: String,
      default: "Thank you for your message. We'll get back to you soon!"
    }
  },

  // Meeting history
  meetings: [{
    date: Date,
    duration: Number,
    type: {
      type: String,
      enum: ['consultation', 'planning', 'rehearsal', 'other']
    },
    notes: String,
    attendees: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      attended: {
        type: Boolean,
        default: true
      }
    }]
  }],

  // Tasks and reminders
  tasks: [{
    title: String,
    description: String,
    dueDate: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  }],

  // Archive settings
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archiveReason: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
ceremonySchema.index({ officiantId: 1, ceremonyDate: -1 });
ceremonySchema.index({ brideId: 1 });
ceremonySchema.index({ groomId: 1 });
ceremonySchema.index({ ceremonyDate: 1 });
ceremonySchema.index({ status: 1 });
ceremonySchema.index({ isArchived: 1 });

// Virtual for formatted ceremony date
ceremonySchema.virtual('formattedCeremonyDate').get(function() {
  return this.ceremonyDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for ceremony participants emails
ceremonySchema.virtual('participantEmails').get(function() {
  const emails = [];
  if (this.officiant?.email) emails.push(this.officiant.email);
  if (this.bride?.email) emails.push(this.bride.email);
  if (this.groom?.email) emails.push(this.groom.email);
  return emails;
});

// Virtual for ceremony display name
ceremonySchema.virtual('displayName').get(function() {
  if (this.bride?.firstName && this.groom?.firstName) {
    return `${this.bride.firstName} & ${this.groom.firstName}'s Wedding`;
  }
  return this.ceremonyName;
});

// Virtual for days until ceremony
ceremonySchema.virtual('daysUntilCeremony').get(function() {
  const now = new Date();
  const ceremony = new Date(this.ceremonyDate);
  const diffTime = ceremony - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for ceremony status
ceremonySchema.virtual('isUpcoming').get(function() {
  return this.ceremonyDate > new Date();
});

// Virtual for payment status
ceremonySchema.virtual('paymentBalance').get(function() {
  return this.payment.totalAmount - this.payment.paidAmount;
});

// Method to check if user is participant
ceremonySchema.methods.isParticipant = function(userId) {
  return this.officiantId.toString() === userId.toString() ||
         this.brideId.toString() === userId.toString() ||
         this.groomId.toString() === userId.toString();
};

// Method to get participant by email
ceremonySchema.methods.getParticipantByEmail = function(email) {
  email = email.toLowerCase();

  if (this.officiant?.email === email) return this.officiant;
  if (this.bride?.email === email) return this.bride;
  if (this.groom?.email === email) return this.groom;

  return null;
};

// Method to add task
ceremonySchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData);
  return this.save();
};

// Method to complete task
ceremonySchema.methods.completeTask = function(taskId) {
  const task = this.tasks.id(taskId);
  if (task) {
    task.completed = true;
    task.completedAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error('Task not found'));
};

// Method to add meeting
ceremonySchema.methods.addMeeting = function(meetingData) {
  this.meetings.push(meetingData);
  return this.save();
};

// Method to update payment
ceremonySchema.methods.updatePayment = function(amount) {
  this.payment.paidAmount += amount;

  if (this.payment.paidAmount >= this.payment.totalAmount) {
    this.payment.paymentStatus = 'paid_full';
  } else if (this.payment.paidAmount >= this.payment.depositAmount) {
    this.payment.paymentStatus = 'deposit_paid';
  }

  return this.save();
};

// Static method to find ceremonies by officiant
ceremonySchema.statics.findByOfficiant = function(officiantId, includeArchived = false) {
  const query = { officiantId };
  if (!includeArchived) {
    query.isArchived = false;
  }

  return this.find(query)
    .populate('officiantId', 'firstName lastName email')
    .populate('brideId', 'firstName lastName email')
    .populate('groomId', 'firstName lastName email')
    .sort({ ceremonyDate: -1 });
};

// Static method to find ceremonies by participant
ceremonySchema.statics.findByParticipant = function(userId, includeArchived = false) {
  const query = {
    $or: [
      { officiantId: userId },
      { brideId: userId },
      { groomId: userId }
    ]
  };

  if (!includeArchived) {
    query.isArchived = false;
  }

  return this.find(query)
    .populate('officiantId', 'firstName lastName email')
    .populate('brideId', 'firstName lastName email')
    .populate('groomId', 'firstName lastName email')
    .sort({ ceremonyDate: -1 });
};

// Static method to find upcoming ceremonies
ceremonySchema.statics.findUpcoming = function(days = 30) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return this.find({
    ceremonyDate: { $gte: startDate, $lte: endDate },
    isArchived: false,
    status: { $in: ['booked', 'confirmed', 'in_progress'] }
  })
  .populate('officiantId', 'firstName lastName email')
  .populate('brideId', 'firstName lastName email')
  .populate('groomId', 'firstName lastName email')
  .sort({ ceremonyDate: 1 });
};

module.exports = mongoose.model('Ceremony', ceremonySchema);
