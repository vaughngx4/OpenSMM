import fetch from "node-fetch";
import { readFile } from "node:fs/promises";
import { Account, Post, toId } from "../database.js";
import { setStatus } from "../post.js";
import { authenticateToken } from "../authentication.js";
import Logger from "../logger.js";
import { fileInfo } from "../files.js";
import { basename } from "path";
const logger = new Logger("instagram");
import { stripNonsense } from "./common.js";
import { scheduleDateTime } from "../schedule.js";

const DOMAIN = process.env.DOMAIN || "localhost";
const DOMAIN_PORT = process.env.DOMAIN_PORT || "";
const APP_ID = process.env.INSTAGRAM_APP_ID || "1234567890";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "1234567890";

export async function route(exp) {
  exp.get("/instagram/auth", function (req, res) {
    // redirect user to authorize the app
    try {
      res.redirect(
        `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${APP_ID}&redirect_uri=https://${DOMAIN}:${DOMAIN_PORT}/callback/instragram&response_type=code&scope=business_basic%2Cbusiness_manage_messages%2Cbusiness_manage_comments%2Cbusiness_content_publish`
      );
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Login error, please try again later",
      });
    }
  });
  exp.get("/instagram/callback", authenticateToken, async (req, res) => {
    // show error message if authorization failed
    if (req.query.error) {
      logger.log("error", `login failed [${req.params.error_reason}]`);
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          `Login failed with error: ${stripNonsense(req.query.error_reason)}`
        )}`
      );
      return;
    }
    // use authorization code to get user access token
    if (!req.query.code) {
      logger.log(
        "error",
        "No access code was included in the response from Instagram"
      );
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          "Login failed: Instagram denied the request for an access code"
        )}`
      );
      return;
    }
    const accessTokenReponse = await getUserAccessToken(req.query.code);
    if (accessTokenReponse.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          stripNonsense(accessTokenReponse.error)
        )}`
      );
      return;
    }
    const shortLivedAccessToken = accessTokenReponse.data.data.access_token;
    const userId = accessTokenReponse.data.data.user_id;
    // if valid, use access token to get long lived user access token
    const longLivedUserAccessTokenResponse = await getLongLivedUserToken(
      shortLivedAccessToken
    );
    if (longLivedUserAccessTokenResponse.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          stripNonsense(longLivedUserAccessTokenResponse.error)
        )}`
      );
      return;
    }
    const longLivedUserAccessToken =
      longLivedUserAccessTokenResponse.data.access_token;
    const expiresIn = longLivedUserAccessTokenResponse.data.expires_in;
    // save account
    await Account.find({
      user: req.user._id,
      platform: "instagram",
      id: userId,
    })
      .then(async (data) => {
        if (data.length > 0) {
          // we found an existing login
          logger.log(
            "debug",
            `duplicate login for account ${data[0].name}, updating access token`
          );
          data[0].token = longLivedUserAccessToken;
          data[0].token_expires_in = expiresIn;
          await data[0].save().then((data) => {
            logger.log("info", `Login for account ${data.name} was updated`);
          });
        } else {
          // if we got this far then all was successful and there are no existing logins for this page
          // save this page to the database
          const userInfo = getUserInfo(userId, longLivedUserAccessToken);
          if (userInfo.error) {
            res.redirect(
              `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
                "Failed to get user information"
              )}`
            );
            return;
          }
          const newAccount = new Account({
            user: await toId(req.user._id),
            platform: "instagram",
            type: userInfo.data.account_type,
            name: userInfo.data.username,
            picture: userInfo.data.profile_picture_url,
            id: userId,
            token: longLivedUserAccessToken,
            token_expires_in: expiresIn,
          });
          await newAccount.save().then(async (data) => {
            const expirationDate = new Date() + expiresIn / 60;
            const refreshDate = new Date(Math.abs(expirationDate - 60 * 24)); // 24 hours before token expiration
            await scheduleDateTime(
              `instagram-refresh-${data.id}`,
              refreshDate,
              async () => {
                await refreshToken(data);
              }
            );
            logger.log(
              "info",
              `Successfully logged in to Instagram account ${data.name}`
            );
            res.redirect(
              `https://${DOMAIN}:${DOMAIN_PORT}?status=success&message=${encodeURIComponent(
                `Sucessfully logged in to Instagram account ${data.name}`
              )}`
            );
          });
        }
      })
      .catch((error) => {
        logger.log("error", `Login for user ${username} failed`, error);
        res.redirect(
          `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
            `Login for ${username} failed`
          )}`
        );
      });
  });
}

