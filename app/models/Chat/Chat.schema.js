import mongoose from "mongoose";

export const ChatSchema = mongoose.Schema(
  {
    members: {
      type: Array,
    },
    lastMessage: {
      type: Object,
    },
    type: {
      type: String,
    },
    eventId: {
      type: mongoose.Types.ObjectId,
      ref: "event",
    },
  },
  { timestamps: true }
);
