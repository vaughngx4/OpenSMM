import { rtk } from "./tasks.js";
import { popMsg } from "./modules/popup-message.js";

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
async function xhrFileUpload(file, endpoint) {
  // const uploadProgress = document.getElementById("upload-progress");
  // const downloadProgress = document.getElementById("download-progress");

  const tk = await rtk();
  const xhr = new XMLHttpRequest();
  const response = await new Promise((resolve) => {
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        console.log("upload progress:", event.loaded / event.total);
        // uploadProgress.value = event.loaded / event.total;
      }
    });
    // xhr.addEventListener("progress", (event) => {
    //   if (event.lengthComputable) {
    //     console.log("download progress:", event.loaded / event.total);
    //     downloadProgress.value = event.loaded / event.total;
    //   }
    // });
    xhr.addEventListener("loadend", () => {
      if (4 === xhr.readyState && 200 === xhr.status) {
        resolve(xhr.response);
      } else if (4 === xhr.readyState && 500 === xhr.status) {
        popMsg("red", "#fff", "Upload error");
        console.error(JSON.parse(xhr.response).message);
        resolve(false);
      } else {
        popMsg("red", "#fff", "Upload error");
        console.error(xhr.response);
        resolve(false);
      }
    });
    xhr.open("PUT", endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader(
      "Content-Disposition",
      `attachment; filename="${file.name}"`
    );
    xhr.setRequestHeader("Authorization", `Bearer ${tk}`);
    xhr.send(file);
  });
  const result = await response;
  if (!result) {
    return false;
  } else {
    return JSON.parse(result);
  }
}

export async function getTwitterAccounts() {
  return await httpGet("Twitter accounts", "/twitter/accounts");
}
export async function postScheduledPost(data) {
  return await httpPost("post data", "/posts", data);
}
export async function getPosts() {
  return await httpGet("posts", "/posts");
}
export async function deletePost(id) {
  return await httpDelete("post", "/posts", { _id: id });
}
export async function fileUpload(file) {
  return await xhrFileUpload(file, "/files");
}
export async function getFileNames() {
  return await httpGet("filenames", "/files");
}
