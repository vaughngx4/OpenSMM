import express, { urlencoded } from "express";
import cors from "cors";
import Logger from "./application/logger.js";
import db from "./application/database.js";
import * as auth from "./application/authentication.js";
// import * as twitter from "./application/twitter.js"; 
import * as post from "./application/post.js";
import * as files from "./application/files.js";
const logger = new Logger("app");

const port = process.env.API_PORT || 5000;
const allowed = process.env.API_CORS_ALLOWED || "*";
const options = {
  origin: allowed,
};

const exp = express();
exp.use(urlencoded({ limit: "50mb", extended: true }));
exp.use(express.json());
exp.use(cors(options));

db.start();
auth.route(exp);
// twitter.route(exp);
post.route(exp);
files.route(exp);

exp.listen(port, () => {
  logger.log("info", `Listening on port ${port}`);
});
