// require API to operate as follows:
// "/endpoint" - GET - should return a json body with a data key containing an array of filenames
// "/endpoint/thumb/token/filename/0" - GET - should return thumbnail 0 for "filename"
// "/endpoint/filename" - GET - should return the original file "filename"

import { getFileNames } from "../api.js";
import { rtk } from "../tasks.js";

export async function gallery(endpoint) {
  const response = await getFileNames();
  const files = response.data;
  let container = document.createElement("div");
  container.className = "gallery";

  let workingRow = row(container);

  files.forEach(async (file) => {
    let thumb = document.createElement("img");
    thumb.className = "thumbnail";
    const tk = await rtk();
    thumb.src = `${endpoint}/thumb/${tk}/${file}/0`;
    workingRow = row(container, workingRow);
    workingRow.appendChild(thumb);
  });

  return container;
}

function row(container, currentRow) {
  currentRow = currentRow || null;
  if (!currentRow) {
    currentRow = document.createElement("div");
    currentRow.className = "row";
    container.appendChild(currentRow);
  }
  console.log(container.style.width);
  const limit = (container.style.width / 180).toFixed(0); // the number here is the total width of the thumbnail + padding (default image width is 150)
  console.log("Row Limit: " + limit); // debug !!!
  if (currentRow.children.length >= limit) {
    currentRow = document.createElement("div");
    currentRow.className = "row";
    container.appendChild(currentRow);
  }
  return currentRow;
}
