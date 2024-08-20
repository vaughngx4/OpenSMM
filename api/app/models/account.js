import { Schema } from "mongoose";

export const accountSchema = new Schema(
  {
    user: {
      // the user to which this account belongs
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      // facebook / instagram / youtube
      type: String,
      required: true,
    },
    type: {
      // type of account i.e Facebook could have a user account or page account
      type: String,
      required: true,
    },
    name: {
      // how user will identify the account, i.e username, email addreess, facebook page name etc.
      type: String,
      required: true,
    },
    id: {
      // ID used by the social platform
      type: String,
      required: false,
    },
    token: {
      // access token used to make posts
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
