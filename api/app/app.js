import express from "express";
import cors from "cors";
import Logger from "./application/logger.js";
import { start as startDb } from "./application/database.js";
import * as auth from "./application/authentication.js";
import * as facebook from "./application/socials/facebook.js"; 
import * as post from "./application/post.js";
import * as files from "./application/files.js";
import * as accounts from "./application/accounts.js";
const logger = new Logger("app");

const port = process.env.API_PORT || 5000;
const allowed = process.env.API_CORS_ALLOWED || "*";
const options = {
  origin: allowed,
};

const exp = express();
const { urlencoded } = express;
exp.use(urlencoded({ limit: "50mb", extended: true }));
exp.use(express.json());
exp.use(cors(options));

startDb()
auth.route(exp);
facebook.route(exp);
post.route(exp);
files.route(exp);
accounts.route(exp);

exp.listen(port, () => {
  logger.log("info", `Listening on port ${port}`);
});
