let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");
localStorage.getItem("sidebar-active");

function toggleMenu() {
  toggle.classList.toggle("active");
  navigation.classList.toggle("active");
  main.classList.toggle("active");
  if (localStorage.getItem("sidebar-active") == "false") {
    localStorage.setItem("sidebar-active", "true");
  } else {
    localStorage.setItem("sidebar-active", "false");
  }
}

function toggleOnly() {
  toggle.classList.toggle("active");
  navigation.classList.toggle("active");
  main.classList.toggle("active");
}

export function allowToggle() {
  let isActive = localStorage.getItem("sidebar-active");
  if (isActive == "true" || window.innerWidth < '750') {
    toggleOnly();
  }
  toggle.addEventListener("click", (event) => {
    toggleMenu();
  });
}

export function topbarMarker(title, color, details) {
  let markers = document.getElementById("topbarMarkers");
  let newMarker = document.createElement("div");
  newMarker.className = "marker";
  newMarker.id = title;
  let container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.alignContent = "center";
  container.style.justifyContent = "center";
  let h = document.createElement("h3");
  h.innerHTML = title;
  h.style.fontSize = "16px";
  h.style.color = "#000";
  container.appendChild(h);
  let dot = document.createElement("div");
  dot.style.width = "10px";
  dot.style.height = "10px";
  dot.style.borderRadius = "5px";
  dot.style.background = color;
  dot.style.alignSelf = "center";
  dot.style.marginLeft = "5px";
  container.appendChild(dot);
  let tooltiptext = document.createElement("span");
  tooltiptext.className = "tooltiptext";
  tooltiptext.innerHTML = details;
  newMarker.appendChild(container);
  newMarker.appendChild(tooltiptext);
  markers.appendChild(newMarker);
}