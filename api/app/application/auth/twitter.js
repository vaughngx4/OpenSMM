const { TwitterApi } = require("twitter-api-v2");
//const { authenticateToken } = require("../authentication");
const { cache, uncache, getCache } = require("../cache");
const Logger = require("../logger");
const logger = new Logger("twitter");

const clientId = process.env.TWITTER_CLIENT_ID || null;
const clientSecret = process.env.TWITTER_CLIENT_SECRET || null;
const domain = process.env.DOMAIN || "localhost";
const callbackURL = `https://${domain}/twitter/callback`;

async function route(exp, TwitterAccount) {
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
              if ([] == data) {
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
}

module.exports = { route };
