// require API to operate as follows:
// "/endpoint" - GET - should return a json body with a data key containing an array of filenames
// "/endpoint/thumb/filename" - GET - should return a thumbnail for "filename"
// "/endpoint/filename" - GET - should return the original file "filename"

import { getFileNames } from "../api.js";

export async function gallery(endpoint){
    const response = await getFileNames();
    const files = response.data;
    let container = document.createElement('div');
    container.className = "gallery";

    let workingRow = row(container);

    files.forEach((file) => {
        let thumb = document.createElement('img');
        thumb.className = "thumbnail";
        thumb.src = `${endpoint}/thumb/${file}/0`
        workingRow = row(container, workingRow);
        workingRow.appendChild(thumb);
    });

    return container;
}

function row(container, currentRow){
    currentRow = currentRow || null;
    if(!currentRow){
        currentRow = document.createElement("div");
        currentRow.className = "row";
        container.appendChild(currentRow);
    }
    const limit = ((container.style.width)/180).toFixed(0); // the number here is the total width of the thumbnail + padding (default image width is 150)
    console.log("Row Limit: " + limit); // debug !!!
    if(currentRow.children.length >= limit){
        currentRow = document.createElement("div");
        currentRow.className = "row";
    }
    return currentRow;
}