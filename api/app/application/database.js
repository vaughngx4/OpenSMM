import mongoose from "mongoose";
const { connect, model } = mongoose;
import Logger from "./logger.js";
import { userSchema } from "../models/user.js";
import { postSchema } from "../models/post.js";
import { accountSchema } from "../models/account.js";

const logger = new Logger("db");
mongoose.set("strictQuery", true);

const dbUser = process.env.DATABASE_USER || "opensmm";
const dbPass = process.env.DATABASE_PASSWORD || "opensmm";
const dbName = process.env.DATABASE_NAME || "opensmm";
export const dbURI = `mongodb://${dbUser}:${dbPass}@opensmm-db/${dbName}?retryWrites=true&w=majority`;

export const User = model("User", userSchema);
export const Post = model("Post", postSchema);
export const Account = model("Account", accountSchema);

export function start() {
  connect(dbURI)
    .then(() => {
      logger.log("info", "Database connection established");
    })
    .catch((err) => {
      logger.log("error", `Failed to connect to database: ${err}`);
      console.log(err);
    });
}

export async function toId(id) {
  return new mongoose.Types.ObjectId(id);
}
