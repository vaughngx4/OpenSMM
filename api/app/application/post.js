const { post: twitterPost } = require("./twitter");
const Logger = require("./logger");
const { Post } = require("./database");
const logger = new Logger("post");

async function route(exp) {
  exp.post("/newpost", async function (req, res) {
    const json = req.body;
    const post = new Post({
      accounts: json.accounts,
      text: json.text,
      attachment: json.attachment,
      datetime: json.datetime,
      pollDuration: json.pollDuration,
      pollOptions: json.pollOptions,
      data: {
        twitter: {
          status: "pending"
        }
      }
    });
    post
      .save()
      .then(() => {
        // schedule to cron here
        logger.log("info", "A post was scheduled");
        res
          .status(200)
          .json({ status: "success", message: "Post scheduled successfully" });
      })
      .catch((err) => {
        logger.log("error", `Could not save scheduled post to database: ${err}`);
        res
          .status(500)
          .json({ status: "error", message: "Could not save scheduled post to database" });
      });
  });
  exp.delete("/delpost", async function(req, res){

  });
}

async function doPost(postId) {
  Post.findById(postId).populate({
    path: 'accounts'
  })
    .then((data) => {
      data.accounts.twitter.forEach((account) => {
        twitterPost(postId, account, data.text, data.attachment || null, data.pollDuration || null, data.pollOptions || null);
      });
      // call post for other socials here like data.accounts.facebook.forEach((account){...});
    })
}

module.exports = { route, doPost };
