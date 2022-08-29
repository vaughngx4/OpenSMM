import { rtk } from "./tasks.js";

async function get(type, endpoint) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  const tk = await rtk();
  let result = await fetch(endpoint, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + tk,
    },
    signal: controller.signal,
  });
  console.log(result);
  if (!result) {
    popMsg("red", "#fff", `Failed to fetch ${type} data`);
    console.log(err);
    return false;
  } else {
    return JSON.parse(result);
  }
}
export async function fetchTwitter() {
  return await get("Twitter", "/api/twitter");
}
