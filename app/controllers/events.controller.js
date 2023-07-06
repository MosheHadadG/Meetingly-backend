import Joi from "joi";
import mongoose from "mongoose";
import {
  deleteImageFromS3,
  uploadImageToS3,
} from "../middleware/uploadImageS3.js";
import Chat from "../models/Chat/Chat.model.js";
import Event from "../models/Event/Event.model.js";
import Notification from "../models/Notification/notification.model.js";
import Request from "../models/Request/request.model.js";
import User from "../models/User/user.model.js";

export const createEvent = async (req, res) => {
  const createEventSchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().required(),
    date: Joi.date().required(),
    timeStart: Joi.string().required(),
    timeEnd: Joi.string().required(),
    description: Joi.string().required(),
    privacy: Joi.string().required(),
    location: Joi.object({
      name: Joi.string().required(),
      coordinates: Joi.array().items(Joi.number().required()),
    }),
    coverImgSrc: Joi.string().required(),
  });

  const { error } = createEventSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const {
    title,
    type,
    date,
    timeStart,
    timeEnd,
    location,
    description,
    privacy,
    coverImgSrc,
  } = req.body;
  const eventDetails = {
    title,
    type,
    date,
    timeStart,
    timeEnd,
    description,
    privacy,
    imageSrc: coverImgSrc,
    location,
    ownerEvent: req.user._id,
  };
  try {
    const newEvent = new Event(eventDetails);
    const event = await newEvent.save();
    res.status(201).send(event);
  } catch (err) {
    res.status(400).send(err);
  }
};

export const uploadEventCoverImg = async (req, res) => {
  try {
    const uploadEventCoverSingle = uploadImageToS3("eventsCoverImages").single(
      "eventCoverImg-upload"
    );

    uploadEventCoverSingle(req, res, (err) => {
      if (err)
        return res.status(400).send({ success: false, message: err.message });

      res.send(req.file);
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const deleteEventCoverImg = async (req, res) => {
  try {
    const { fileName } = req.body;
    console.log(req.body);
    const data = await deleteImageFromS3({
      destinationPath: "eventsCoverImages",
      fileName,
    });
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: err.message });
  }
};

export const getEventsByType = async (req, res) => {
  const userInterests = req.user.interests;
  const getEvents = async () => {
    return Promise.all(
      userInterests.map(async (interest) => {
        const eventsByType = await Event.find({
          type: interest.type,
          date: { $gte: new Date() },
        });

        if (eventsByType.length > 0) {
          return { [interest.type]: eventsByType };
        }
      })
    );
  };

  try {
    const events = await getEvents();
    const eventsWithoutNull = events.filter((event) => {
      if (event !== undefined) {
        return event;
      }
    });
    res.send(eventsWithoutNull);
  } catch (err) {
    res.status(400).send(err);
  }
};

export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) throw new Error("Need EventId");
    if (!mongoose.isValidObjectId(eventId))
      throw new Error("No Valid Object ID");

    const event = await Event.findById(eventId).populate(
      "participants",
      "_id username avatar firstName lastName"
    );
    if (!event) return res.status(404).send("Event No Found");

    const eventOwner = await User.findById(event.ownerEvent);
    if (!eventOwner) throw new Error("לא נמצא יוזם האירוע");

    const eventOwnerDetails = {
      avatar: eventOwner.avatar,
      username: eventOwner.username,
      firstName: eventOwner.firstName,
      lastName: eventOwner.lastName,
    };

    res.send({ event, eventOwnerDetails });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const getEventsByOwnerId = async (req, res) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId) throw new Error("need ownerId");
    if (!mongoose.isValidObjectId(ownerId))
      throw new Error("No Valid Object ID");

    const events = await Event.find({ ownerEvent: ownerId });
    if (!events || events.length <= 0)
      return res.send({ status: "NoFound", statusMessage: "לא נמצאו אירועים" });

    res.send(events);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const getEventsUserParticipated = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) throw new Error("need userId");

    const events = await Event.find({
      participants: { $in: [userId] },
      date: { $lte: new Date() },
    });

    if (!events || events.length <= 0)
      return res.send({ status: "NoFound", statusMessage: "לא נמצאו אירועים" });

    res.send(events);
  } catch (err) {
    res.status(400).send({ status: "success", error: err.message });
  }
};

