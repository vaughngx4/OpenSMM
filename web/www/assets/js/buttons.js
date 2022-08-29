// icon button
export function iconButton(iconHTML, text) {
  text = text || null;
  if (text) {
    text = `<p>${text}</p>`;
  }
  var button = document.createElement("div");
  button.className = "icon-button";
  var buttonIcon = document.createElement("div");
  buttonIcon.style.color = "#fff";
  buttonIcon.innerHTML = iconHTML;
  if (!!text) {
    buttonIcon.innerHTML = iconHTML + text;
  }
  button.appendChild(buttonIcon);
  return button;
}
export function dropDown(dropItems) {
  //untested !!!
  var dropContainer = document.createElement("div");
  dropContainer.className = "drop-container";
  var dropDown = document.createElement("div");
  dropDown.className = "dropdown";
  dropDown.id = "dropdown";
  var dropBtn = document.createElement("button");
  dropBtn.className = "drop-btn";
  dropBtn.id = "dropBtn";
  dropBtn.innerHTML = "-- select --";
  var dropContent = document.createElement("div");
  dropContent.className = "dropdown-content";
  dropItems.forEach((item) => {
    var newItem = document.createElement("p");
    newItem.className = "dropdown-item";
    newItem.innerHTML = item;
    newItem.addEventListener("click", (event) => {
      dropBtn.innerHTML = newItem.innerHTML;
      dropContent.style.display = "block";
    });
    dropContent.appendChild(newItem);
  });
  dropBtn.addEventListener("click", function () {
    dropContent.style.display = "block";
    dropBtn.style.borderBottomLeftRadius = "0";
  });
  dropDown.appendChild(dropBtn);
  dropDown.appendChild(dropContent);
  dropContainer.appendChild(dropDown);
  return dropContainer;
}
