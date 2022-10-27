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
  exp.get("/twitter/login/v2", async function (req, res) {
    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret,
    });
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackURL + "/v2",
      { scope: ["tweet.read", "tweet.write", "users.read", "offline.access"] }
    );
    await cache(`${req.user}-twitter-codeverifier`, codeVerifier);
    await cache(`${req.user}-twitter-state`, state);
    res.redirect(url);
  });
  exp.get("/twitter/callback/v2", async function (req, res) {
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
      .loginWithOAuth2({ code, codeVerifier, redirectUri: callbackURL + "/v2" })
      .then(
        async ({
          client: loggedClient,
          accessToken,
          refreshToken,
          expiresIn,
        }) => {
          const { data: userObject } = await loggedClient.v2.me();
          logger.log("info", `Authorized account ${userObject.username}`);
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
                    logger.log("info", "Twitter (v2) account added");
                  })
                  .then(() => {
                    res.redirect(
                      `https://${domain}/?status=success&message=Twtter%20account%20added.%20Add%20Twitter%20v1%20account%20for%20additional%20features.`
                    );
                  })
                  .catch((err) => {
                    logger.log(
                      "error",
                      "Could not save Twitter account to database (v2)"
                    );
                    console.log(err);
                    res.redirect(
                      `https://${domain}/?status=error&message=Could&20not%20save%20Twitter%20account`
                    );
                  });
              } else {
                logger.log("error", "Twitter account already exists (v2)");
                res.redirect(
                  `https://${domain}/?status=error&message=Twitter&20account%20already%20exists`
                );
              }
            }
          );
        }
      )
      .catch(() => {
        logger.log("error", "Invalid access tokens (v2)");
        res
          .status(403)
          .json({ status: "error", message: "Invalid access tokens" });
      });
  });
  exp.get("/twitter/login/v1", async function (req, res) {
    const client = new TwitterApi({
      appKey: clientId,
      appSecret: clientSecret,
    });
    const { url, oauth_token, oauth_token_secret } =
      await client.generateAuthLink(callbackURL + "/v1");
    await cache(`${req.user}-twitter-oauth_token_secret`, oauth_token_secret);
    res.redirect(url);
  });
  exp.get("/twitter/callback/v1", async function (req, res) {
    const { oauth_token, oauth_verifier } = req.query;
    const oauth_token_secret = await getCache(
      `${req.user}-twitter-oauth_token_secret`
    );
    uncache(`${req.user}-twitter-oauth_token_secret`);
    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
      logger.log("error", "Access denied by user or session expired (v1)");
      return res.status(400).json({
        status: "error",
        message: "You denied access or session expired",
      });
    }
    const client = new TwitterApi({
      appKey: clientId,
      appSecret: clientSecret,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });
    client
      .login(oauth_verifier)
      .then(async ({ client: loggedClient, accessToken, accessSecret }) => {
        const username = loggedClient.v1.user.name;
        logger.log("info", `Authorized account ${username} (v1)`);
        TwitterAccount.find({ accountName: username }).then(async (data) => {
          if (data.length > 0) {
            let twitter = data[0];
            twitter.accessTokenv1 = accessToken;
            twitter.accessSecretv1 = accessSecret;
            twitter
              .save()
              .then(() => {
                logger.log("info", "Twitter (v1) account added");
              })
              .then(() => {
                res.redirect(
                  `https://${domain}/?status=success&message=Twitter&20v1%20account%20added`
                );
              })
              .catch((err) => {
                logger.log(
                  "error",
                  "Could not save Twitter (v1) account to database"
                );
                console.log(err);
                res.redirect(
                  `https://${domain}/?status=error&message=Could&20not%20save%20Twitter%20account%20v1`
                );
              });
          } else {
            logger.log("error", "Twitter account not logged in via API v2");
            res.redirect(
              `https://${domain}/?status=error&message=Twitter&20account%20not%20found.%20Have%20you%20logged%20in%20using%20Twitter%20v2%3F`
            );
          }
        });
      })
      .catch(() => {
        logger.log("error", "Invalid verifier or access tokens (v1)");
        res.status(403).json({
          status: "error",
          message: "Invalid verifier or access tokens",
        });
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
      const clientv2 = await twitterUserClientv2(
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
        options["poll"] = {
          duration_minutes: pollDuration,
          options: pollOptions,
        };
      }
      if (attachment) {
        logger.log("debug", "Tweet has media attached");
        const clientv1 = new TwitterApi({
          appKey: clientId,
          appSecret: clientSecret,
          accessToken: data[0].accessTokenv1,
          accessSecret: data[0].accessSecretv1,
        });
        options["media_ids"] = await clientv1.v1.uploadMedia(attachment);
      }
      const { data: createdTweet } = await clientv2.v2.tweet(text, options);
      logger.log("info", `New tweet created with ID ${createdTweet.id}`);
      result = tweet.id;
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

async function twitterUserClientv2(
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
