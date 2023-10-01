import mongoose from "mongoose";
const { connect, model } = mongoose;
import Logger from "./logger.js";
import { userSchema } from "../models/user.js";
import { accountSchema } from "../models/account.js";
import { postSchema } from "../models/post.js";

const logger = new Logger("db");
mongoose.set("strictQuery", true);

const dbUser = process.env.DATABASE_USER || "opensmm";
const dbPass = process.env.DATABASE_PASSWORD || "opensmm";
const dbName = process.env.DATABASE_NAME || "opensmm";
const dbURI = `mongodb://${dbUser}:${dbPass}@opensmm-db/${dbName}?retryWrites=true&w=majority`;

const User = model("User", userSchema);
const Account = model("Account", accountSchema);
const Post = model("Post", postSchema);

function start() {
  connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      logger.log("info", "Database connection established");
    })
    .catch((err) => {
      logger.log("error", `Failed to connect to database: ${err}`);
      console.log(err);
    });
}

export default { start, dbURI, User, Account, Post };
