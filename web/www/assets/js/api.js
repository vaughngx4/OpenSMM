import { rtk } from "./tasks.js";

async function get(type, endpoint) {
  let response;
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  const tk = await rtk();
  await fetch(endpoint, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + tk,
    },
    signal: controller.signal,
  })
    .then(response => response.json())
      .then((data) => { response = data })
        .catch((err) => {
          popMsg("red", "#fff", `Failed to fetch ${type}`);
          console.log(err);
          response = false;
        })
  return response;
}
export async function getTwitterAccounts() {
  return await get("Twitter accounts", "/twitter/api/accounts");
}
