import { authenticateToken } from "./authentication.js";
import { Account, toId } from "./database.js";
import Logger from "./logger.js";
const logger = new Logger("accounts");

export async function route(exp) {
  exp.get("/accounts", authenticateToken, (req, res) => {
    Account.find({ user: req.user._id })
      .then((data) => {
        let accounts = [];
        if (data.length > 0) {
          for (const account of data) {
            accounts.push({
              _id: account._id,
              platform: account.platform,
              type: account.type,
              userEmail: account.userEmail,
            });
          }
        }
        logger.log(
          "info",
          `User [${req.user._id}] read their linked accounts`
        );
        res.status(200).json({ status: "success", data: accounts });
      })
      .catch((error) => {
        logger.log("error", `Failed to read accounts from database: ${error}`);
        res
          .status(500)
          .json({ status: "error", message: "Failed to read accounts" });
      });
  });
}