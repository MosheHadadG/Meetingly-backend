import mongoose from "mongoose";
import { convertKmToMeters } from "../../controllers/utils/events.utils.js";

export const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    timeStart: {
      type: String,
      required: true,
    },

    timeEnd: {
      type: String,
      required: true,
    },

    privacy: {
      type: String,
      required: true,
    },

    location: {
      name: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    description: {
      type: String,
      required: true,
    },

    imageSrc: {
      type: String,
      required: false,
      default:
        "https://upload.wikimedia.org/wikipedia/commons/a/ad/Football_in_Bloomington%2C_Indiana%2C_1996.jpg",
    },
    ownerEvent: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);
