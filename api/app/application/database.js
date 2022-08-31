const mongoose = require("mongoose");
const Logger = require('./logger');
const { userSchema } = require("../models/user");
const { twitterAccountSchema } = require("../models/twitter");
const { postSchema } = require("../models/post");

const logger = new Logger('db');
const dbUser = process.env.DB_USERNAME || "opensmm";
const dbPass = process.env.DB_PASSWORD || "opensmm";
const dbName = process.env.DB_NAME || "opensmm";
const dbURI = `mongodb://${dbUser}:${dbPass}@opensmm-db/${dbName}?retryWrites=true&w=majority`;

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.log("info", "Database connection established");
  })
  .catch((err) => {
    logger.log("error", `Failed to connect to database: ${err}`);
    console.log(err);
  });

const User = mongoose.model("User", userSchema);
const TwitterAccount = mongoose.model("TwitterAccount", twitterAccountSchema);
const Post = mongoose.model("Post", postSchema);

module.exports = { User, TwitterAccount, Post };
