import mongoose from "mongoose";

import { notificationSchema } from "./notification.schema.js";
const Notification = mongoose.model("notification", notificationSchema);

export default Notification;
