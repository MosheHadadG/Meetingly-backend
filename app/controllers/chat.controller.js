import mongoose from "mongoose";
import Chat from "../models/Chat/Chat.model.js";

export const createPrivateChat = async (req, res) => {
  const { username } = req.user;
  const { receiverUsername } = req.body;

  try {
    const chatExist = await Chat.find({
      members: { $all: [username, receiverUsername] },
      type: "private",
    });
    if (chatExist.length > 0)
      return res.send({
        status: "chatExist",
        result: chatExist,
        message: "צאט כבר קיים",
      });

    const newChat = new Chat({
      members: [username, receiverUsername],
      type: "private",
    });
    const result = await newChat.save();
    res.send({ status: "success", result });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const createGroupChat = async (req, res) => {
  const { username } = req.user;
  const { eventId } = req.body;
  try {
    const chatExist = await Chat.find({
      eventId,
      type: "group",
    });
    if (chatExist.length > 0)
      return res.send({
        status: "chatExist",
        result: chatExist,
        message: "צאט כבר קיים",
      });

    const newChat = new Chat({
      members: [username],
      type: "group",
      eventId,
    });
    const result = await newChat.save();
    res.send({ status: "success", result });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const userChats = async (req, res) => {
  const { username } = req.user;
  const { type } = req.query;

  try {
    let chats;
    switch (type) {
      case "private":
        chats = await Chat.find({
          members: { $in: [username] },
          type: "private",
        });
        break;
      case "group":
        chats = await Chat.find({
          members: { $in: [username] },
          type: "group",
        }).populate("eventId", "imageSrc title participants");
        break;
    }

    res.send({ status: "success", chats });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const addMemberToChat = async (req, res) => {
  const { username } = req.user;

  const { eventId } = req.body;
  try {
    const chat = await Chat.findOne({
      type: "group",
      eventId,
    });
    if (!chat) throw new Error("צאט לא נמצא");
    chat.members.push(username);
    const result = await chat.save();
    res.send({ status: "success", result });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const findChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      members: { $all: [req.params.firstId, req.params.secondId] },
    });
    res.send({ status: "success", chat });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};
