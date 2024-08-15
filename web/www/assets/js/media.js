import { Gallery } from "./modules/classes/gallery.js";
import { changeTheme } from "./modules/themes.js";
import { prompt, closePrompt } from "./modules/prompt.js";
import { loading } from "./modules/loading.js";
import { fileUpload } from "./api.js";
import { nav } from "./nav.js";
nav('media')
changeTheme();

// UI

const appScreen = document.getElementById("appScreen");

// upload button
let uploadBtn = document.createElement("button");
uploadBtn.className = "button1";
uploadBtn.innerText = "Upload Media";
uploadBtn.style.marginBottom = "20px";
uploadBtn.addEventListener("click", () => {
  let fUpload = document.createElement("form");
  fUpload.className = "prompt-form";
  let fLabel = document.createElement("label");
  fLabel.className = "file-input-label";
  fLabel.setAttribute("for", "fileUpload");
  fUpload.appendChild(fLabel);
  let fI = document.createElement("i");
  fI.className = "file-input-label-item";
  fI.textContent = "Choose File";
  fLabel.appendChild(fI);
  let fInput = document.createElement("input");
  fInput.type = "file";
  fInput.setAttribute("id", "fileUpload");
  fUpload.appendChild(fInput);

  prompt("Upload Media", "confirm", fUpload, async () => {
    closePrompt();
    loading();
    const result = await fileUpload(fInput.files[0]).catch((err) => {
      popMsg("red", "#fff", "Upload error");
      console.error(err);
    });
    const response = await result;
    closePrompt();
    if (response) {
      setTimeout(() => { location.reload() }, 500);
    }
  });
  fI.onclick = function () {
    fInput.value = "";
    let fileNameEl = document.getElementsByClassName("file-name");
    if (fileNameEl.length > 0) {
      fileNameEl[0].remove();
    }
    let checkFileUpload = setInterval(() => {
      var fullPath = fInput.value;
      if (fullPath) {
        var startIndex =
          fullPath.indexOf("\\") >= 0
            ? fullPath.lastIndexOf("\\")
            : fullPath.lastIndexOf("/");
        var filename = fullPath.substring(startIndex);
        if (filename.indexOf("\\") === 0 || filename.indexOf("/") === 0) {
          filename = filename.substring(1);
          let fName = document.createElement("p");
          fName.className = "file-name";
          fName.textContent = filename;
          fUpload.appendChild(fName);
          clearInterval(checkFileUpload);
        }
      }
    }, 1000);
  };
});
appScreen.appendChild(uploadBtn);

const gallery = new Gallery("/file");
appScreen.appendChild(await gallery.create());

// UI
