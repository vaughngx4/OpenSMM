// require API to operate as follows:
// "/endpoint/list" - GET - should return a json body with a data key containing an array of filenames
// "/endpoint?type=thumbnail&index=0&filename=foo.jpg" - GET - should return thumbnail 0 for "foo.jpg"
// "/endpoint?type=download&filename=foo.jpg" - GET - should return the original file "foo.jpg"

import { getFileNames } from "../../api.js";
import { prompt } from "../prompt.js";

export class Gallery {
  constructor(endpoint, callback) {
    this.endpoint = endpoint;
    this.callback = callback || null;
    this.loadMsnry = null;
  }

  async create() {
    const response = await getFileNames();
    const files = response.data;
    let container = document.createElement("div");
    container.className = "gallery grid";

    let gridSizer = document.createElement("div");
    gridSizer.className = "grid-sizer";
    container.appendChild(gridSizer);

    files.forEach(async (file) => {
      let thumb = document.createElement("img");
      thumb.className = "thumbnail";
      thumb.src = `${this.endpoint}?type=thumbnail&index=0&filename=${file}`;
      let thumbContainer = document.createElement("div");
      thumbContainer.className = "grid-item";
      thumbContainer.appendChild(thumb);
      container.appendChild(thumbContainer);

      const callback = this.callback;
      const checkDetail = this.checkDetail;
      const endpoint = this.endpoint;
      if (!callback) {
        thumb.onclick = function () {
          checkDetail(endpoint, file);
        };
      } else {
        thumb.onclick = function () {
          callback(file);
        };
      }
    });
    const stop = this.stop;
    let loadMsnry = this.loadMsnry;
    this.loadMsnry = setInterval(() => {
      var grid = document.querySelector(".grid");
      var msnry = new Masonry(grid, {
        itemSelector: ".grid-item",
        columnWidth: ".grid-sizer",
        horizontalOrder: true,
        gutter: 10,
      });

      imagesLoaded(grid).on("progress", function () {
        msnry.layout();
        stop(loadMsnry);
      });
    }, 200);

    return container;
  }

  async stop(loadMsnry) {
    clearInterval(loadMsnry);
  }

  async checkDetail(endpoint, fileName) {
    let element = document.createElement("img");
    element.src = `${endpoint}?type=download&filename=${fileName}`;
    prompt(fileName, "warn", element);
  }
}
