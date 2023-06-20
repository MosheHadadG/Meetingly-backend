import express from "express";
import {
  createEvent,
  uploadEventCoverImg,
  deleteEventCoverImg,
  getEventById,
  getEventsByOwnerId,
  getEventsByType,
  getEventsUserParticipated,
  // getParticipantsById,
  userCancelParticipation,
  userJoinToEvent,
  updateEvent,
  updateEventParticipants,
  getFavoriteEvents,
} from "../controllers/events.controller.js";
import { auth } from "../middleware/auth.js";
export const eventsRouter = express.Router();

//! Need Auth

eventsRouter.post("/create-event", auth, createEvent);
eventsRouter.post("/upload-event-cover", auth, uploadEventCoverImg);
eventsRouter.post("/delete-event-cover", auth, deleteEventCoverImg);
eventsRouter.post("/update-event", auth, updateEvent);
eventsRouter.post("/update-event-participants", auth, updateEventParticipants);
eventsRouter.get("/events-by-type", auth, getEventsByType);
eventsRouter.get("/specific-event", auth, getEventById);
eventsRouter.get("/events-by-owner", auth, getEventsByOwnerId);
eventsRouter.get("/events-user-participated", auth, getEventsUserParticipated);
eventsRouter.get("/favorite", auth, getFavoriteEvents);
// eventsRouter.get("/participants", auth, getParticipantsById);

eventsRouter.patch("/join-event", auth, userJoinToEvent);
eventsRouter.patch("/Cancel-participation", auth, userCancelParticipation);
