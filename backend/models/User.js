const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.userType === 'officiant';
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },

  // User type and role
  userType: {
    type: String,
    enum: ['officiant', 'bride', 'groom'],
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'officiant', 'client'],
    default: function() {
      return this.userType === 'officiant' ? 'officiant' : 'client';
    }
  },

  // Contact information
  phone: {
    type: String,
    trim: true
  },
  alternateEmail: {
    type: String,
    lowercase: true,
    trim: true
  },

  // Profile information
  profilePicture: {
    type: String // URL to profile picture
  },
  bio: {
    type: String,
    maxlength: 500
  },

  // Officiant-specific fields
  officiantInfo: {
    licenseNumber: String,
    yearsExperience: Number,
    specializations: [String],
    servicesOffered: [String],
    travelRadius: Number, // in miles
    baseFee: Number,
    credentials: [String],
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String
    }
  },

  // Client-specific fields (for couples)
  partnerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    language: {
      type: String,
      default: 'en'
    }
  },

  // Login tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name based on user type
userSchema.virtual('displayName').get(function() {
  if (this.userType === 'officiant') {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.fullName;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return token;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return token;
};

// Static method to find user by email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({
    email: email.toLowerCase(),
    isActive: true
  });
};

// Static method to get officiant users
userSchema.statics.getOfficiants = function(filters = {}) {
  return this.find({
    userType: 'officiant',
    isActive: true,
    ...filters
  }).select('-password');
};

// Static method to get ceremony participants
userSchema.statics.getCeremonyParticipants = function(ceremonyId) {
  return this.find({
    userType: { $in: ['bride', 'groom'] },
    'ceremonies': ceremonyId,
    isActive: true
  }).select('-password');
};

module.exports = mongoose.model('User', userSchema);
