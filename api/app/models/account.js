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
    userEmail: {
      // how user will identify the account, i.e username, email addreess, facebook page name etc.
      type: String,
      required: true,
    },
    primaryId: {
      // usually user ID
      type: String,
      required: false,
    },
    primaryAccessToken: {
      // usually user access token
      type: String,
      required: false,
    },
    secondaryId: {
      // other ID i.e Facebook page ID
      type: String,
      required: false,
    },
    secondaryAccessToken: {
      // other access token i.e Facebook page access token (TOKEN USED TO POST)
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
