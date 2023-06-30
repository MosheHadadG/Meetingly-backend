import mongoose from "mongoose";

export const MessageSchema = mongoose.Schema(
  {
    chatId: {
      type: String,
      ref: "Chat",
    },
    senderId: {
      type: String,
      ref: "user",
    },
    text: {
      type: String,
    },
    isRead: {
      type: Array,
    },
    chatType: {
      type: String,
    },
  },
  { timestamps: true }
);

// MessageSchema.virtual("chatId", {
//   ref: "Chat",
//   localField: "members", // Of post collection
//   foreignField: "_id", // Of user collection
// });
