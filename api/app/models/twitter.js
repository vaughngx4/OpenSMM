const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const twitterAccountSchema = new Schema(
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

module.exports = { twitterAccountSchema };
