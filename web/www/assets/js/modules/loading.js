import { prompt } from "./prompt.js";

export async function loading() {
  var loadingImage = document.createElement("div");
  loadingImage.style.padding = "10px";
  var image = document.createElement("img");
  image.src = "/assets/img/loading.gif";
  image.style.height = "210px";
  image.style.width = "300px";
  image.style.objectFit = "fill";
  loadingImage.appendChild(image);
  prompt("Loading...", "floating", loadingImage);
}
