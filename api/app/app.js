const express = require("express");
const cors = require("cors");
const Logger = require("./application/logger");
const logger = new Logger("app");

const port = process.env.API_PORT || 5000;
const allowed = process.env.CORS_ALLOWED || "*";
const options = {
  origin: allowed,
};

const exp = express();
exp.use(express.urlencoded({ extended: true }));
exp.use(express.json());
exp.use(cors(options));

require("./application/database");
require("./application/authentication").route(exp);
require("./application/twitter").route(exp);
require("./application/post").route(exp);

exp.listen(port, () => {
  logger.log("info", `Listening on port ${port}`);
});
