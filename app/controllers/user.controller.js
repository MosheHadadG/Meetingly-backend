import User from "../models/User/user.model.js";
import mongoose from "mongoose";
import Joi from "joi";
import { sendOtpVerificationEmail } from "./utils/user.utils.js";
import UserOtpVerification from "../models/UserOtpVerification/UserOtpVerification.model.js";
import bcryptjs from "bcryptjs";
import {
  deleteImageFromS3,
  uploadImageToS3,
} from "../middleware/uploadImageS3.js";
import Event from "../models/Event/Event.model.js";
import Notification from "../models/Notification/notification.model.js";
import Request from "../models/Request/request.model.js";

export const uploadAvatar = async (req, res) => {
  try {
    const uploadAvatarSingle =
      uploadImageToS3("avatarImages").single("avatar-upload");

    uploadAvatarSingle(req, res, (err) => {
      if (err)
        return res.status(400).send({ success: false, message: err.message });

      res.send(req.file);
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  const registerUserSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    birthday: Joi.string().required(),
    city: Joi.string().required(),
    cityCoordinates: Joi.object({
      lng: Joi.number().required(),
      lat: Joi.number().required(),
    }),
    gender: Joi.string().required(),
    avatar: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = registerUserSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { username, email } = req.body;
  const userForm = {
    ...req.body,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
  };

  try {
    let usernameAlreadyExist = await User.findOne({
      username: userForm.username,
    });
    if (usernameAlreadyExist)
      throw new Error("שם משתמש זה כבר בשימוש נסה שם אחר");
    let mailAlreadyExist = await User.findOne({ email: userForm.email });
    if (mailAlreadyExist) throw new Error("מייל זה כבר קיים במערכת");

    const newUser = new User(userForm);
    console.log(newUser);
    const user = await newUser.save();
    sendOtpVerificationEmail(user, res);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      throw new Error("Empty otp details are not allowd");
    }
    const UserOtpVerificationRecords = await UserOtpVerification.find({
      userId,
    });
    if (UserOtpVerificationRecords.length <= 0) {
      throw new Error("לא קיים חשבון לאימות, נסה בבקשה להתחבר או להרשם שוב.");
    } else {
      const { expiresAt } = UserOtpVerificationRecords[0];
      const hashedOtp = UserOtpVerificationRecords[0].otp;

      if (expiresAt < Date.now()) {
        // user otp record has expired
        await UserOtpVerification.deleteMany({ userId });
        throw new Error("פג תוקף של הקוד, בקש שנית.");
      } else {
        const validOtp = await bcryptjs.compare(otp, hashedOtp);
        if (!validOtp) {
          // otp is wrong
          throw new Error("קוד שהוזן שגוי, בדוק את תיבת הדואר.");
        } else {
          // success
          await User.updateOne({ _id: userId }, { verified: true });
          await UserOtpVerification.deleteMany({ userId });
          res.send({
            message:
              "החשבון אומת ותהליך ההרשמה הסתיים בהצלחה, הגיע הזמן להתחבר :)",
          });
        }
      }
    }
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const resendOtpVerification = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      throw new Error("Empty otp details are not allowd");
    } else {
      await UserOtpVerification.deleteMany({ userId });
      sendOtpVerificationEmail({ _id: userId, email }, res);
    }
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

export const userLogin = async (req, res) => {
  const loginUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = loginUserSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { email, password } = req.body;

  try {
    const user = await User.CheckMatchLogin(email.toLowerCase(), password);
    if (!user)
      return res
        .status(400)
        .send({ error: "האימייל ו/או הסיסמה שהזנת שגויים!" });
    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
};

export const loadUser = async (req, res) => {
  try {
    res.send({ user: req.user });
  } catch (err) {
    res.send(err);
  }
};

//! check username not exist
export const updateUser = async (req, res) => {
  const updates = Object.keys(req.body);
  console.log(updates);
  const allowedUpdates = [
    "firstName",
    "lastName",
    "birthday",
    "username",
    "interests",
    "city",
    "cityCoordinates",
    "firstTimeUser",
    "avatar",
    "bio",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Update!" });
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (err) {
    res.send(err);
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) throw new Error("Need Username");

    const user = await User.findOne({ username: username });
    if (!user) return res.status(404).send("לא קיים חשבון עם שם משתמש זה");
    // let userToClient = {...user};
    // delete userToClient.interets
    res.send(user);
  } catch (err) {
    res.status(400).send({ status: "success", error: err.message });
  }
};

export const getEventsUserParticipate = async (req, res) => {
  const userId = req.user._id;
  console.log(userId);
  try {
    const events = await Event.find({
      participants: { $in: [userId] },
    });
    console.log(events);
    if (!events || events.length <= 0)
      return res.send({ status: "NoFound", statusMessage: "לא נמצאו אירועים" });

    res.send({ status: "success", events });
  } catch (err) {
    res.status(400).send({ status: "success", error: err.message });
  }
};

export const getUserNotifications = async (req, res) => {
  const userId = req.user._id;
  try {
    const { page } = req.query;
    // if (!page) throw new Error("Need Page Number");

    // pagination
    const LIMIT = 10;
    const startIndex = (Number(page) - 1) * LIMIT;
    const totalNotifications = await Notification.find({
      receiver: userId,
    }).countDocuments({});

    const userNotificationsWithSender = await Notification.find({
      receiver: userId,
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar")
      .limit(LIMIT)
      .skip(startIndex);

    if (
      !userNotificationsWithSender ||
      userNotificationsWithSender.length <= 0
    ) {
      return res.send({ status: "NoFound", statusMessage: "לא נמצאו התראות" });
    }

    res.send({
      status: "success",
      notifications: userNotificationsWithSender,
      numberOfPages: Math.ceil(totalNotifications / LIMIT),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const markAsReadNotification = async (req, res) => {
  const { _id: userId } = req.user;
  try {
    const { notificationId } = req.body;
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error("התראה לא נמצאה");
    if (notification.receiver.toString() !== userId.toString())
      throw new Error("אתה לא בעל ההתראה");
    if (notification.isRead) throw new Error("התראה זאת כבר נקראה");
    notification.isRead = true;
    await notification.save();
    res.send({
      status: "success",
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const markAsReadAllNotifications = async (req, res) => {
  const { _id: userId } = req.user;
  try {
    const markAsRead = {
      $set: {
        isRead: true,
      },
    };
    const result = await Notification.updateMany(
      { receiver: userId },
      markAsRead
    );
    res.send({
      status: "success",
      result,
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const deleteNotificationById = async (req, res) => {
  const { _id: userId } = req.user;
  try {
    const { notificationId } = req.body;
    const deletedNotification = await Notification.findByIdAndDelete(
      notificationId
    );

    const totalNotifications = await Notification.find({
      receiver: userId,
    }).countDocuments({});

    res.send({
      status: "success",
      totalNotifications,
    });
  } catch (error) {
    res.status(400).send({ error: err.message });
  }
};

export const numberNotificationsEventsRequests = async (req, res) => {
  const { _id: userId } = req.user;
  try {
    const totalNotifications = await Notification.find({
      receiver: userId,
      isRead: false,
    }).countDocuments({});

    const totalEventsRequests = await Request.find({
      receiver: userId,
    }).countDocuments({});

    res.send({
      status: "success",
      totalNotifications,
      totalEventsRequests,
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const getUserEventsRequests = async (req, res) => {
  const userId = req.user._id;
  try {
    const { page } = req.query;
    // if (!page) throw new Error("Need Page Number");

    // pagination
    const LIMIT = 10;
    const startIndex = (Number(page) - 1) * LIMIT;
    const totalEventsRequests = await Request.find({
      receiver: userId,
      type: "event",
    }).countDocuments({});

    const userEventsRequestsWithSender = await Request.find({
      receiver: userId,
      type: "event",
    })
      .sort({ createdAt: -1 })
      .populate([
        { path: "sender", select: "username avatar" },
        { path: "refType", select: "_id type" },
      ])
      .limit(LIMIT)
      .skip(startIndex);

    if (
      !userEventsRequestsWithSender ||
      userEventsRequestsWithSender.length <= 0
    ) {
      return res.send({
        status: "NoFound",
        statusMessage: "לא נמצאו בקשות להצטרפות",
      });
    }

    res.send({
      status: "success",
      eventsRequests: userEventsRequestsWithSender,
      numberOfPages: Math.ceil(totalEventsRequests / LIMIT),
      totalEventsRequests,
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(400).send({ status: "error", error: err.message });
  }
};

export const eventRequestUserDecision = async (req, res) => {
  const { _id: userId, firstName, lastName, avatar, username } = req.user;
  try {
    const { userDecision, eventId, requestId, userRequestId } = req.body;
    if (!userDecision) throw new Error("need isRequestAccepted");

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).send("Event No Found");

    const userRequest = await User.findById(userRequestId);
    if (!userRequest) return res.status(404).send("User Request No Found");

    if (event.participants.includes(userRequestId))
      throw new Error("user is already participant");

    let updatedUserEventsRequests, totalEventsRequests;

    switch (userDecision) {
      case "APPROVED":
        event.participants.push(userRequestId);
        event.markModified("participants");
        const eventUpdated = await event.save();
        if (!eventUpdated) throw new Error("Something went wrong.");

        // Update user Request the events Requests.
        updatedUserEventsRequests = userRequest.eventsRequests.filter(
          (eventRequestId) => eventRequestId.toString() !== eventId
        );

        userRequest.eventsRequests = updatedUserEventsRequests;
        await userRequest.save();

        // Delete Request
        await Request.findByIdAndDelete(requestId);

        const newParticipantEventNotification = new Notification({
          sender: userId,
          receiver: userRequestId,
          type: "event",
          content: `${firstName} ${lastName} אישר את בקשתך להצטרף לאירוע "${event.title}"`,
        });
        await newParticipantEventNotification.save();

        let participantEventNotificationData = {
          ...newParticipantEventNotification,
        };
        let participantEventNotification =
          participantEventNotificationData._doc;
        participantEventNotification.sender = {
          avatar,
          username,
          _id: userId,
        };

        totalEventsRequests = await Request.find({
          receiver: userId,
          type: "event",
        }).countDocuments({});

        return res.send({
          status: "success",
          message: "הבקשה אושרה",
          totalEventsRequests,
          participantEventNotification,

          // `אישרת בהצלחה את ${userRequest.firstName} ${userRequest.lastName} לאירוע ${event.title}`
        });

      case "REJECTED":
        // Update user Request the events Requests.
        updatedUserEventsRequests = userRequest.eventsRequests.filter(
          (eventRequestId) => eventRequestId.toString() !== eventId
        );

        userRequest.eventsRequests = updatedUserEventsRequests;
        await userRequest.save();

        // Delete Request
        await Request.findByIdAndDelete(requestId);

        const rejectParticipantEventNotification = new Notification({
          sender: userId,
          receiver: userRequestId,
          type: "event",
          content: `${firstName} ${lastName} דחה את בקשתך להצטרף לאירוע "${event.title}"`,
        });
        await rejectParticipantEventNotification.save();

        let rejectParticipantEventNotificationData = {
          ...rejectParticipantEventNotification,
        };

        let participantEventNotificationRejected =
          rejectParticipantEventNotificationData._doc;

        participantEventNotificationRejected.sender = {
          avatar,
          username,
          _id: userId,
        };

        totalEventsRequests = await Request.find({
          receiver: userId,
          type: "event",
        }).countDocuments({});

        return res.send({
          status: "success",
          message: "הבקשה נדחתה",
          totalEventsRequests,
          participantEventNotification: participantEventNotificationRejected,

          // `אישרת בהצלחה את ${userRequest.firstName} ${userRequest.lastName} לאירוע ${event.title}`
        });
    }
  } catch (err) {
    res.status(400).send({ status: "error", error: err.message });
  }
};

export const deleteAvatarImg = async (req, res) => {
  try {
    const { fileName } = req.body;
    console.log(req.body);
    const data = await deleteImageFromS3({
      destinationPath: "avatarImages",
      fileName,
    });
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: err.message });
  }
};

export const addEventToFavorites = async (req, res) => {
  try {
    const { eventId } = req.body;

    const eventAlreadyAdded = req.user.favoriteEvents.includes(eventId);
    if (eventAlreadyAdded) throw new Error("אירוע זה כבר נמצא במועדפים.");

    req.user.favoriteEvents.unshift(eventId);
    await req.user.save();

    res.send({
      status: "success",
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const removeEventFromFavorites = async (req, res) => {
  try {
    const { eventId } = req.body;
    // console.log({ eventId, re: req.user.favoriteEvents });
    const noFavoriteEvent = !req.user.favoriteEvents.includes(eventId);
    if (noFavoriteEvent) throw new Error("אירוע לא קיים במועדפים");

    const favoritesEventsUpdated = req.user.favoriteEvents.filter(
      (favoriteEventId) => favoriteEventId.toString() !== eventId
    );

    req.user.favoriteEvents = favoritesEventsUpdated;
    await req.user.save();

    res.send({
      status: "success",
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};
