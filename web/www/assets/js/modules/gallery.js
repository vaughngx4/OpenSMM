// require API to operate as follows:
// "/endpoint" - GET - should return a json body with a data key containing an array of filenames
// "/endpoint/thumb/token/filename/0" - GET - should return thumbnail 0 for "filename"
// "/endpoint/filename" - GET - should return the original file "filename"

import { getFileNames } from "../api.js";
import { rtk } from "../tasks.js";
import { prompt } from "../modules/prompt.js";

export async function gallery(endpoint) {
  const response = await getFileNames();
  const files = response.data;
  let container = document.createElement("div");
  container.className = "gallery grid";

  let gridSizer = document.createElement("div");
  gridSizer.className = 'grid-sizer';
  container.appendChild(gridSizer);

  files.forEach(async (file) => {
    let thumb = document.createElement("img");
    thumb.className = "thumbnail";
    const tk = await rtk();
    thumb.src = `${endpoint}/thumb/${tk}/${file}/0`;
    let thumbContainer = document.createElement('div');
    thumbContainer.className = "grid-item";
    thumbContainer.appendChild(thumb);
    container.appendChild(thumbContainer);

    thumb.onclick = function(item) {
      check_detail(endpoint, item)
    }
  });


  let loadMsnry = setInterval(() => {
    var grid = document.querySelector('.grid');
    var msnry = new Masonry( grid, {
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',
      horizontalOrder: true,
      gutter: 10
    });
    
    imagesLoaded( grid ).on( 'progress', function() {
      msnry.layout();
      clearInterval(loadMsnry);

    });
  }, 200);
  

  return container;
}


async function check_detail(endpoint, item) {
  let fileName = item.path[0].src.split('/')[6];
  const tk = await rtk();
  
  let fileDetail = `${endpoint}/file/${tk}/${fileName}`;

  let element = document.createElement("img");
  element.src = fileDetail;

  prompt(fileName, "warn", element);

}