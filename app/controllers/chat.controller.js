import Chat from "../models/Chat/Chat.model.js";

export const createChat = async (req, res) => {
  const { username } = req.user;
  const { receiverUsername } = req.body;

  try {
    const chatExist = await Chat.find({
      members: { $all: [username, receiverUsername] },
    });
    if (chatExist.length > 0)
      return res.send({
        status: "chatExist",
        result: chatExist,
        message: "צאט כבר קיים",
      });

    const newChat = new Chat({
      members: [username, receiverUsername],
    });
    const result = await newChat.save();
    res.send({ status: "success", result });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const userChats = async (req, res) => {
  const { username } = req.user;

  try {
    const chats = await Chat.find({
      members: { $in: [username] },
    });

    res.send({ status: "success", chats });
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
