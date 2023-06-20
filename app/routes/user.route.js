import express from "express";
import {
  addEventToFavorites,
  createUser,
  deleteAvatarImg,
  deleteNotificationById,
  eventRequestUserDecision,
  getEventsUserParticipate,
  getUserByUsername,
  getUserEventsRequests,
  getUserNotifications,
  loadUser,
  markAsReadAllNotifications,
  markAsReadNotification,
  numberNotificationsEventsRequests,
  removeEventFromFavorites,
  resendOtpVerification,
  updateUser,
  uploadAvatar,
  userLogin,
  verifyOtp,
} from "../controllers/user.controller.js";
import { auth } from "../middleware/auth.js";
export const userRouter = express.Router();

userRouter.post("/create-user", createUser);
userRouter.post("/login", userLogin);
userRouter.post("/upload-avatar", uploadAvatar);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/resend-otp", resendOtpVerification);

//! Need Auth
userRouter.get("/load-user", auth, loadUser);
userRouter.get("/specific-user", auth, getUserByUsername);
userRouter.put("/update-user", auth, updateUser);
userRouter.get("/events-user-participate", auth, getEventsUserParticipate);

// Notificiations
userRouter.get("/notifications", auth, getUserNotifications);
userRouter.post(
  "/notifications/mark-as-read-all",
  auth,
  markAsReadAllNotifications
);
userRouter.patch("/notifications/mark-as-read", auth, markAsReadNotification);
userRouter.delete(
  "/notifications/delete-notification",
  auth,
  deleteNotificationById
);

// EventsRequests
userRouter.get("/events-requests", auth, getUserEventsRequests);
userRouter.get(
  "/number-notifications-events-requests",
  auth,
  numberNotificationsEventsRequests
);
userRouter.patch("/user-event-request", auth, eventRequestUserDecision);
userRouter.post("/delete-avatar-img", auth, deleteAvatarImg);
userRouter.patch("/add-event-to-favorites", auth, addEventToFavorites);
userRouter.patch(
  "/remove-event-from-favorites",
  auth,
  removeEventFromFavorites
);
