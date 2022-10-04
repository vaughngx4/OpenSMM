import { TwitterApi } from "twitter-api-v2";
import auth from "./authentication.js";
const { authenticateToken } = auth;
import redis from "./cache.js";
const { cache, uncache, getCache } = redis;
import db from "./database.js";
const { TwitterAccount, Post } = db;
import Logger from "./logger.js";

const logger = new Logger("twitter");
const clientId = process.env.TWITTER_CLIENT_ID || null;
const clientSecret = process.env.TWITTER_CLIENT_SECRET || null;
const domain = process.env.DOMAIN || "localhost";
const callbackURL = `https://${domain}/twitter/callback`;

export async function route(exp) {
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
                    res.redirect(
                      `https://${domain}/?status=success&message=Twitter&20account%20added`
                    );
                  })
                  .catch((err) => {
                    logger.log(
                      "error",
                      "Could not save Twitter account to database"
                    );
                    console.log(err);
                    res.redirect(
                      `https://${domain}/?status=error&message=Could&20not%20save%20Twitter%20account`
                    );
                  });
              } else {
                logger.log("error", "Twitter account already exists");
                res.redirect(
                  `https://${domain}/?status=error&message=Twitter&20account%20already%20exists`
                );
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
  exp.get("/twitter/accounts", authenticateToken, async function (req, res) {
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
  });
}

export async function post(
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
        data[0].accessToken,
        data[0].refreshToken,
        data[0].expiresIn,
        data[0].updatedAt
      );
      let options = {};
      if (!pollDuration) {
        logger.log("debug", "Tweet is type: Text");
      } else {
        logger.log("debug", "Tweet is type: Poll");
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
      logger.log("error", `Could not create post: ${err}`);
      console.log(err);
      logger.log("error", "Failed to post tweet");
      Post.findById(id)
        .then((data) => {
          data.data.twitter.status = "error";
          data
            .save()
            .then(() => {
              logger.log("debug", "Changed post status to error");
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

async function twitterUserClient(
  accessTokenCurrent,
  refreshTokenCurrent,
  expiresIn,
  updatedAt
) {
  const expiryDate = new Date(new Date(updatedAt).getTime() + expiresIn * 1000);
  let gotClient = null;
  if (new Date() > expiryDate) {
    logger.log("debug", "Access token expired, refreshing");
    const appClient = new TwitterApi({ clientId, clientSecret });
    const { client, accessToken, refreshToken } =
      await appClient.refreshOAuth2Token(refreshTokenCurrent);
    await TwitterAccount.find({ accessToken: accessTokenCurrent })
      .then(async (data) => {
        let account = data[0];
        account.accessToken = accessToken;
        account.refreshToken = refreshToken;
        await account
          .save()
          .then(() => {
            logger.log(
              "info",
              `Successful token refresh for account ${account.accountName}`
            );
            gotClient = client;
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
  } else {
    logger.log("debug", "Access token valid, not refreshing");
    gotClient = new TwitterApi(accessTokenCurrent);
  }
  return gotClient;
}
