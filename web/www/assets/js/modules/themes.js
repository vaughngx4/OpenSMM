export function addStyleSheet(selectedTheme) {
  localStorage.setItem("theme", selectedTheme);
  let li = document.createElement("link");
  li.classList.add("theme-style-sheet");
  li.type = "text/css";
  let href = "assets/themes-css/" + selectedTheme + ".css";
  li.setAttribute("href", href);
  li.setAttribute("rel", "stylesheet");
  let s = document.getElementsByTagName("head")[0];
  s.appendChild(li, s);
}

export function removeStyleSheet() {
  let removeTheme = document.querySelector(".theme-style-sheet");
  if(removeTheme){
    removeTheme.remove();
  }
  localStorage.setItem("theme", "default-theme");
}

export function changeTheme() {
  setDefaultIfNone();
  let styleSheet = document.querySelector(".theme-style-sheet");
  if (styleSheet == null) {
    let setTheme = localStorage.theme;
    if (setTheme !== "default-theme") {
      addStyleSheet(setTheme);
    }
  }
}

function setDefaultIfNone() {
  const currentTheme = localStorage.getItem("theme");
  if ("undefined" == currentTheme || "null" == currentTheme){
    localStorage.setItem("theme", "default-theme");
  }
}

