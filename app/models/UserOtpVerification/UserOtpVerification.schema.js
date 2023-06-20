import mongoose from "mongoose";

export const UserOtpVerificationSchema = mongoose.Schema({
  userId: {
    type: String,
  },

  otp: {
    type: String,
  },

  createdAt: {
    type: Date,
  },

  expiresAt: {
    type: Date,
  },
});
