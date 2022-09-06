import { rtk } from "./tasks.js";
import { popMsg } from './popup-message.js';

async function httpGet(type, endpoint) {
  let response;
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  const tk = await rtk();
  await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + tk,
    },
    signal: controller.signal,
  })
    .then((response) => response.json())
    .then((data) => {
      response = data;
    })
    .catch((err) => {
      popMsg("red", "#fff", `Failed to fetch ${type}`);
      console.log(err);
      response = false;
    });
  return response;
}
async function httpPost(type, endpoint, body) {
  let response;
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  const tk = await rtk();
  await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + tk,
    },
    signal: controller.signal,
  })
    .then((response) => response.json())
    .then((data) => {
      response = data;
    })
    .catch((err) => {
      popMsg("red", "#fff", `Failed to send ${type}`);
      console.log(err);
      response = false;
    });
  return response;
}
async function httpDelete(type, endpoint, body) {
  let response;
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  const tk = await rtk();
  await fetch(endpoint, {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + tk,
    },
    signal: controller.signal,
  })
    .then((response) => response.json())
    .then((data) => {
      response = data;
    })
    .catch((err) => {
      popMsg("red", "#fff", `Failed to delete ${type}`);
      console.log(err);
      response = false;
    });
  return response;
}
export async function getTwitterAccounts() {
  return await httpGet("Twitter accounts", "/twitter/accounts");
}
export async function postScheduledPost(data) {
  return await httpPost("post data", "/posts", data);
}
export async function getPosts(){
  return await httpGet("posts", "/posts");
}
export async function deletePost(id){
  return await httpDelete("post", "/posts", { _id: id});
}
