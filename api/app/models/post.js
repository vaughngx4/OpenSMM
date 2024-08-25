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
    text: {
      // text to be published
      type: String,
      required: false,
    },
    link: {
      // url to be uncluded with text
      type: String,
      required: false,
    },
    attachment: {
      // attachment is stored as an array of local paths
      type: Array,
      required: false,
    },
    datetime: {
      // date/time to publish, scheduled time may differ - post may be created unpublished
      type: Date,
      required: true,
    },
    data: [dataSchema],
  },
  { timestamps: true }
);
