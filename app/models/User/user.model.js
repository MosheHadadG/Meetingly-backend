import mongoose from "mongoose";

import { userSchema } from "./user.schema.js";

const User = mongoose.model("user", userSchema);

export default User;
