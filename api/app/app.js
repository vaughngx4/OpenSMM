const express = require("express");
const exp = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { userSchema } = require("./models/user");
const { twitterAccountSchema, twitterPostSchema } = require("./models/twitter");
const Logger = require("./application/logger");
const logger = new Logger("app");

var db;
const port = process.env.API_PORT || 5000;
const dbUser = process.env.DB_USERNAME || "opensmm";
const dbPass = process.env.DB_PASSWORD || "opensmm";
const dbName = process.env.DB_NAME || "opensmm";
const dbURI = `mongodb://${dbUser}:${dbPass}@opensmm-db/${dbName}?retryWrites=true&w=majority`;
const allowed = process.env.CORS_ALLOWED || "*";
const options = {
  origin: allowed,
};

exp.use(express.urlencoded({ extended: true }));
exp.use(express.json());
exp.use(cors(options));

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((connection) => {
    logger.log("info", "Database connection established");
    db = connection;
    const User = db.model("User", userSchema);
    const TwitterAccount = db.model("TwitterAccount", twitterAccountSchema);
    const TwitterPost = db.model("TwitterPost", twitterPostSchema);
    require("./application/authentication").route(exp, User);
    require("./application/twitter").route(exp, TwitterAccount, TwitterPost);
    //require("./application/post/twitter").route(exp, TwitterPost);
  })
  .then(() =>
    exp.listen(port, () => {
      logger.log("info", `Listening on port ${port}`);
    })
  )
  .catch((err) => {
    logger.log("error", `Failed to start: ${err}`);
    console.log(err);
  });
