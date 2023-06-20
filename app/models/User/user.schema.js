import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import User from "./user.model.js";
import { JWT_SECRET_KEY } from "../../../config.js";

export const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    birthday: {
      type: Date,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    cityCoordinates: {
      type: Object,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    interests: {
      type: Array,
    },

    firstTimeUser: {
      type: Boolean,
      default: true,
    },

    bio: {
      type: String,
    },

    eventsRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "event" }],
    favoriteEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "event" }],

    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jsonwebtoken.sign({ _id: user._id.toString() }, JWT_SECRET_KEY);
  // user.tokens = user.tokens.concat({ token });

  await user.save();
  return token;
};

userSchema.statics.CheckMatchLogin = async function (email, password) {
  const user = await User.findOne({ email });
  if (!user) return false;

  const match = await bcryptjs.compare(password, user.password);
  if (!match) return false;

  return user;
};

async function hashPasswordBeforeSaving(next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcryptjs.hash(user.password, 8);
  }

  next();
}

userSchema.pre("save", hashPasswordBeforeSaving);
