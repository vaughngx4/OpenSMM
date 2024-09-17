import { scheduleDateTime, unschedule } from "./schedule.js";
import { authenticateToken } from "./authentication.js";
import { validatePost } from "./validate.js";
import Logger from "./logger.js";
import { Account, Post } from "./database.js";
import * as facebook from "./socials/facebook.js";
import * as youtube from "./socials/youtube.js";
const logger = new Logger("post");

const tzo = process.env.TIMEZONE_OFFSET || "+0";

export async function route(exp) {
  exp.post("/posts", authenticateToken, async function (req, res) {
    let json = await req.body;
    const validation = validatePost(json);
    json = validation.value;
    let attachmentPaths = [];
    if (!validation.error) {
      if (json.attachment) {
        for (const attachment of json.attachment) {
          attachmentPaths.push(
            `/data/fileuploads/${req.user._id}/${attachment}`
          );
        }
      }
      const datetime = new Date(
        `${new Date(json.datetime).toUTCString()}${tzo}`
      );
      let scheduledDate = datetime;
      let data = [];
      for (const account of json.accounts) {
        const realAccount = await Account.findById(account).catch((error) => {
          logger.log("error", `Failed to look up account ${account}`, error);
          res
            .status(500)
            .json({ status: "error", message: "Failed to look up an account" });
        });
        if (realAccount.platform == "instagram") {
          const rateLimitResponse = await checkRateLimit(realAccount, datetime);
          if (rateLimitResponse.error) {
            res
              .status(500)
              .json({ status: "error", message: rateLimitResponse.error });
            return;
          }
          if (rateLimitResponse.remaining_posts == 0) {
            logger.log(
              "error",
              `Could not create post, Instagram user ${realAccount.name} has reached their rate limit for this 24 hour period`
            );
            res.status(500).json({
              status: "error",
              message: `Could not create post, Instagram user ${realAccount.name} has reached their rate limit for this 24 hour period`,
            });
            return;
          }
        } else if (
          realAccount.platform == "google" &&
          realAccount.type == "youtube"
        ) {
          scheduledDate = getScheduledDate(datetime, 180); // max 3 hours in advance
        }
        logger.log("debug", "Account referenced, adding to post data");
        data.push({
          account,
          status: "pending",
        });
      }
      let post = new Post({
        text: json.text,
        datetime: datetime,
        data: data,
      });
      if (attachmentPaths.length > 0) {
        post["attachment"] = attachmentPaths;
      }
      logger.log(
        "sensitive",
        "A post is being scheduled and will now be saved to the database",
        post
      );
      post
        .save()
        .then(async (data) => {
          await scheduleDateTime(
            data._id.toString(),
            scheduledDate,
            async () => {
              doPost(data._id);
            }
          ).then(() => {
            logger.log("info", "A post was scheduled successfully");
            res.status(200).json({
              status: "success",
              message: "Post scheduled successfully",
            });
          });
        })
        .catch((err) => {
          logger.log("error", `Could not schedule post: ${err}`);
          res.status(500).json({
            status: "error",
            message: "Could not schedule post",
          });
        });
    } else {
      logger.log("error", `Bad request: ${validation.error.message}`);
      res
        .status(400)
        .json({ status: "error", message: validation.error.message });
    }
  });
  exp.delete("/posts", authenticateToken, async function (req, res) {
    Post.findByIdAndDelete(req.body._id)
      .then(async () => {
        const c = await unschedule(req.body._id);
        if (c > 0) {
          logger.log("info", "Post has been removed from schedule");
        } else {
          logger.log("error", "Post could not be removed from schedule");
        }
        logger.log("info", "Post has been deleted");
        res
          .status(200)
          .json({ status: "success", message: "Post has been deleted" });
      })
      .catch((err) => {
        logger.log("error", `Post could not be deleted: ${err}`);
        res
          .status(500)
          .json({ status: "error", message: "Post could not be deleted" });
      });
  });
  exp.get("/posts", authenticateToken, async function (req, res) {
    Post.find()
      .then((data) => {
        logger.log("debug", "Got posts from database");
        res.status(200).json({ status: "success ", data });
      })
      .catch((err) => {
        logger.log("error", `Error getting posts from database: ${err}`);
        res.status(500).json({
          status: "error",
          message: "Error getting posts from database",
        });
      });
  });
}

export async function doPost(postId) {
  Post.findById(postId)
    .populate({
      path: "data",
      populate: {
        path: "account",
        model: "Account",
        populate: {
          path: "parent",
          model: "Account",
        },
        populate: {
          path: "user",
          model: "User",
        },
      },
    })
    .then(async (data) => {
      logger.log("debug", "Post found, starting post process...");
      for (const postData of data.data) {
        switch (postData.account.platform) {
          case "google":
            if (postData.account.type == "youtube") {
              logger.log("debug", "Post is for platform Google and of type YouTube: calling post function");
              await youtube.post(data, postData.account);
            }
            break;
          case "facebook":
            logger.log("debug", "Post is for platform Facebook and of type Page: calling post function");
            await facebook.post(data, postData.account);
            break;
        }
      }
    })
    .catch((error) => {
      logger.log("error", "post failed", error);
    });
}

export async function setStatus(post, account, status, postId) {
  postId = postId || false;
  Post.findById(post._id)
    .populate({
      path: "data",
      populate: {
        path: "account",
        model: "Account",
      },
    })
    .then((data) => {
      const index = data.data
        .map((e) => {
          return e.account._id.toString();
        })
        .indexOf(account._id.toString());
      data.data[index].status = status;
      if (postId) {
        data.data[index].postId = postId;
      }
      logger.log(
        "sensitive",
        "== Post ID and/or status has been changed ==",
        data
      );
      data.save();
    })
    .catch((error) => {
      logger.log("error", `Error setting post status/ID`, error);
    });
}

// get time to make API call using post `datetime`
// `datetime` is the time we want the post to go live
// `scheduledTime` is the time we make the API call
function getScheduledDate(datetime, maxPrePostMins) {
  maxPrePostMins = maxPrePostMins || 60;
  // max time in advance to make the API call (milliseconds)
  let maxPrePostMs = maxPrePostMins * 1000 * 60;
  // time we are trying to post at (milliseconds)
  let scheduledTime = datetime - maxPrePostMs;
  // time now (milliseconds)
  const now = Date.now();
  // difference between `scheduledTime` and `now` (milliseconds)
  const diff = scheduledTime - now;
  // if we are trying to post in 10 seconds or less
  if (diff <= 1000 * 10) {
    // change it to 30 seconds in the future
    scheduledTime = now + 1000 * 30;
  }
  return new Date(scheduledTime);
}
