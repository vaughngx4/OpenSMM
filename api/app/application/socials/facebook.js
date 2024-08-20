import fetch from "node-fetch";
import { Account, toId } from "../database.js";
import { setStatus } from "../post.js";
import { authenticateToken } from "../authentication.js";
import Logger from "../logger.js";
const logger = new Logger("facebook");

const DOMAIN = process.env.DOMAIN || "localhost";
const DOMAIN_PORT = process.env.DOMAIN_PORT || "";
const APP_ID = process.env.FACEBOOK_APP_ID || "1234567890";
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || "1234567890";
const CONFIG_ID = process.env.FACEBOOK_CONFIG_ID || "1234567890";

export async function route(exp) {
  exp.get("/facebook/auth", function (req, res) {
    // redirect user to authorize the app
    try {
      res.redirect(
        `https://www.facebook.com/v20.0/dialog/oauth?client_id=${APP_ID}&config_id=${CONFIG_ID}&response_type=code&redirect_uri=https://${DOMAIN}:${DOMAIN_PORT}/callback/facebook`
      );
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Login error, please try again later",
      });
    }
  });
  exp.get("/facebook/callback", authenticateToken, async (req, res) => {
    // show error message if authorization failed
    if (req.query.error) {
      logger.log("error", `Facebook login failed [${req.params.error_reason}]`);
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          `Login failed with error: ${req.query.error_reason}`
        )}`
      );
      return;
    }
    // use authorization code to get user access token
    if (!req.query.code) {
      logger.log(
        "error",
        "No access code was included in the response from Facebook"
      );
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          "Login failed: Facebook denied the request for an access code"
        )}`
      );
      return;
    }
    const accessTokenReponse = await getUserAccessToken(req.query.code);
    if (accessTokenReponse.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          accessTokenReponse.error
        )}`
      );
      return;
    }
    const accessToken = accessTokenReponse.data.access_token;
    // verify token
    const accessTokenVerification = await verifyToken("USER", accessToken);
    // if valid, use access token to get long lived user access token
    if (accessTokenVerification.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          accessTokenVerification.error
        )}`
      );
      return;
    }
    const userId = accessTokenVerification.data.data.user_id;
    const longLivedUserAccessTokenResponse = await getLongLivedUserToken(
      accessToken
    );
    if (longLivedUserAccessTokenResponse.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          longLivedUserAccessTokenResponse.error
        )}`
      );
      return;
    }
    // use long lived user access token to get long lived page access token
    const longLivedUserAccessToken =
      longLivedUserAccessTokenResponse.data.access_token;
    const longLivedPageAccessTokenResponse = await getLongLivedPageToken(
      userId,
      longLivedUserAccessToken
    );
    if (longLivedPageAccessTokenResponse.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          longLivedPageAccessTokenResponse.error
        )}`
      );
      return;
    }
    // save pages one at a time
    const pages = longLivedPageAccessTokenResponse.data.data;
    let errors = 0;
    for (const page of pages) {
      await Account.find({
        user: req.user._id,
        id: page.id,
      })
        .then(async (data) => {
          if (data.length > 0) {
            // we found an existing login
            logger.log(
              "debug",
              `duplicate login for page ${page.name}, updating access token`
            );
            data[0].token = page.access_token;
            data[0].save().then((data) => {
              logger.log("info", `Login for page ${data.name} was updated`);
            });
          } else {
            // if we got this far then all was successful and there are no existing logins for this page
            // save this page to the database
            const newAccount = new Account({
              user: await toId(req.user._id),
              platform: "facebook",
              type: "page",
              name: page.name,
              id: page.id,
              token: page.access_token,
            });
            newAccount.save().then((data) => {
              logger.log("info", `Successfully logged in to page ${data.name}`);
            });
          }
        })
        .catch((error) => {
          logger.log("error", `Login for page ${page.name} failed`, error);
          errors += 1;
        });
    }
    let status = "error";
    let message = "An unknown error occurred, please try again later.";
    if (errors == 0) {
      status = "success";
      message = `Sucessfully logged in to ${pages.length} Facebook page(s).`;
    } else {
      message = `${errors} error(s) occurred while logging you in. ${
        pages.length - errors
      } of ${pages.length} pages were logged in.`;
    }
    res.redirect(
      `https://${DOMAIN}:${DOMAIN_PORT}?status=${status}&message=${encodeURIComponent(
        message
      )}`
    );
  });
}

