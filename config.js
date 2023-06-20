import dotenv from "dotenv";

dotenv.config();

export const mongoURI = process.env.MONGO_URI;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
export const EMAIL = process.env.EMAIL;
export const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;
export const CLIENT_ID = process.env.CLIENT_ID;
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
export const S3_BUCKET_REGION = process.env.S3_BUCKET_REGION;
