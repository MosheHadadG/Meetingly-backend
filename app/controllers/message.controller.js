import Chat from "../models/Chat/Chat.model.js";
import { ChatSchema } from "../models/Chat/Chat.schema.js";
import Message from "../models/Message/Messeage.model.js";
import { uniqueCount } from "./utils/message.util.js";

export const addMessage = async (req, res) => {
  const { _id: userId } = req.user;

  const { chatId, text } = req.body;
  const message = new Message({
    chatId,
    senderId: userId,
    text,
  });

  try {
    const messageSaved = await message.save();
    const populatedMessage = await Message.findById(messageSaved._id)
      .populate("senderId", "avatar firstName lastName username")
      .lean();

    const chat = await Chat.findById(chatId);
    chat.lastMessage = populatedMessage;
    await chat.save();

    res.send({ status: "success", message: populatedMessage });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  const { username, _id: userId } = req.user;

  const { chatId } = req.query;

  try {
    const conditions = {
      chatId,
      senderId: { $ne: userId.toString() },
      isRead: { $ne: username },
    };

    const MarkMessagesAsRead = await Message.updateMany(conditions, {
      $push: { isRead: username },
    });

    const result = await Message.find({ chatId }).populate(
      "senderId",
      "avatar firstName lastName username"
    );

    res.send({ status: "success", result });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const getNumberUnreadMessages = async (req, res) => {
  const { username, _id: userId } = req.user;

  try {
    const unreadMessages = await Message.find({
      senderId: { $ne: userId.toString() },
      isRead: { $ne: username },
    })
      .populate({
        path: "chatId",
        match: {
          members: { $in: [username] },
        },
      })
      .then((messages) => messages.filter((message) => message.chatId != null));

    const unreadMessagesIds = unreadMessages.map(
      (unreadMessage) => unreadMessage.chatId._id
    );

    const totalUnreadMessageInChat = uniqueCount(unreadMessagesIds);
    const totalUnreadChats = Object.keys(totalUnreadMessageInChat).length;

    res.send({
      status: "success",
      unreadMessages,
      totalUnreadMessageInChat,
      totalUnreadChats,
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const { username, _id: userId } = req.user;
  const { chatId } = req.body;

  try {
    const conditions = {
      chatId,
      senderId: { $ne: userId.toString() },
      isRead: { $ne: username },
    };

    const MarkMessagesAsRead = await Message.updateMany(conditions, {
      $push: { isRead: username },
    });

    res.send({ status: "success" });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};
