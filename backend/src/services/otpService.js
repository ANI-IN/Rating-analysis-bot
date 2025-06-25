//backend/src/services/otpService.js
const Otp = require('../models/Otp');
const crypto = require('crypto');

// Generate OTP
exports.generateOTP = async (userId, type = 'verification') => {
  // Generate 6 digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Delete any existing OTP for this user
  await Otp.deleteMany({ userId, type });

  // Create new OTP
  await Otp.create({
    userId,
    otp,
    type,
  });

  return otp;
};

// Verify OTP
exports.verifyOTP = async (userId, otp, type = 'verification') => {
  const otpRecord = await Otp.findOne({
    userId,
    otp,
    type,
  });

  if (!otpRecord) {
    return false;
  }

  // Delete OTP after successful verification
  await Otp.deleteOne({ _id: otpRecord._id });

  return true;
};