export const userJoinToEvent = async (req, res) => {
  const { _id: userId, firstName, lastName, username, avatar } = req.user;
  try {
    const { eventId } = req.body;
    if (!eventId) throw new Error("need eventId");

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).send("Event No Found");

    switch (event.privacy) {
      case "public":
        event.participants.push(userId);
        event.markModified("participants");
        const eventUpdated = await event.save();
        if (!eventUpdated) throw new Error("Something went wrong.");
        const newEventParticipationNotification = new Notification({
          sender: userId,
          receiver: event.ownerEvent,
          type: "event",
          content: `${firstName} ${lastName} הצטרף לאירוע שלך "${event.title}"`,
        });
        await newEventParticipationNotification.save();
        let notificationData = { ...newEventParticipationNotification };
        let notification = notificationData._doc;
        notification.sender = {
          avatar,
          username,
          _id: userId,
        };

        return res.send({
          status: "success",
          notification,
        });

      case "private":
        if (req.user.eventsRequests.includes(event._id))
          throw new Error("כבר ביקשת להצטרף לאירוע זה");

        const newEventRequest = new Request({
          sender: userId,
          receiver: event.ownerEvent,
          type: "event",
          refType: event._id,
          content: `${firstName} ${lastName} מבקש להצטרף לאירוע שלך "${event.title}"`,
        });
        await newEventRequest.save();
        let requestNotificationData = { ...newEventRequest };
        let requestNotification = requestNotificationData._doc;
        requestNotification.sender = {
          avatar,
          username,
          _id: userId,
        };
        req.user.eventsRequests.push(event._id);
        await req.user.save();
        return res.send({ status: "success", requestNotification });
    }
    throw new Error("No found privacy");
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const userCancelParticipation = async (req, res) => {
  const { _id: userId, firstName, lastName, avatar, username } = req.user;
  try {
    const { eventId } = req.body;
    if (!eventId) throw new Error("need eventId");

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).send("Event No Found");

    const userIsParticipant = event.participants.includes(userId);
    if (!userIsParticipant) throw new Error("אינך משתתף באירוע זה");

    event.participants = event.participants.filter(
      (participantId) => participantId.toString() !== userId.toString()
    );

    event.markModified("participants");
    const eventUpdated = await event.save();
    if (!eventUpdated) throw new Error("Something went wrong.");
    const newEventParticipationNotification = new Notification({
      sender: userId,
      receiver: event.ownerEvent,
      type: "event",
      content: `${firstName} ${lastName} ביטל את השתתפותו באירוע שלך "${event.title}"`,
    });
    await newEventParticipationNotification.save();
    let notificationData = { ...newEventParticipationNotification };
    let notification = notificationData._doc;
    notification.sender = {
      avatar,
      username,
      _id: userId,
    };
    res.send({ status: "success", notification });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

export const updateEvent = async (req, res) => {
  const { updatedForm, eventId } = req.body;

  if (!updatedForm) return;
  const updates = Object.keys(updatedForm);
  const allowedUpdates = [
    "imageSrc",
    "date",
    "timeStart",
    "timeEnd",
    "privacy",
    "location",
    "description",
    "participants",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Update!" });
  try {
    const event = await Event.findById(eventId);
    updates.forEach((update) => (event[update] = updatedForm[update]));
    await event.save();
    res.send(event);
  } catch (err) {
    res.send(err);
  }
};

export const updateEventParticipants = async (req, res) => {
  const { _id: userId, username, avatar } = req.user;
  const { participantsUpdated, participantsDeleted, eventId } = req.body;
  console.log({ participantsUpdated, participantsDeleted, eventId });

  try {
    const event = await Event.findById(eventId).populate("ownerEvent");
    event.participants = participantsUpdated;
    await event.save();

    const {
      firstName: ownerEventFirstName,
      lastName: ownerEventLastName,
      _id: ownerEventId,
    } = event.ownerEvent;

    const NotificationsToRemovedParticipants = async () => {
      return Promise.all(
        participantsDeleted.map(async (participantDeleted) => {
          const newEventParticipationNotification = new Notification({
            sender: ownerEventId,
            receiver: participantDeleted._id,
            type: "event",

            content: `${ownerEventFirstName} ${ownerEventLastName} ביטל את השתתפותך באירוע "${event.title}"`,
          });
          await newEventParticipationNotification.save();

          let notificationData = { ...newEventParticipationNotification };
          let notification = notificationData._doc;
          notification.sender = {
            avatar,
            username,
            _id: userId,
          };
          return notification;
        })
      );
    };

    const removeMembersFromGroupChat = async () => {
      const chat = await Chat.findOne({
        type: "group",
        eventId,
      });
      if (!chat) throw new Error("צאט לא נמצא");

      const membersUpdated = [...chat.members].filter((member) => {
        return !participantsDeleted.some(
          (memberDelete) => memberDelete.username === member
        );
      });

      chat.members = membersUpdated;
      const chatUpdated = await chat.save();
      return chatUpdated;
    };

    const notificationsToUsersRemoved =
      await NotificationsToRemovedParticipants();
    const removedMembersFromChatEvent = await removeMembersFromGroupChat();

    res.send({
      status: "success",
      NotificationsToRemovedParticipants: notificationsToUsersRemoved,
    });
  } catch (err) {
    res.send(err);
  }
};

export const getFavoriteEvents = async (req, res) => {
  const { _id: userId } = req.user;
  try {
    const userWithFavoriteEvents = await User.findById(userId).populate(
      "favoriteEvents"
    );

    res.send({
      status: "success",
      favoriteEvents: userWithFavoriteEvents.favoriteEvents,
    });
    // res.send({ event, eventOwnerDetails });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};
