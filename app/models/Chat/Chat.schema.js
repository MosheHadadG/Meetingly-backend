import mongoose from "mongoose";

export const ChatSchema = mongoose.Schema(
  {
    members: {
      type: Array,
    },
    lastMessage: {
      type: Object,
    },
  },
  { timestamps: true }
);
