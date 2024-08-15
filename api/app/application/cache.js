import { createClient } from "redis";
import Logger from "./logger.js";
const logger = new Logger("cache");

async function initCache(rc) {
  await rc
    .connect()
    .then(() => {
      logger.log("info", "Redis connection established");
    })
    .catch((err) => {
      logger.log("error", `Could not connect to cache: ${err}`);
    });
}

export async function cache(key, value) {
  let status = false;
  await rc
    .set(`${key}`, `${value}`)
    .then(() => {
      logger.log("debug", `${key} successfully saved to cache`);
      status = true;
    })
    .catch((err) => {
      logger.log("error", `${key} could not be saved to cache: ${err}`);
      status = false;
    });
  return status;
}

export async function uncache(key) {
  let status = false;
  await rc
    .del(`${key}`)
    .then(() => {
      logger.log("debug", `${key} successfully removed from cache`);
      status = true;
    })
    .catch((err) => {
      logger.log("error", `${key} could not be removed from cache: ${err}`);
      status = false;
    });
  return status;
}

export async function getCache(key) {
  let status = false;
  await rc
    .get(`${key}`)
    .then((data) => {
      logger.log("debug", `${key} successfully retrieved from cache`);
      status = data;
    })
    .catch(() => {
      logger.log("error", `${key} could not be retrieved from cache: ${err}`);
      status = false;
    });
  return status;
}

const rc = createClient({
  url: `redis://opensmm-redis:6379`,
  password: process.env.REDIS_PASSWORD,
});

initCache(rc);

rc.on("error", (err) => {
  logger.log("error", `${err}`);
});
