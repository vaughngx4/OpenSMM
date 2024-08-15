import { prompt } from "./prompt.js";

export function getUrlParams() {
  let vars = {};
  window.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function (m, key, value) {
      vars[key] = value;
    }
  );
  if (Object.keys(vars).length === 0) {
    return false;
  } else {
    return vars;
  }
}

// load params as prompt
export async function loadParamsMessage(callback) {
  callback = callback || null;
  const params = getUrlParams();
  if (params["status"]) {
    let elem = document.createElement("div");
    elem.style.display = "flex";
    elem.style.flexDirection = "column";
    elem.style.alignItems = "center";
    let image = document.createElement("img");
    image.style.height = "80px";
    image.style.width = "80px";
    image.style.padding = "10px";
    let text = "Error!";
    image.src = "/assets/img/error.png";
    if ("success" == params["status"]) {
      text = "Success!";
      image.src = "/assets/img/success.png";
    }
    elem.appendChild(image);
    let message = document.createElement("p");
    message.style.color = "#fff";
    message.style.padding = "10px";
    message.innerText = decodeURIComponent(params["message"]);
    elem.appendChild(message);
    prompt(text, "notify", elem, callback);
  }
  return params;
}