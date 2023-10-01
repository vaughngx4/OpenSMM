import pkg from "mongoose";
const { Schema } = pkg;

export const accountSchema = new Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
