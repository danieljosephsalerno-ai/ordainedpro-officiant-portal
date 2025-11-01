const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    default: ''
  },
  filePath: {
    type: String,
    default: ''
  },
  ceremonyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ceremony',
    required: false
  },
  createdBy: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Traditional', 'Modern', 'Interfaith', 'Beach', 'Custom'],
    default: 'Custom'
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft'
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified on save
scriptSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('Script', scriptSchema);