async function verifyToken(type, token) {
  let result = {
    isValid: false,
  };
  await fetch(
    `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${APP_ID}|${APP_SECRET}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log("sensitive", "== Verify Token Response ==", json);
      if (json.data.type == type && json.data.app_id == APP_ID) {
        result = {
          isValid: true,
          data: json,
        };
      } else {
        logger.log("error", `Invalid token: type or app ID mismatch`);
      }
    })
    .catch((error) => {
      result["error"] = error;
      logger.log("error", `Failed to validate token: ${error}`);
    });
  return result;
}

async function getUserAccessToken(code) {
  let result = {};
  await fetch(
    `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&code=${code}&redirect_uri=https://${DOMAIN}:${DOMAIN_PORT}/callback/facebook`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then(async (json) => {
      logger.log("sensitive", "== Get User Access Token Response ==", json);
      if (json.access_token) {
        result["data"] = json;
      } else {
        result["error"] = "No access token was included in the response";
        logger.log("error", "No access token was included in the response");
      }
    })
    .catch((error) => {
      result["error"] = "Failed to get access token";
      logger.log("error", `Failed to get access token: ${error}`);
    });
  return result;
}

async function getLongLivedUserToken(accessToken) {
  const result = {};
  await fetch(
    `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${accessToken}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log(
        "sensitive",
        "== Get Long Lived User Access Token Response ==",
        json
      );
      result["data"] = json;
    })
    .catch((error) => {
      result["error"] = error;
      logger.log(
        "error",
        `Failed to get long lived user access token: ${error}`
      );
    });
  return result;
}

async function getLongLivedPageToken(userId, accessToken) {
  const result = {};
  await fetch(
    `https://graph.facebook.com/v20.0/${userId}/accounts?access_token=${accessToken}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log(
        "sensitive",
        "== Get Long Lived Page Access Token Response ==",
        json
      );
      result["data"] = json;
    })
    .catch((error) => {
      result["error"] = "Failed to get long lived page access token";
      logger.log(
        "error",
        `Failed to get long lived page access token: ${error}`
      );
    });
  return result;
}

// currently unused. May be used in the future for posting unpublished posts
export async function isScheduled(post) {
  // 0 = cannot be scheduled
  // 1 = can be scheduled
  // 2 = recheck after 30 days
  let result = 0;
  const d = new Date();
  const diffMins = Math.abs(post.datetime - d);
  if (10 < diffMins && 30 > diffMins / 60 / 24) {
    result = 1;
  } else if (30 < diffMins / 60 / 24) {
    result = 2;
  }
  return result;
}

export async function post(post, account, scheduled) {
  scheduled = scheduled || false;
  let bodyContent = {
    message: post.text,
    published: true,
    access_token: account.token,
  };
  if (post.link) {
    bodyContent["link"] = post.link;
  }
  if (scheduled) {
    bodyContent["scheduled_publish_time"] = Math.floor(
      post.datetime.getTime() / 1000
    );
    bodyContent["published"] = false;
  }
  await fetch(`https://graph.facebook.com/v20.0/${account.id}/feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyContent),
  })
    .then((response) => {
      return response.json();
    })
    .then(async (json) => {
      logger.log("sensitive", "== Facebook Page Post Response ==", json);
      if (json.id) {
        //post was successful, save post id and change status
        await setStatus(post, account, "posted", json.id);
        logger.log("info", `Post with ID [${json.id}] was created`);
      }
    });
}
