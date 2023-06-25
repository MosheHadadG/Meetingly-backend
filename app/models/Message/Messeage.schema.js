import mongoose from "mongoose";

export const MessageSchema = mongoose.Schema(
  {
    chatId: {
      type: String,
      ref: "Chat",
    },
    senderId: {
      type: String,
    },
    text: {
      type: String,
    },
    isRead: {
      type: Array,
    },
  },
  { timestamps: true }
);

// MessageSchema.virtual("chatId", {
//   ref: "Chat",
//   localField: "members", // Of post collection
//   foreignField: "_id", // Of user collection
// });
