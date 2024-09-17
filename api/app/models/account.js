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
      // facebook / instagram / youtube etc.
      type: String,
      required: true,
    },
    type: {
      // type of account i.e Facebook could have a user account or page account
      // if you are writing a module to add social support, you can set the type to whatever you want
      type: String,
      required: true,
    },
    name: {
      // how user will identify the account, i.e username, email addreess, facebook page name etc.
      type: String,
      required: true,
    },
    picture: {
      // optional account profile picture
      type: String,
      required: false,
    },
    id: {
      // ID used by the social platform
      type: String,
      required: true,
    },
    token: {
      // access token used to make posts
      type: String,
      required: true,
    },
    token_expires_in:{
      // optional seconds until token expiration
      type: String,
      required: false,
    },
    refresh_token:{
      // optional refresh token
      type: String,
      required: false,
    },
    parent: {
      // optional account that this account was added from, if any
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
    },
  },
  { timestamps: true }
);
