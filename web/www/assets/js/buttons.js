// icon button
export function iconButton(iconHTML, text, color) {
  text = text || null;
  color = color || "#fff";
  if (text) {
    text = `<p>${text}</p>`;
  }
  let button = document.createElement("div");
  button.className = "icon-button";
  button.style.cursor = "pointer";
  let buttonIcon = document.createElement("div");
  buttonIcon.style.color = color;
  buttonIcon.innerHTML = iconHTML;
  if (!!text) {
    buttonIcon.innerHTML = iconHTML + text;
  }
  button.appendChild(buttonIcon);
  return button;
}

// dropdown
export function dropDown(defaultText, dropItems) {
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

//accordian
export function accordian(text, items, iconHTML, endContent) {
  iconHTML = iconHTML || null;
  endContent = endContent || null;
  let start = document.createElement("div");
  start.style.display = "flex";
  start.style.flexDirection = "row";
  let container = document.createElement("div");
  container.className = "overview-container";
  let box = document.createElement("div");
  box.className = "overview-box";
  let arrow = document.createElement("i");
  arrow.className = "fas fa-caret-right";
  let arrowBtn = document.createElement("button");
  arrowBtn.className = "accordian__button";
  arrowBtn.appendChild(arrow);
  let content = document.createElement("div");
  content.className = "accordian__content";
  items.forEach((item) => {
    content.appendChild(item);
  });
  arrowBtn.addEventListener("click", (event) => {
    dropThis(content, arrowBtn, arrow);
  });
  start.appendChild(arrowBtn);
  let label = document.createElement("h3");
  label.style.fontSize = "14px";
  label.style.fontWeight = "300";
  label.style.alignSelf = "center";
  if (!iconHTML) {
    label.innerHTML = `<pre>  ${text}</pre>`;
  } else {
    label.innerHTML = `<pre>${iconHTML}    ${text}</pre>`;
  }
  start.appendChild(label);
  box.appendChild(start);
  if (endContent) {
    let end = document.createElement("div");
    end.style.display = "flex";
    end.style.flexDirection = "row";
    end.appendChild(endContent);
    box.appendChild(end);
  }
  container.appendChild(box);
  container.appendChild(content);
  return container;
}

// multi add
export function multiAdd(outerContainer, className){
  let container = document.createElement('div');
  container.className = "multi-add";
  let input = document.createElement('input');
  container.appendChild(input);
  let add = document.createElement('button');
  add.innerText = "+";
  container.appendChild(add);
  outerContainer.appendChild(container);
  add.addEventListener('click', () => {
    mad(input, add, container, outerContainer, className);
  });
  input.addEventListener('keydown', (event) => {
    if("Enter" == event.key){
      mad(input, add, container, outerContainer, className);
    }
  });
  input.focus();
}

// multi add event

function mad(input, add, container, outerContainer, className){
  input.readOnly = "true";
  input.className = className || "";
  add.innerText = "-"
  add.style.background = "var(--red)";
  add.removeEventListener('click', mad);
  add.addEventListener('click', () => {
    container.remove();
  })
  multiAdd(outerContainer, className);
}

// drop accordian
async function dropThis(content, button, arrow) {
  content.classList.toggle("active");
  button.classList.toggle("active");
  if (arrow.className == "fas fa-caret-down") {
    arrow.className = "fas fa-caret-right";
  } else {
    arrow.className = "fas fa-caret-down";
  }
}
