import express, { urlencoded } from "express";
import cors from "cors";
import { userRouter } from "./routes/user.route.js";
import { eventsRouter } from "./routes/events.route.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome our to Meetingly API...");
});

app.use("/user", userRouter);
app.use("/events", eventsRouter);
