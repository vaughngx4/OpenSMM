import fetch from "node-fetch";
import { readFile } from "node:fs/promises";
import { Account, toId } from "../database.js";
import { setStatus } from "../post.js";
import { authenticateToken } from "../authentication.js";
import Logger from "../logger.js";
import { fileInfo } from "../files.js";
import { basename } from "path";
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
    if (accessTokenVerification.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          accessTokenVerification.error
        )}`
      );
      return;
    }
    const userId = accessTokenVerification.data.data.user_id;
    // if valid, use access token to get long lived user access token
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
    const longLivedUserAccessToken =
      longLivedUserAccessTokenResponse.data.access_token;
    // login as user (pages need a parent account)
    const userLoginResponse = await userLogin(
      req.user._id,
      userId,
      longLivedUserAccessToken
    );
    if (userLoginResponse.error) {
      res.redirect(
        `https://${DOMAIN}:${DOMAIN_PORT}?status=error&message=${encodeURIComponent(
          userLoginResponse.error
        )}`
      );
      return;
    }
    // use long lived user access token to get long lived page access token
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
            await data[0].save().then((data) => {
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
              parent: userLoginResponse.data._id,
            });
            await newAccount.save().then((data) => {
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

// verify a token
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

// exchange code for short-lived user access token
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

// get long lived user token
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

// get list of pages and tokens
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

// get user information
async function getUserInfo(id, token) {
  const result = {};
  await fetch(
    `https://graph.facebook.com/v20.0/${id}/?fields=id,name,picture&access_token=${token}`,
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

// save user login
async function userLogin(userId, fbUserId, longLivedUserAccessToken) {
  let result = {};
  // use long lived user access token to get user info
  const userInfoResponse = await getUserInfo(
    fbUserId,
    longLivedUserAccessToken
  );
  if (userInfoResponse.error) {
    result["error"] = userInfoResponse.error; // this is slightly redundant, but easier to understand
    return result;
  }
  // save user account
  await Account.find({ platform: "facebook", type: "user", id: fbUserId })
    .then(async (data) => {
      if (data.length > 0) {
        // we found an existing login
        logger.log(
          "debug",
          `duplicate login for user ${userInfoResponse.data.name}, updating access token`
        );
        data[0].token = longLivedUserAccessToken;
        data[0].picture = userInfoResponse.data.picture.data.url;
        await data[0].save().then((data) => {
          logger.log("info", `Login for user ${data.name} was updated`);
          result["data"] = data;
        });
      } else {
        // if we got this far then all was successful and there are no existing logins for this user
        // save this user to the database
        const newUserAccount = new Account({
          user: await toId(userId),
          platform: "facebook",
          type: "user",
          name: userInfoResponse.data.name,
          picture: userInfoResponse.data.picture.data.url,
          id: fbUserId,
          token: longLivedUserAccessToken,
        });
        await newUserAccount.save().then((data) => {
          result["data"] = data;
          logger.log("info", `Successfully logged in as user ${data.name}`);
        });
      }
    })
    .catch((error) => {
      logger.log(
        "error",
        `Login for user ${userInfoResponse.data.name} failed`,
        error
      );
      result["error"] = `Login for user ${userInfoResponse.data.name} failed`;
    });
  return result;
}

// currently unused. May be used in the future for posting unpublished posts
// check if a post can be posted as unpublished and scheduled (more than 10
// minutes and less than 30 days from now, as required by Facebook)
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

// publish a (page) post - used in automation - calls other functions
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

async function retryUpload() {

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
