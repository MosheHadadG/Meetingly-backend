import aws from "aws-sdk";
import multer from "multer";
// import { S3Client } from "@aws-sdk/client-s3";

import multerS3 from "multer-s3";
import {
  S3_ACCESS_KEY,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_REGION,
} from "../../config.js";
import { v4 as uuidv4 } from "uuid";

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

aws.config.update({
  secretAccessKey: S3_SECRET_ACCESS_KEY,
  accessKeyId: S3_ACCESS_KEY,
  region: S3_BUCKET_REGION,
});

// const s3 = new AWS.S3({
//   accessKeyId: S3_ACCESS_KEY,
//   secretAccessKey: S3_SECRET_ACCESS_KEY,
//   Bucket: "meetingly",
// });

const s3 = new aws.S3();

// let s3 = new S3Client({
//   region: S3_BUCKET_REGION,
//   credentials: {
//     accessKeyId: S3_ACCESS_KEY,
//     secretAccessKey: S3_SECRET_ACCESS_KEY,
//   },
// });

export const uploadImageToS3 = (destinationPath) => {
  return multer({
    limits: {
      fileSize: 1000000,
    },
    storage: multerS3({
      s3,
      bucket: "meetingly",
      key: (req, file, cb) => {
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, `${destinationPath}/${uuidv4()}.${ext}`);
      },
    }),

    fileFilter(req, file, cb) {
      console.log(file);
      // console.log(file);
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error("Please upload an image");
      cb(error, isValid);
    },
  });
};

export const deleteImageFromS3 = ({ destinationPath, fileName }) => {
  return new Promise((resolve, reject) => {
    s3.deleteObjects(
      {
        Bucket: "meetingly",
        Delete: {
          Objects: [{ Key: `${destinationPath}/${fileName}` }],
          Quiet: false,
        },
      },
      function (err, data) {
        if (err) reject(err);
        console.log("delete successfully", data);
        return resolve(data);
      }
    );
  });
};
