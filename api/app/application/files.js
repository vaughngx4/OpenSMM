const fs = require("fs");
const busboy = require("busboy");
const { authenticateToken } = require("./authentication");
const Logger = require("./logger");
const logger = new Logger("filesystem");

async function route(exp) {
  exp.post("/files/upload", authenticateToken, async function (req, res) {
    await fileFromReq(req, res);
  });
}

// only works for authenticated routes
async function fileFromReq(req, res) {
  const dir = `/data/fileuploads/${req.user.name}/`;
  // create folders if they don't already exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // convert header keys to lowercase for busboy
  const headers = Object.keys(req.headers).reduce((newHeaders, key) => {
    newHeaders[key.toLowerCase()] = req.headers[key];
    return newHeaders;
  }, {});
  // create file from request stream
  console.log(headers); // debug !!!
  const bb = busboy({ headers });
  bb.on("file", (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    logger.log("debug", `Receiving file: Encoding: ${encoding}`);
    let fstream = fs.createWriteStream(dir + filename);
    file.pipe(fstream);
    fstream.on("error", () => {
      logger.log("error", `Error during file upload: ${err}`);
      fs.unlink(dir + filename, (err) => {
        if (err) {
          logger.log("error", `Error removing incomplete file: ${err}`);
        } else {
          logger.log("debug", `Removed incomplete file ${filename}`);
        }
      });
      res.status(500).json({ status: "error", message: "Upload failed" });
    });
    fstream.on("close", () => {
      logger.log("debug", "File uploaded successfully");
      res.status(200).json({
        status: "success",
        data: `${dir}${filename}`,
      });
    });
  });
  req.pipe(bb);
}

module.exports = { route };
