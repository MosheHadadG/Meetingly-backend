import mongoose from "mongoose";
import { UserOtpVerificationSchema } from "./UserOtpVerification.schema.js";

const UserOtpVerification = mongoose.model(
  "UserOtpVerification",
  UserOtpVerificationSchema
);

export default UserOtpVerification;
