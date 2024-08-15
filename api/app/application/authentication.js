import bcrypt from "bcryptjs";
const { compare, hash } = bcrypt;
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;
import { cache, uncache, getCache } from "./cache.js";
import { User } from "./database.js";
import Logger from "./logger.js";
const logger = new Logger("auth");
import { validateLogin } from "./validate.js";

const SECRET = process.env.SECRET || "somelongrandomkeystring";
const SECRET2 = process.env.SECRET2 || "somelongrandomkeystring";

export async function route(exp) {
  await initAdmin();
  exp.post("/authenticate", async function (req, res) {
    const validation = validateLogin(req.body);
    const username = validation.value?.username;
    const password = validation.value?.password;
    if (!validation.error) {
      const status = await authenticate(username, password);
      if (status.code == 200) {
        const refreshToken = sign({ data: status.user }, SECRET2, {
          expiresIn: 60 * 60,
        });
        await makeTokenValid(refreshToken, status.user._id)
          .then((success) => {
            if (success) {
              logger.log(
                "info",
                `User [${username}] authenticated successfully`
              );
              res.status(200).json({ status: "success", refreshToken });
            } else {
              logger.log("info", `Token caching error`);
              res
                .status(200)
                .json({ status: "error", message: "Server error" });
            }
          })
          .catch((err) => {
            logger.log("error", "Token caching error: " + err);
            res.status(500).json({ status: "error", message: "Server error" });
          });
      } else if (status.code == 403) {
        logger.log("info", `User [${username}] authentication failed`);
        res.status(403).json({ status: "error" });
      } else {
        logger.log(
          "error",
          `User [${username}] experienced an unknown authentication error`
        );
        res.status(500).json({ status: "error" });
      }
    } else {
      logger.log("error", `Bad request: ${validation.error.message}`);
      res.status(500).json({
        status: "error",
        message: `Bad request: ${validation.error.message}`,
      });
    }
  });
  exp.post("/refresh-token", async function (req, res) {
    const refreshToken = req.body["refreshToken"];
    verify(refreshToken, SECRET2, async (err, payload) => {
      if (err) {
        logger.log("debug", "Token could not be verified:denied");
        res.status(403).json({ status: "error" });
      } else {
        const status = await validateToken(refreshToken, payload.data._id);
        if (status == 200) {
          const accessToken = sign(
            {
              data: payload.data,
            },
            SECRET,
            { expiresIn: 30 }
          );
          logger.log("debug", "Successful token refresh");
          res.status(200).json({ status: "success", accessToken });
        } else if (status == 403) {
          logger.log("warn", "Invalid Token:denied");
          res.status(403).json({ status: "error" });
        } else {
          logger.log("error", "Token validation error:denied");
          res.status(500).json({ status: "error" });
        }
      }
    });
  });
  exp.post("/logout", async function (req, res) {
    const refreshToken = req.body["refreshToken"];
    verify(refreshToken, SECRET2, async (err, payload) => {
      if (err) {
        res.status(403).json({ status: "error" });
      } else {
        if (await invalidateToken(refreshToken, payload.data._id)) {
          logger.log(
            "debug",
            `User [${payload.data._id}] logged out successfully`
          );
          res.status(200).json({ status: "success" });
        } else {
          logger.log("error", `User [${payload.data._id}] failed to log out`);
          res.status(500).json({ status: "error" });
        }
      }
    });
  });
}

export function authenticateToken(req, res, next) {
  let token;
  if (req.headers["authorization"]) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  } else if (req.params.token) {
    token = req.params.token;
  }
  if (token == null) {
    logger.log("debug", "No auth token provided:denied");
    return res.sendStatus(401);
  }
  verify(token, SECRET, (err, payload) => {
    if (err) {
      logger.log("warn", `Invalid access token:denied ${err}`);
      return res.sendStatus(403);
    }
    logger.log("debug", `Valid access token:accepted`);
    req.user = payload.data;
    req.token = token;
    next();
  });
}

export async function createUser(u, p, r, t) {
  t = t || null;
  const password = await hash(p, 10);
  const user = new User({
    username: u.toLowerCase(),
    password,
    role: r,
  });
  user
    .save()
    .then(() => {
      logger.log("info", `User [${u}] created successfully`);
    })
    .catch((err) => {
      logger.log("error", `Error creating user: ${err}`);
    });
}

const locked = false;
function escape(level) {
  if (level == 1) {
    locked = true;
    logger.log(
      "error",
      "ESCAPE LEVEL 1 - AUTHENTICATION HAS BEEN LOCKED, PLEASE FIX ERROR(S) AND RESTART"
    );
  }
}

async function initAdmin() {
  const u = process.env.ADMIN_USER || "none";
  let p = process.env.ADMIN_PASSWORD || "none";
  if (u != "none" && p != "none") {
    User.find({ username: u })
      .then(async (data) => {
        if (data.length == 1) {
          const passMatch = await compare(p, data[0].password);
          if (data[0].username == u && passMatch) {
            logger.log("info", "Admin user already exists");
          } else {
            User.findByIdAndDelete(data[0]._id)
              .then(async () => {
                logger.log("info", "Deleted old admin user");
                await createUser(u, p, "admin");
              })
              .catch((err) => {
                logger.log(
                  "error",
                  `Error deleting existing admin user: ${err}`
                );
              });
          }
        } else if (data.length > 1) {
          logger.log("error", "duplicate admin user found, locking");
          escape(1);
        } else if (data.length == 0) {
          await createUser(u, p, "admin");
        }
      })
      .catch(() => {
        logger.log("error", "Error querying database for admin user");
      });
  } else {
    logger.log("error", "No admin user set in config");
  }
}

async function authenticate(user, pass) {
  let status = {};
  status["code"] = 500;
  await User.find({ username: user })
    .then(async (data) => {
      if (data.length == 1) {
        const authenticated = await compare(pass, data[0].password);
        if (authenticated && !locked) {
          status["code"] = 200;
          status["user"] = {
            _id: data[0]._id,
            name: data[0].username,
            role: data[0].role,
          };
        } else {
          status["code"] = 403;
        }
      } else if (data.length == 0) {
        status["code"] = 403;
      } else {
        logger.log("error", "duplicate admin user found, locking");
        escape(1);
        status["code"] = 500;
      }
    })
    .catch((err) => {
      logger.log("error", `Authentication error: ${err}`);
      status["code"] = 500;
    });
  return status;
}

async function makeTokenValid(token, _id) {
  return await cache(_id, token);
}

async function invalidateToken(token, _id) {
  let status = false;
  if (200 == (await validateToken(token, _id))) {
    status = await uncache(_id);
  } else {
    status = false;
  }
  return status;
}

async function validateToken(token, _id) {
  let status = 500;
  const cachedToken = await getCache(_id);
  if (token == cachedToken) {
    status = 200;
  } else {
    status = 403;
  }
  return status;
}
