import { existsSync, mkdirSync, createWriteStream, unlink, readdir } from "fs";
import * as readChunk from "read-chunk";
import * as fileType from "file-type";
import { authenticateToken } from "./authentication.js";
import Logger from "./logger.js";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
const logger = new Logger("filesystem");
const supportedImageMimes = [
  "image/png",
  "image/jpeg",
  "image/avif",
  "image/gif",
  "image/webp",
];
const supportedVideoMimes = [
  "video/webm",
  "video/ogg",
  "video/avi",
  "video/quicktime",
  "video/mpeg",
  "video/mp4",
  "video/3gpp",
  "video/3gpp2",
  "video/h261",
  "video/h263",
  "video/h264",
  "video/x-flv",
  "video/x-matroska",
  "video/x-ms-wmv",
];

export async function route(exp) {
  exp.put("/files", authenticateToken, async function (req, res) {
    await fileFromReq(req, res);
  });
  exp.get("/files", authenticateToken, async function (req, res) {
    if (existsSync(`/data/fileuploads/${req.user.name}/`)) {
      readdir(`/data/fileuploads/${req.user.name}/`, (err, files) => {
        if (err) {
          logger.log(
            "error",
            `Error listing files in /data/fileuploads/${req.user.name}/`
          );
          res.status(500).json({ status: "error", message: "Server error" });
        } else {
          files.splice(files.indexOf("thumbnails"));
          res.status(200).json({ status: "success", data: files });
        }
      });
    } else {
      res.status(200).json({ status: "success", data: [] });
    }
  });
  exp.get(
    "/files/thumb/:token/:filename/:index",
    authenticateToken,
    async function (req, res) {
      const file = `/data/fileuploads/${req.user.name}/thumbnails/${req.params.filename}${req.params.index}.webp`;
      if (existsSync(file)) {
        res.sendFile(file);
      } else {
        res.status(500).json({ status: "error", message: "No such file" });
      }
    }
  );
  exp.get(
    "/files/file/:filename",
    authenticateToken,
    async function (req, res) {
      const file = `/data/fileuploads/${req.user.name}/${req.params.filename}`;
      if (existsSync(file)) {
        res.sendFile(file);
      } else {
        res.status(500).json({ status: "error", message: "No such file" });
      }
    }
  );
}

// only works for authenticated routes due to the username being part of the path
async function fileFromReq(req, res) {
  const dir = `/data/fileuploads/${req.user.name}/`;
  let filename = "unknown.tmp";
  // create folders if they don't already exist
  if (!existsSync(dir + "thumbnails/")) {
    mkdirSync(dir + "thumbnails/", { recursive: true });
  }

  // get filename from headers
  const disposition = req.headers["content-disposition"];
  if (disposition && disposition.indexOf("attachment") !== -1) {
    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    var matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  }

  // start stream
  const stream = createWriteStream(dir + filename);
  stream.on("open", () => {
    logger.log("debug", `Receiving file ${filename} ...  0.00%`);
    req.pipe(stream);
  });

  // log on blob download
  stream.on("drain", () => {
    const pWritten = (
      (parseInt(stream.bytesWritten) /
        parseInt(req.headers["content-length"])) *
      100
    ).toFixed(2);
    logger.log("debug", `Receiving file ${filename} ...  ${pWritten}%`);
  });

  stream.on("close", async () => {
    logger.log("debug", `Receiving file ${filename} ...  100%`);
    // check if file type is supported and if yes, process file
    const supported = await processFile(dir, filename);
    if (supported) {
      res.status(200).json({ status: "success", data: dir + filename });
    } else {
      res
        .status(405)
        .json({ status: "error", message: "Unsupported file type" }); // needs file type checks on frontend to avoid uploading large files for no reason
    }
  });

  stream.on("error", (err) => {
    logger.log("error", `Upload error: ${err}`);
    res.status(500).json({ status: "error", message: "Upload error" });
  });
}

async function processFile(dir, filename) {
  logger.log("debug", `Processing file ${filename}`);
  const buffer = readChunk.readChunkSync(dir + filename, { length: 4100 });
  const type = await fileType.fileTypeFromBuffer(buffer);
  logger.log("debug", `File is of type ${type.mime}`);
  if (-1 != supportedImageMimes.indexOf(type.mime)) {
    imageThumbs(dir, filename);
    return true;
  } else if (-1 != supportedVideoMimes.indexOf(type.mime)) {
    videoThumbs(dir, filename);
    return true;
  } else {
    logger.log("warn", `Unsupported file type: ${type.mime}`);
    logger.log("warn", "Removing unsupported file");
    unlink(dir + filename, (err) => {
      if (err) {
        logger.log("error", "Error removing file");
      } else {
        logger.log("info", `Successfully removed file ${filename}`);
      }
    });
    return false;
  }
}

async function imageThumbs(dir, filename) {
  sharp(dir + filename)
    .webp()
    .resize(150, 100)
    .toFile(dir + "thumbnails/" + filename + "0.webp");
}

async function videoThumbs(dir, filename) {
  let filenames;
  ffmpeg(dir + filename)
    .on("filenames", (_filenames) => {
      filenames = _filenames;
      logger.log(
        "debug",
        `Temporary video thumbnails: ${_filenames.join(", ")}`
      );
    })
    .on("end", async () => {
      logger.log("debug", "Video thumbnails step 1/2 (ffmpeg) complete");
      await filenames.forEach(async (file, index) => {
        await sharp(dir + "thumbnails/" + file)
          .webp()
          .toFile(dir + "thumbnails/" + filename + index + ".webp");
      });
      logger.log("debug", "Video thumbnails step 2/2 (sharp) complete");
    })
    .on("error", (err) => {
      logger.log("error", `Error creating thumbmails: ${err.message}`);
    })
    .takeScreenshots(
      { count: 2, timemarks: ["00:00:02.000", "6"], size: "150x100" },
      dir + "thumbnails/"
    );
}
