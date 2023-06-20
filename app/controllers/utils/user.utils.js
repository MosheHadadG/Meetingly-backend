import bcryptjs from "bcryptjs";
import UserOtpVerification from "../../models/UserOtpVerification/UserOtpVerification.model.js";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import {
  EMAIL,
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
} from "../../../config.js";

const OAuth2 = google.auth.OAuth2;
const OAuth2_client = new OAuth2(CLIENT_ID, CLIENT_SECRET);
OAuth2_client.setCredentials({ refresh_token: REFRESH_TOKEN });

function sendMail(mailOptions) {
  const accessToken = OAuth2_client.getAccessToken();

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: EMAIL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken,
    },
  });

  transport.sendMail(mailOptions, (error, result) => {
    if (error) {
      console.log("Error", error);
    } else {
      console.log("Success", result);
    }
    transport.close();
  });
}

export const sendOtpVerificationEmail = async (user, res) => {
  const { _id, email } = user;
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOptions = {
      from: "meetingly.offical@gmail.com",
      to: email,
      subject: "MeetingLy - אמת את חשבון המייל שלך",
      html: `<h1>אשר את כתובת הדואר האלקטרוני שלך</h1>
      <p>משהו קטן שעלייך לעשות לפני יצירת החשבון שלך</p>
      <p>בוא נוודא שזו כתובת הדואר האלקטרוני שלך הזן את קוד האימות הבא בתיבה המיועדת לכך באתר</p>
      <p>קוד האימות: ${otp}</p>
      <h4>התוקף של קוד האימות פג אחרי שעה</h4>`,
    };

    const hashedOtp = await bcryptjs.hash(otp, 8);
    const newOtpVerification = await new UserOtpVerification({
      userId: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    await newOtpVerification.save();

    sendMail(mailOptions);
    res.send({
      status: "ממתין",
      message: "קוד אימות נשלח למייל",
      data: {
        userId: _id,
        email,
      },
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};
