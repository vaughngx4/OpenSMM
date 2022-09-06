// 'text' is prompt text
// 'type' is prompt type (confirm, notify, warn, floating)
// 'element' is the HTML DOM element to place between the heading and buttons
// 'callback' is the function called post confirmation
let open = false;
export async function prompt(text, type, element, callback) {
  let result = null;
  callback = callback || "none";
  if (open) {
    closePrompt();
    setTimeout(function () {
      result = doPrompt(text, type, element, callback);
    }, 700);
  } else {
    result = doPrompt(text, type, element, callback);
  }
  return result;
}
async function doPrompt(text, type, element, callback) {
  let result = null;
  document.getElementById("promptText").innerHTML = text;
  var container = document.getElementById("promptContent");
  container.borderRadius = "10px";
  container.innerHTML = ``;
  container.appendChild(element);
  var btnBox = document.createElement("div");
  btnBox.style.display = "flex";
  btnBox.style.padding = "5px";
  btnBox.style.flexDirection = "row";
  btnBox.style.width = "96%";
  btnBox.style.justifyContent = "space-around";
  if (type == "confirm" && callback != "none") {
    //create confirm and cancel buttons
    var confirm = document.createElement("button");
    confirm.style.fontSize = "16px";
    confirm.style.padding = "5px";
    confirm.style.borderRadius = "3px";
    confirm.innerHTML = "Confirm";
    confirm.style.color = "#fff";
    confirm.style.background = "green";
    confirm.style.cursor = "pointer";
    confirm.addEventListener("click", (event) => {
      closePrompt();
      result = callback();
      return result;
    });
    btnBox.appendChild(confirm);
    var cancel = document.createElement("button");
    cancel.style.fontSize = "16px";
    cancel.style.padding = "5px";
    cancel.style.borderRadius = "3px";
    cancel.innerHTML = "Cancel";
    cancel.style.color = "#fff";
    cancel.style.background = "red";
    cancel.style.cursor = "pointer";
    cancel.addEventListener("click", (event) => {
      closePrompt();
      return false;
    });
    btnBox.appendChild(cancel);
  } else if (type == "confirm" && callback == "none") {
    console.error(
      "prompt() of type 'confirm' requires a callback function as a 4th parameter."
    );
  } else if (type == "notify") {
    var okay = document.createElement("button");
    okay.style.fontSize = "16px";
    okay.style.padding = "5px";
    okay.style.borderRadius = "3px";
    okay.innerHTML = "Okay";
    okay.style.color = "#fff";
    okay.style.background = "green";
    okay.style.cursor = "pointer";
    okay.addEventListener("click", (event) => {
      closePrompt();
    });
    btnBox.appendChild(okay);
  } else if (type == "warn") {
    var done = document.createElement("button");
    done.style.fontSize = "16px";
    done.style.padding = "5px";
    done.style.borderRadius = "3px";
    done.innerHTML = "Done";
    done.style.color = "#fff";
    done.style.background = "red";
    done.style.cursor = "pointer";
    done.addEventListener("click", (event) => {
      closePrompt();
    });
    btnBox.appendChild(done);
  }
  if (type != "floating") {
    container.appendChild(btnBox);
  }
  open = true;
  document.getElementById("bgprompt").style.display = "flex";
  document.getElementById("bgprompt").style.animation =
    "fadein 0.7s ease forwards";
  document.getElementById("prompt").style.animation =
    "fadein 0.7s ease forwards";
}
export function closePrompt() {
  document.getElementById("bgprompt").style.animation =
    "fadeout 0.7s ease forwards";
  document.getElementById("prompt").style.animation =
    "fadeout 0.7s ease forwards";
  setTimeout(function () {
    document.getElementById("bgprompt").style.display = "none";
    open = false;
  }, 700);
}
