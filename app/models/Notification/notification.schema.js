import mongoose from "mongoose";

export const notificationSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },

    refType: { type: mongoose.Types.ObjectId, refPath: "type" },

    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);
