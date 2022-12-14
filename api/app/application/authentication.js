const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { cache, uncache, getCache } = require("./cache");
const { User } = require("./database");
const Logger = require("./logger");
const logger = new Logger("auth");

const secret = process.env.SECRET_1;
const refresh_secret = process.env.SECRET_2;

async function route(exp) {
  const locked = false;
  function escape(level) {
    if (level == 1) {
      locked = true;
      logger.log(
        "warn",
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
            const passMatch = await bcrypt.compare(p, data[0].password);
            if (data[0].username == u && passMatch) {
              logger.log("info", "Admin user already exists");
            } else {
              User.findByIdAndDelete(data[0]._id)
                .then(async () => {
                  logger.log("info", "Deleted old admin user");
                  await createAdmin(u, p);
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
            await createAdmin(u, p);
          }
        })
        .catch(() => {
          logger.log("error", "Error querying database for admin user");
        });
    } else {
      logger.log("error", "No admin user set in config");
    }
  }
  async function createAdmin(u, p) {
    const password = await bcrypt.hash(p, 10);
    const user = new User({
      username: u,
      password,
    });
    user
      .save()
      .then(() => {
        logger.log("info", "Admin user created successfully");
      })
      .catch((err) => {
        logger.log("error", `Error creating admin user: ${err}`);
      });
  }
  await initAdmin();
  async function authenticate(user, pass) {
    let status_code = 500;
    await User.find({ username: user })
      .then(async (data) => {
        if (data.length == 1) {
          const authenticated = await bcrypt.compare(pass, data[0].password);
          if (authenticated && !locked) {
            status_code = 200;
          } else {
            status_code = 403;
          }
        } else if (data.length == 0) {
          status_code = 403;
        } else {
          logger.log("error", "duplicate admin user found, locking");
          escape(1);
          status_code = 500;
        }
      })
      .catch((err) => {
        logger.log("error", `Authentication error: ${err}`);
        status_code = 500;
      });
    return status_code;
  }
  async function makeTokenValid(token, user) {
    return await cache(user.name, token);
  }
  async function invalidateToken(token, user) {
    let status = false;
    if (validateToken(token, user)) {
      status = await uncache(user.name);
    } else {
      status = false;
    }
    return status;
  }

  async function validateToken(token, user) {
    let status = 500;
    const cachedToken = await getCache(user.name);
    if (token == cachedToken) {
      status = 200;
    } else {
      status = 403;
    }
    return status;
  }
  exp.post("/api/authenticate", async function (req, res) {
    const username = req.body["username"];
    const password = req.body["password"];
    const statusCode = await authenticate(username, password);
    if (statusCode == 200) {
      const user = { name: username };
      const accessToken = generateAccessToken(user);
      const refreshToken = jwt.sign(user, refresh_secret);
      await makeTokenValid(refreshToken, user)
        .then(() => {
          logger.log("info", `User [${username}] authenticated successfully`);
          res
            .status(200)
            .json({ status: "success", accessToken, refreshToken });
        })
        .catch((err) => {
          logger.log("error", "Token caching error: " + err);
          res.status(500).json({ status: "error" });
        });
    } else if (statusCode == 403) {
      logger.log("info", `User [${username}] authentication failed`);
      res.status(403).json({ status: "error" });
    } else {
      res.status(500).json({ status: "error" });
    }
  });
  exp.post("/api/re-toke", async function (req, res) {
    const reToke = req.body["refreshToken"];
    jwt.verify(reToke, refresh_secret, async (err, user) => {
      if (err) {
        res.status(403).json({ status: "error" });
        logger.log("debug", "Token could not be verified:denied");
      } else {
        user = {
          name: user.name,
        };
        const status = await validateToken(reToke, user);
        if (status == 200) {
          const accessToken = generateAccessToken(user);
          res.status(200).json({ status: "success", accessToken });
          logger.log("debug", "Successful token refresh");
        } else if (status == 403) {
          logger.log("warn", "Invalid Token:denied");
          res.status(403).json({ status: "error" });
        } else {
          logger.log("err", "Token validation error:denied");
          res.status(500).json({ status: "error" });
        }
      }
    });
  });
  exp.post("/api/logout", authenticateToken, async function (req, res) {
    const reToke = req.body["refreshToken"];
    jwt.verify(reToke, refresh_secret, async (err, user) => {
      if (err) {
        res.status(403).json({ status: "error" });
      } else {
        if (await invalidateToken(reToke, user)) {
          res.status(200).json({ status: "success" });
        } else {
          res.status(500).json({ status: "error" });
        }
      }
    });
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      logger.log("warn", `Invalid access token:denied ${err}`);
      return res.sendStatus(403);
    }
    logger.log("debug", `Valid access token:accepted`);
    req.user = user;
    next();
  });
}

function generateAccessToken(user) {
  return jwt.sign(user, secret, { expiresIn: 10 });
}

module.exports = { route, authenticateToken };