// exchange code for short-lived user access token
async function getUserAccessToken(code) {
  let result = {};
  await fetch(
    `https://api.instagram.com/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=https://${DOMAIN}:${DOMAIN_PORT}/callback/instagram`,
    {
      method: "POST",
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

// get long lived user token
async function getLongLivedUserToken(accessToken) {
  const result = {};
  await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${accessToken}`,
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
      logger.log("error", "Failed to get long lived user access token", error);
    });
  return result;
}

// refresh long lived user access token
async function refreshToken(account) {
  const result = {};
  await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.token}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log("sensitive", "== Refresh Token Response ==", json);
      result["data"] = json;
      if (json.access_token) {
        Account.find({
          user: account.user,
          platform: account.platform,
          type: account.type,
          id: account.id,
        }).then(async (data) => {
          if (data.length > 0) {
            data[0].token = json.access_token;
            data[0].token_expires_in = json.expires_in;
            await data[0].save().then(async (data) => {
              const expirationDate = new Date() + data.token_expires_in / 60;
              const refreshDate = new Date(Math.abs(expirationDate - 60 * 24)); // 24 hours before token expiration
              await scheduleDateTime(
                `instagram-refresh-${data.id}`,
                refreshDate,
                async () => {
                  await refreshToken(data);
                }
              );
              logger.log(
                "info",
                `Successful token refresh for account ${data.name}`
              );
            });
          }
        });
      } else {
        result["error"] = "Failed to refresh access token";
        logger.log("error", "Failed to refresh access token", error);
      }
    })
    .catch((error) => {
      result["error"] = "Failed to refresh access token";
      logger.log("error", "Failed to refresh access token", error);
    });
  return result;
}

// get user information
async function getUserInfo(id, token) {
  const result = {};
  await fetch(
    `https://graph.instagram.com/v20.0/me?fields=user_id,username,account_type,profile_picture_url&access_token=${token}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log("sensitive", "== Get User Information ==", json);
      result["data"] = json;
    })
    .catch((error) => {
      result["error"] = "Failed to get user info";
      logger.log("error", "Failed to get user info", error);
    });
  return result;
}

// checks how many posts the user has left for the next 24 hours (API limit is 50 a day)
async function checkRateLimit(account, datetime) {
  let result = {
    data: { remaning_posts: 50 },
  };
  await Post.find({ account: { _id: account._id } })
    .then((data) => {
      if (data.length > 0) {
        for (const post of data) {
          if (
            post.datetime - 60 * 12 < datetime &&
            datetime < post.datetime + 60 * 12
          ) {
            remainingPosts -= 1;
          }
        }
      }
    })
    .catch((error) => {
      result["error"] = "Failed to check rate limit";
      logger.log("error", "Failed to check rate limit", error);
    });
  return result;
}

// publish a post - used in automation - calls other functions
export async function post(post, account, scheduled) {
  scheduled = scheduled || false;
  let bodyContent = {
    message: post.text,
    published: true,
    access_token: account.token,
  };
  let attachmentHandles = [];
  if (post.link) {
    bodyContent["link"] = post.link;
  }
  // if there are attachments, upload them
  if (post.attachment) {
    for (const file of post.attachment) {
      const info = await fileInfo(file);
      if (info.description == "video") {
        // resumable video upload
        let token = account.token;
        // if (account.type == "page") {
        //   token = account.parent.token;
        // }
        const initUploadResponse = await initiateUpload(token, file);
        if (initUploadResponse.error) {
          await setStatus(post, account, "error:file upload error");
          return;
        }
        const uploadResponse = await upload(
          token,
          file,
          initUploadResponse.data.id
        );
        if (uploadResponse.error) {
          await setStatus(post, account, "error:file upload error");
          return;
        }
        const publishVideoResponse = await publishVideo(
          account.id,
          account.token,
          info.name,
          `opensmm-published-video: ${info.name}`,
          uploadResponse.data.h
        );
        if (publishVideoResponse.error) {
          await setStatus(post, account, "error:video publish error");
          return;
        }
        attachmentHandles.push(publishVideoResponse.data.id);
      } else if (info.description == "image") {
        // formData image upload
        const uploadPhotoResponse = await uploadPhoto(
          account.token,
          account.id,
          file
        );
        if (uploadPhotoResponse.error) {
          await setStatus(post, account, "error:photo upload error");
          return;
        }
        attachmentHandles.push(uploadPhotoResponse.data.id);
      }
    }
    if (attachmentHandles.length > 0) {
      bodyContent["attached_media"] = [];
      for (const handle of attachmentHandles) {
        bodyContent["attached_media"].push({ media_fbid: handle });
      }
    }
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

// initiate resumable upload
async function initiateUpload(token, filePath) {
  let result = {};
  const info = await fileInfo(filePath);
  await fetch(
    `https://graph.facebook.com/v20.0/${APP_ID}/uploads?file_name=${info.name}&file_length=${info.length}&type=${info.mime}&access_token=${token}`,
    {
      method: "POST",
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log("sensitive", "== Initiate Upload Response ==", json);
      if (json.id) {
        result["data"] = json;
      } else {
        result["error"] =
          "No ID was returned when we tried to initiate an upload";
        logger.log(
          "error",
          "No ID was returned when we tried to initiate an upload"
        );
      }
    })
    .catch((error) => {
      result["error"] = "Failed to initiate upload";
      logger.log("error", "Failed to initiate upload", error);
    });
  return result;
}

// start upload
async function upload(token, filePath, sessionId, fileOffset, retries) {
  let result = {};
  fileOffset = fileOffset || 0;
  const maxRetries = 5; // number of times to retry/resume a failed upload
  retries = retries || maxRetries;
  const rawData = await readFile(filePath);
  const blob = new Blob(rawData);
  await fetch(`https://graph.facebook.com/v20.0/${sessionId}`, {
    method: "POST",
    headers: {
      Authorization: "OAuth " + token,
      file_offset: fileOffset,
    },
    body: blob,
  })
    .then((response) => {
      return response.json();
    })
    .then(async (json) => {
      logger.log("sensitive", "== Upload Response ==", json);
      if (json.h) {
        result["data"] = json;
      } else {
        const uploadInfoResponse = await getUploadInfo(sessionId, token);
        if (uploadInfoResponse.error) {
          result["error"] = error;
          return;
        }
        if (uploadInfoResponse.data.id && uploadInfoResponse.data.file_offset) {
          if (retries != 0) {
            logger.log(
              "error",
              `upload ${uploadInfoResponse.data.id} failed at ${uploadInfoResponse.data.file_offset}, trying to resume in 5 seconds (${retries}/${maxRetries})`
            );
            setTimeout(async () => {
              await upload(
                token,
                filePath,
                json.id,
                json.file_offset,
                retries - 1
              );
            }, 5000);
            return;
          }
          result[("error", "No more retries/resumes, upload failed")];
          logger.log("error", "No more retries/resumes, upload failed");
        } else {
          result[
            "error"
          ] = `No ID, handle or file offset was returned when we tried to start upload ${sessionId}`;
          logger.log(
            "error",
            `No ID, handle or file offset was returned when we tried to start upload ${sessionId}`
          );
        }
      }
    })
    .catch((error) => {
      result["error"] = "Failed to start upload";
      logger.log("error", "Failed to start upload", error);
    });
  return result;
}

// get data to resume failed upload
async function getUploadInfo(sessionId, token) {
  let result = {};
  await fetch(`https://graph.facebook.com/v20.0/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: "OAuth " + token,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log("sensitive", "== Failed Upload Info Response ==", json);
      if (json.id) {
        result["data"] = json;
      } else {
        result["error"] =
          "No ID or file offset was returned when we tried to get upload info";
        logger.log(
          "error",
          "No ID or file offset was returned when we tried to get upload info"
        );
      }
    })
    .catch((error) => {
      result["error"] = "Failed to get upload info";
      logger.log("error", "Failed to get upload info", error);
    });
  return result;
}

// publish an already uploaded video
async function publishVideo(id, token, title, description, videoHandle) {
  let result = {};
  const body = new FormData();
  body.set("access_token", token);
  body.set("title", title);
  body.set("description", description);
  body.set("fbuploader_video_file_chunk", videoHandle);
  await fetch(`https://graph.facebook.com/v20.0/${id}/videos`, {
    method: "POST",
    body,
  })
    .then((response) => {
      return response.json();
    })
    .then(async (json) => {
      logger.log("sensitive", "== Publish Video Response ==", json);
      if (json.id) {
        result["data"] = json;
        logger.log("info", "Video was published successfully");
      } else {
        result["error"] = "No video ID was included in the response";
        logger.log("error", "No video ID was included in the response");
      }
    })
    .catch((error) => {
      result["error"] = "Failed to publish video";
      logger.log("error", "Failed to publish video", error);
    });
  return result;
}

// upload a photo
async function uploadPhoto(token, id, filePath) {
  const result = {};
  const rawData = await readFile(filePath);
  const blob = new Blob([rawData]);
  const body = new FormData();
  body.set("source", blob, basename(filePath));
  await fetch(
    `https://graph.facebook.com/v20.0/${id}/photos?published=false&access_token=${token}`,
    {
      method: "POST",
      body,
    }
  )
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      logger.log("sensitive", "== Photo Upload Response ==", json);
      result["data"] = json;
    })
    .catch((error) => {
      result["error"] = "Failed to upload photo";
      logger.log("error", "Failed to upload photo", error);
    });
  return result;
}
