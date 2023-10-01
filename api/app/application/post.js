// import { post as twitterPost } from "./twitter.js";
import { schedule, unschedule } from "./schedule.js";
import auth from "./authentication.js";
const { authenticateToken } = auth;
import { validatePost } from "./validate.js";
import Logger from "./logger.js";
import db from "./database.js";
const { Post } = db;
const logger = new Logger("post");

const tzo = process.env.TIMEZONE_OFFSET || "+0";

export async function route(exp) {
  exp.post("/posts", authenticateToken, async function (req, res) {
    const json = await req.body;
    const validation = validatePost(json);
    let attachmentPath = null;
    if (json.attachment) {
      attachmentPath = `/data/fileuploads/${req.user.name}/${json.attachment}`;
    }
    if (!validation.error) {
      const dateTime = new Date(
        `${new Date(json.datetime).toUTCString()}${tzo}`
      );
      const postJson = {
        accounts: json.accounts,
        text: json.text,
        attachment: attachmentPath,
        datetime: dateTime,
        pollDuration: json.pollDuration || null,
        pollOptions: json.pollOptions || null,
        data: {
          twitter: {
            status: "pending",
          },
        },
      };
      const post = new Post(postJson);
      post
        .save()
        .then((data) => {
          schedule(data._id.toString(), dateTime, async () => {
            doPost(data._id);
          }).then(() => {
            logger.log("info", "A post was scheduled");
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
        .status(401)
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
  exp.put("/posts", authenticateToken, async function (req, res) {});
}

export async function doPost(postId) {
  Post.findById(postId)
    .populate({
      path: "accounts",
      populate: {
        path: "twitter",
      },
    })
    .then((data) => {
      data.accounts.twitter.forEach((account) => {
        twitterPost(
          postId,
          account,
          data.text,
          data.attachment || null,
          data.pollDuration || null,
          data.pollOptions || null
        );
      });
      // call post for other socials here like data.accounts.facebook.forEach((account){...});
    })
    .catch((err) => {
      logger.log("error", `Post failed: ${err}`);
    });
}
