import jsonwebtoken from "jsonwebtoken";
import User from "../models/User/user.model.js";
import { JWT_SECRET_KEY } from "../../config.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jsonwebtoken.verify(token, JWT_SECRET_KEY);

    const user = await User.findOne({ _id: decoded._id });
    if (!user) throw new Error();

    req.token = token;
    req.user = user;
    next();
  } catch (err) {
    res.status(401).send({ error: "Please Authenticate." });
  }
};
