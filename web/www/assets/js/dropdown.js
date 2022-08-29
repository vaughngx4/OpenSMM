export function newDropDown(defaultText, dropItems){
  var dropContainer = document.createElement("div");
  dropContainer.className = "drop-container";
  let dropDown = document.createElement("div");
  dropDown.className = "dropdown";
  let dropBtn = document.createElement("button");
  dropBtn.className = "drop-btn";
  dropBtn.innerText = defaultText;
  let dropContent = document.createElement("div");
  dropContent.className = "dropdown-content";
  dropItems.forEach((item) => {
    let newItem = document.createElement("p");
    newItem.className = "dropdown-item";
    newItem.innerText = item;
    newItem.addEventListener("click", (event) => {
      dropBtn.innerText = newItem.innerText;
      dropContent.style.display = "block";
    });
    dropContent.appendChild(newItem);
  });
  dropBtn.addEventListener("click", function () {
    dropContent.style.display = "block";
    dropBtn.style.borderBottomLeftRadius = "0";
    dropBtn.style.borderBottomRightRadius = "0";
  });
  dropDown.appendChild(dropBtn);
  dropDown.appendChild(dropContent);
  dropContainer.appendChild(dropDown);
  // close dropdowns
  window.onclick = function (event) {
    if (!event.target.matches(".drop-btn")) {
      if ((dropContent.style.display = "block")) {
        dropContent.style.display = "none";
        dropBtn.style.borderBottomLeftRadius = "25px";
        dropBtn.style.borderBottomRightRadius = "25px";
      }
    }
  };
  return dropContainer;
}