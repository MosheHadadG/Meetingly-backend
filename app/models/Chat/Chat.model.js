import mongoose from "mongoose";

import { ChatSchema } from "./Chat.schema.js";
const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
