import { Schema } from "mongoose";

const dataSchema = new Schema({
  account: {
    // account to be posted to
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  postId: {
    // id returned by API upon creating the post - may be used to publish after posting
    type: String,
    required: false,
  },
  status: {
    // whether or not the post has been posted/published or if an error has occurred
    type: String,
    required: true,
  },
});

export const postSchema = new Schema(
  {
    title: {
      // optional post title
      type: String,
      required: false,
    },
    text: {
      // optional post text
      type: String,
      required: false,
    },
    link: {
      // optional url
      type: String,
      required: false,
    },
    attachment: {
      // optional attachment stored as array of local paths
      type: Array,
      required: false,
    },
    datetime: {
      // date/time to publish, scheduled date/time may differ
      type: Date,
      required: true,
    },
    notify: {
      // optional whether or not to notify followers on supported platforms
      type: Boolean,
      required: false,
    },
    data: [dataSchema],
  },
  { timestamps: true }
);
