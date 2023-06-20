import mongoose from "mongoose";

import { eventSchema } from "./Event.schema.js";
const Event = mongoose.model("event", eventSchema);

export default Event;
