import pkg from "mongoose";
const { Schema } = pkg;

export const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    tokens: {
      type: Array,
      required: false,
    },
    privelages: {
      type: Array,
      required: false,
    },
  },
  { timestamps: true }
);
