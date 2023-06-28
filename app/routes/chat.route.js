import express from "express";
import {
  addMemberToChat,
  createGroupChat,
  createPrivateChat,
  findChat,
  userChats,
} from "../controllers/chat.controller.js";
import {
  addMessage,
  getMessages,
  getNumberUnreadMessages,
  markMessagesAsRead,
} from "../controllers/message.controller.js";
import { auth } from "../middleware/auth.js";

export const chatRouter = express.Router();

//! Need Auth

chatRouter.post("/private", auth, createPrivateChat);
chatRouter.post("/group", auth, createGroupChat);
chatRouter.patch("/group/add-member", auth, addMemberToChat);
chatRouter.get("/", auth, userChats);
chatRouter.get("/find/:firstId/:secondId", auth, findChat);

// messages
chatRouter.post("/messages", auth, addMessage);
chatRouter.get("/messages", auth, getMessages);
chatRouter.get(
  "/messages/number-unread-messages",
  auth,
  getNumberUnreadMessages
);

chatRouter.patch("/messages/mark-as-read", auth, markMessagesAsRead);
