import {
  existsSync,
  mkdirSync,
  createWriteStream,
  unlink,
  readdir,
  statSync,
} from "fs";
import * as readChunk from "read-chunk";
import * as fileType from "file-type";
import { authenticateToken } from "./authentication.js";
import Logger from "./logger.js";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { isNumeric } from "./validate.js";
import { basename } from "path";
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
  exp.put("/files/upload/:token", authenticateToken, async function (req, res) {
    await fileFromReq(req, res);
  });
  exp.get("/files/list", authenticateToken, async function (req, res) {
    if (existsSync(`/data/fileuploads/${req.user._id}/`)) {
      readdir(`/data/fileuploads/${req.user._id}/`, (err, files) => {
        if (err) {
          logger.log(
            "error",
            `Error listing files in /data/fileuploads/${req.user._id}/`
          );
          res.status(500).json({ status: "error", message: "Server error" });
        } else {
          files.splice(files.indexOf("thumbnails"), 1);
          res.status(200).json({ status: "success", data: files });
        }
      });
    } else {
      res.status(200).json({ status: "success", data: [] });
    }
  });
  exp.get(
    "/files/thumbnail/:token/:filename/:index",
    authenticateToken,
    async function (req, res) {
      if (isNumeric(req.params.index)) {
        const file = `/data/fileuploads/${req.user._id}/thumbnails/${req.params.filename}${req.params.index}.webp`;
        if (existsSync(file)) {
          res.sendFile(file);
        } else {
          res.status(500).json({ status: "error", message: "No such file" });
        }
      } else {
        res.status(400).json({
          status: "error",
          message: "Bad request: thumbnail index must be an integer",
        });
      }
    }
  );
  exp.get(
    "/files/download/:token/:filename",
    authenticateToken,
    async function (req, res) {
      const file = `/data/fileuploads/${req.user._id}/${req.params.filename}`;
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
  const dir = `/data/fileuploads/${req.user._id}/`;
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
      res
        .status(200)
        .json({ status: "success", data: `${filename} uploaded successfully` });
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
    await imageThumbs(dir, filename);
    return true;
  } else if (-1 != supportedVideoMimes.indexOf(type.mime)) {
    await videoThumbs(dir, filename);
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
    .resize({
      fit: sharp.fit.contain,
      width: 200,
    })
    .toFile(dir + "thumbnails/" + filename + "0.webp");
}

async function videoThumbs(dir, filename) {
  let filenames;
  await ffmpeg(dir + filename)
    .on("filenames", (_filenames) => {
      filenames = _filenames;
      logger.log(
        "debug",
        `Temporary video thumbnails: ${_filenames.join(", ")}`
      );
    })
    .on("end", async () => {
      logger.log("debug", "Video thumbnails step 1/2 (ffmpeg - screenshots) complete");
      await filenames.forEach(async (file, index) => {
        await sharp(dir + "thumbnails/" + file)
          .webp()
          .toFile(dir + "thumbnails/" + filename + index + ".webp");
      });
      logger.log("debug", "Video thumbnails step 2/2 (sharp - conversion) complete");
    })
    .on("error", (err) => {
      logger.log("error", `Error creating thumbmails: ${err.message}`);
    })
    .takeScreenshots({
      count: 1,
      size: "300x200",
      folder: dir + "thumbnails/",
    });
}

export async function fileInfo(filePath) {
  logger.log("debug", `Getting file info for file ${basename(filePath)}`);
  const buffer = readChunk.readChunkSync(filePath, { length: 4100 });
  const type = await fileType.fileTypeFromBuffer(buffer);
  const stats = statSync(filePath);
  let description = "";
  if (-1 != supportedVideoMimes.indexOf(type.mime)) {
    description = "video";
  } else if (-1 != supportedImageMimes.indexOf(type.mime)) {
    description = "image";
  }
  return {
    name: basename(filePath),
    length: stats.size,
    ext: type.ext,
    mime: type.mime,
    description,
    path: filePath,
  };
}
