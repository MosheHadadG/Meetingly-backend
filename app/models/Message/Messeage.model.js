import mongoose from "mongoose";

import { MessageSchema } from "./Messeage.schema.js";
const Message = mongoose.model("Message", MessageSchema);

export default Message;
