import { google } from "googleapis";
import { authenticateToken } from "../authentication.js";
import { Account } from "../database.js";
import Logger from "../logger.js";
import * as fs from "node:fs";
import { basename } from "node:path";
import { fileInfo } from "../files.js";
import { stripNonsense } from "./common.js";
import { setStatus } from "../post.js";

const logger = new Logger("youtube");
const people = google.people("v1");
const youtube = google.youtube("v3");

const DOMAIN = process.env.DOMAIN || "localhost";
const DOMAIN_PORT = process.env.DOMAIN_PORT || "";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `https://${DOMAIN}:${DOMAIN_PORT}/callback/youtube`;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "1234567890";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "1234567890";

google.options({
  http2: true,
});

export async function route(exp) {
  exp.get("/youtube/auth", authenticateToken, async (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    });
    res
      .status(302)
      .send(`You are being redirected to Google. Click <a href="${url}">here</a> to continue.`);
  });
  exp.get("/youtube/callback", authenticateToken, async (req, res) => {
    let status = "error";
    let msg = "Login failed. Please try again later.";
    const client = await getClient();
    if (req.query.code) {
      logger.log(
        "sensitive",
        "== YouTube Authentication Code ==",
        req.query.code
      );
      const { tokens } = await client.getToken(req.query.code);
      if (tokens.refresh_token) {
        logger.log("sensitive", "== YouTube Authorization Tokens ==", tokens);
        // we now have a refresh token, save the account
        // tokens are automatically set by the client, we can now make authenticated calls to the YouTube API
        try {
          const userInfo = await getUserInfo(client);
          await Account.find({
            user: req.user._id,
            name: userInfo.emailAddresses[0].value,
            id: userInfo.resourceName,
          })
            .then(async (data) => {
              if (data.length > 0) {
                data[0].token = tokens.access_token;
                data[0].refresh_token = tokens.refresh_token;
                data[0].save().then((data) => {
                  logger.log(
                    "debug",
                    `Successfully updated login for ${data.id}`
                  );
                });
              } else {
                const account = new Account({
                  user: req.user._id,
                  platform: "google",
                  type: "youtube",
                  name: userInfo.emailAddresses[0].value,
                  id: userInfo.resourceName,
                  token: tokens.access_token,
                  refresh_token: tokens.refresh_token,
                });
                await account.save().then((data) => {
                  logger.log("debug", `Successfully logged in to ${data.id}`);
                  status = "success";
                  msg = "Successfully logged in to YouTube";
                });
              }
            })
            .catch((error) => {
              logger.log("error", "Login error", error);
            });
        } catch (error) {
          logger.log("error", "Failed to save account", error);
          msg =
            "The API is not doing API things, try again in a little bit maybe?";
        }
      } else if (tokens.access_token && !tokens.refresh_token) {
        status = "error";
        msg =
          "You need to reauthenticate. Revoke permissions by going to https://myaccount.google.com/permissions and try again.";
      }
    }
    res.redirect(
      `https://${DOMAIN}:${DOMAIN_PORT}?status=${status}&message=${encodeURIComponent(
        stripNonsense(msg)
      )}`
    );
  });
}

async function getClient(userId, access_token, refresh_token) {
  access_token = access_token || null;
  refresh_token = refresh_token || null;
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  if (access_token) {
    oauth2Client.setCredentials({
      access_token,
    });
  }
  if (refresh_token) {
    oauth2Client.setCredentials({
      refresh_token,
    });
  }
  // oauth2Client.on("tokens", async (tokens) => {
  //   oauth2Client.setCredentials(tokens);
  //   // we now have an access token
  //   if (tokens.refresh_token) {
  //     // we now have refresh token, save token to db
  //   }
  // });
  return oauth2Client;
}

async function getUserInfo(oauth2Client) {
  const res = await people.people.get({
    auth: oauth2Client,
    resourceName: "people/me",
    personFields: "emailAddresses",
  });
  logger.log("sensitive", "== Get User Info Response ==", res.data);
  return res.data;
}

async function upload(
  oauth2Client,
  videoInfo,
  thumbInfo,
  publishAt,
  title,
  description,
  notifySubscribers
) {
  let result = {};
  // this await is needed because the insert function can optionally return a promise
  // which is what we want, ignore the underline in your IDE
  try {
    const res = await youtube.videos.insert(
      {
        auth: oauth2Client,
        part: "id,snippet,status",
        notifySubscribers,
        requestBody: {
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus: "private",
            publishAt,
          },
        },
        media: {
          body: fs.createReadStream(videoInfo.path),
          mimeType: videoInfo.mime,
        },
      },
      {
        onUploadProgress: (evt) => {
          const progress = Math.round((evt.bytesRead / videoInfo.length) * 100);
          // readline.clearLine(process.stdout, 0);
          // readline.cursorTo(process.stdout, 0, null);
          // process.stdout.write(`${progress}% complete`);
          logger.log(
            "debug",
            `Uploading file ${basename(videoInfo.path)} ${progress}%`
          );
        },
      }
    );
    logger.log("sensitive", "== Upload RES ==", res);
    logger.log("sensitive", "== Upload Response ==", res.data);
    result["data"] = res.data;
  } catch (error) {
    logger.log("error", "The API is not doing API things", error);
    result["error"] = "Possibly rate limited";
  }
  return result;
}

export async function post(post, account) {
  const notifySubscribers = post.notify || false;
  let videoInfo = null;
  let thumbInfo = null;
  let potentialThumb = null;

  for (const file of post.attachment) {
    const info = await fileInfo(file);
    switch (info.description) {
      case "video":
        videoInfo = info;
        if (
          potentialThumb &&
          potentialThumb.name === `${videoInfo.name}_thumbail`
        ) {
          thumbInfo = potentialThumb;
        }
        break;
      case "image":
        if (!videoInfo) {
          potentialThumb = info;
        } else if (info.name === `${videoInfo.name}_thumbail`) {
          thumbInfo = info;
        } else if (!thumbInfo) {
          thumbInfo = info;
        }
        break;

      default:
        break;
    }
    if (videoInfo && thumbInfo) {
      break;
    }
  }
  if (videoInfo) {
    logger.log("debug", "Found video", videoInfo);
    if (thumbInfo) {
      logger.log("debug", "Found thumbnail", thumbInfo);
    } else {
      thumbInfo = {
        path: null,
      };
    }
    const oauth2Client = await getClient(
      account.user._id,
      account.token,
      account.refresh_token
    );
    const uploadResponse = await upload(
      oauth2Client,
      videoInfo,
      thumbInfo,
      post.datetime,
      post.title,
      post.text,
      notifySubscribers
    );
    if (uploadResponse.error) {
      logger.log("error", `Failed to upload video ${videoInfo.name}`);
      setStatus(post, account, "error:api");
    } else {
      // change this !!!
      logger.log("info", `Successfully uploaded ${videoInfo.name}`);
      setStatus(post, account, "posted", uploadResponse.data.id); // guessed the post id key, possible error !!!
    }
  } else {
    logger.log(
      "error",
      `No video file found in attachments for post ${post._id}`
    );
    return;
  }
  // need to add code in post creation to check what attachments are included and error if unsupported
  // i.e for YouTube there should only be 1 video attachment
  // also add checks and prompts to UI (post creation assistant)
}
