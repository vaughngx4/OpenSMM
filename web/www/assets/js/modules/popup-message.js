function timedDestruction(element, time) {
  setTimeout(function () {
    element.remove();
  }, time);
}
export function popMsg(bgColor, textColor, msg) {
  var popupContainer = document.getElementById("popupContainer");

  var popup = document.createElement("div");
  var popupText = document.createElement("p");
  popup.className = "popup";
  popupText.className = "popup-text";
  popup.appendChild(popupText);
  popup.style.backgroundColor = bgColor;
  popupText.style.color = textColor;
  popupText.innerHTML = msg;
  popupContainer.appendChild(popup);
  // timedDestruction(popup, 1500000); // debug !!!
  timedDestruction(popup, 5000);
}
