import pkg from "mongoose";
const { Schema } = pkg;

export const twitterAccountSchema = new Schema(
  {
    accountName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresIn: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
