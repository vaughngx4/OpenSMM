const { TwitterApi } = require("twitter-api-v2");
const { authenticateToken } = require("./authentication");
const { cache, uncache, getCache } = require("./cache");
const { TwitterAccount, Post } = require("./database");
const Logger = require("./logger");

const logger = new Logger("twitter");
const clientId = process.env.TWITTER_CLIENT_ID || null;
const clientSecret = process.env.TWITTER_CLIENT_SECRET || null;
const domain = process.env.DOMAIN || "localhost";
const callbackURL = `https://${domain}/twitter/callback`;

async function route(exp) {
  exp.get("/twitter/login", async function (req, res) {
    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret,
    });
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackURL,
      { scope: ["tweet.read", "tweet.write", "users.read", "offline.access"] }
    );
    await cache(`${req.user}-twitter-codeverifier`, codeVerifier);
    await cache(`${req.user}-twitter-state`, state);
    res.redirect(url);
  });
  exp.get("/twitter/callback", async function (req, res) {
    const { state, code } = req.query;
    const codeVerifier = await getCache(`${req.user}-twitter-codeverifier`);
    const sessionState = await getCache(`${req.user}-twitter-state`);
    uncache(`${req.user}-twitter-codeverifier`);
    uncache(`${req.user}-twitter-state`);
    if (!codeVerifier || !state || !sessionState || !code) {
      logger.log("error", "Access denied by user or session expired");
      return res.status(400).json({
        status: "error",
        message: "You denied access or session expired",
      });
    }
    if (state !== sessionState) {
      logger.log("error", "Token mismatch");
      return res
        .status(400)
        .json({ status: "error", message: "Token mismatch" });
    }
    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret,
    });
    client
      .loginWithOAuth2({ code, codeVerifier, redirectUri: callbackURL })
      .then(
        async ({
          client: loggedClient,
          accessToken,
          refreshToken,
          expiresIn,
        }) => {
          const { data: userObject } = await loggedClient.v2.me();
          logger.log("debug", `Authorized account ${userObject.username}`);
          const twitter = new TwitterAccount({
            accountName: userObject.username,
            accessToken,
            refreshToken,
            expiresIn,
          });
          TwitterAccount.find({ accountName: userObject.username }).then(
            async (data) => {
              if (0 == data.length) {
                twitter
                  .save()
                  .then(() => {
                    logger.log("info", "Twitter account added");
                  })
                  .then(() => {
                    res.redirect(`https://${domain}`);
                  })
                  .catch((err) => {
                    logger.log(
                      "error",
                      "Could not save Twitter account to database"
                    );
                    console.log(err);
                    res.status(500).json({
                      status: "error",
                      message: "Could not save Twitter account to database",
                    });
                  });
              } else {
                logger.log("error", "Twitter account already exists");
                res.status(400).json({
                  status: "error",
                  message: "Twitter account already exists",
                });
              }
            }
          );
        }
      )
      .catch(() => {
        logger.log("error", "Invalid access tokens");
        res
          .status(403)
          .json({ status: "error", message: "Invalid access tokens" });
      });
  });
  exp.get(
    "/twitter/api/accounts",
    authenticateToken,
    async function (req, res) {
      TwitterAccount.find()
        .then((data) => {
          let accounts = [];
          data.forEach((account) => {
            accounts.push(account.accountName);
          });
          logger.log("debug", "Got accounts from database");
          res.status(200).json({ status: "success", data: accounts });
        })
        .catch((err) => {
          logger.log("error", `Error getting accounts from database: ${err}`);
          res.status(500).json({
            status: "error",
            message: "Error getting accounts from database",
          });
        });
    }
  );
}

async function post(
  id,
  accountName,
  text,
  attachment,
  pollDuration,
  pollOptions
) {
  let result = false;
  attachment = attachment || null;
  pollDuration = pollDuration || null;
  pollOptions = pollOptions || null;
  await TwitterAccount.find({ accountName })
    .then(async (data) => {
      const client = await twitterUserClient(
        data.accessToken,
        data.refreshToken
      );
      let options = {};
      if (!pollDuration) {
        logger.log("debug", "Tweet is type: Poll");
      } else {
        logger.log("debug", "Tweet is type: Text");
        options = {
          poll: { duration_minutes: pollDuration, options: pollOptions },
        };
      }
      const { data: createdTweet } = await client.v2.tweet(text, options);
      logger.log("info", `New tweet created with ID ${createdTweet.id}`);
      result = createdTweet.id;
      Post.findById(id)
        .then((data) => {
          data.data.twitter.status = "posted";
          data
            .save()
            .then(() => {
              logger.log("debug", "Changed post status to posted");
            })
            .catch((err) => {
              logger.log(
                "error",
                `Failed to update post status in database: ${err}`
              );
            });
        })
        .catch((err) => {
          logger.log(
            "error",
            `Post with database ID ${id} could not be read: ${err}`
          );
        });
    })
    .catch((err) => {
      logger.log(
        "error",
        `Could not get account details from database: ${err}`
      );
      logger.log("error", "Failed to post tweet");
      Post.findById(id)
        .then((data) => {
          data.data.twitter.status = "error";
          data
            .save()
            .then(() => {
              logger.log("debug", "Changed post status to posted");
            })
            .catch((err) => {
              logger.log(
                "error",
                `Failed to update post status in database: ${err}`
              );
            });
        })
        .catch((err) => {
          logger.log(
            "error",
            `Post with database ID ${id} could not be read: ${err}`
          );
        });
    });
  return result;
}

async function twitterUserClient(accessTokenCurrent, refreshTokenCurrent) {
  const client = new TwitterApi(accessToken);
  let gotClient = client;
  const userObject = await client.v2.me();
  if (!userObject.username) {
    const appClient = new TwitterApi({ clientId, clientSecret });
    const {
      client: refreshedClient,
      accessToken,
      refreshToken: newRefreshToken,
    } = await appClient.refreshOAuth2Token(refreshTokenCurrent);
    await TwitterAccount.find({ accessToken: accessTokenCurrent })
      .then((data) => {
        data.accessToken = accessToken;
        data.refreshToken = newRefreshToken;
        data
          .save()
          .then(() => {
            gotClient = refreshedClient;
            logger.log(
              "info",
              `Successful token refresh for account ${accountName}`
            );
          })
          .catch((err) => {
            logger.log(
              "error",
              `Could save refreshed twitter account details: ${err}`
            );
          });
      })
      .catch((err) => {
        logger.log("error", `Could locate twitter account: ${err}`);
      });
  }
  return gotClient;
}

module.exports = { route, post };
