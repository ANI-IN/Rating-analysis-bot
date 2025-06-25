//backend/src/models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['verification', 'reset'],
    default: 'verification',
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Document will be automatically deleted after 10 minutes
  },
});

module.exports = mongoose.model('Otp', otpSchema);