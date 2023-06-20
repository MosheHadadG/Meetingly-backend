import mongoose from "mongoose";

import { requestSchema } from "./request.schema.js";
const Request = mongoose.model("request", requestSchema);

export default Request;
