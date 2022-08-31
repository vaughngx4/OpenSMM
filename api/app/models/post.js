const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountsSchema = new Schema({
  twitter: {
    type: Array,
    required: false,
  },
});

const twitterDataSchema = new Schema({
  postId: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true
  }
});

const postSchema = new Schema(
  {
    accounts: [accountsSchema],
    text: {
      type: String,
      required: false,
    },
    attachment: {
      type: String,
      required: false,
    },
    datetime: {
      type: Date,
      required: true,
    },
    pollDuration: {
      type: Number,
      required: false
    },
    pollOptions: {
      type: Array,
      required: false,
    },
    data: {
      twitter: twitterDataSchema
    },
  },
  { timestamps: true }
);

module.exports = { postSchema, accountsSchema };
