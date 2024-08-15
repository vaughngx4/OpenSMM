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
  element = element || null;
  let result = null;
  document.getElementById("promptText").innerHTML = text;
  var container = document.getElementById("promptContent");
  container.borderRadius = "10px";
  container.innerHTML = ``;
  if (element) {
    container.appendChild(element);
  }
  var btnBox = document.createElement("div");
  btnBox.style.display = "flex";
  btnBox.style.padding = "5px";
  btnBox.style.marginTop = "5px";
  btnBox.style.flexDirection = "row";
  btnBox.style.width = "96%";
  btnBox.style.justifyContent = "space-around";
  if (type == "cancel" || (type == "confirm" && callback != "none")) {
    //create confirm and cancel buttons
    if (type == "confirm") {
      var confirm = document.createElement("button");
      confirm.classList.add("confirm");
      confirm.innerHTML = "Confirm";
      confirm.addEventListener("click", (event) => {
        // closePrompt();
        result = callback();
        return result;
      });
      btnBox.appendChild(confirm);
    }
    var cancel = document.createElement("button");
    cancel.classList.add("cancel");
    cancel.innerHTML = "Cancel";
    cancel.addEventListener("click", (event) => {
      closePrompt();
      // callback();
      return false;
    });
    btnBox.appendChild(cancel);
  } else if (type == "confirm" && callback == "none") {
    console.error(
      "prompt() of type 'confirm' requires a callback function as a 4th parameter."
    );
  } else if (type == "notify") {
    var okay = document.createElement("button");
    okay.classList.add("okay");
    okay.innerHTML = "Okay";
    okay.addEventListener("click", (event) => {
      closePrompt();
      if (callback != "none") {
        callback();
      }
    });
    btnBox.appendChild(okay);
  } else if (type == "warn") {
    var done = document.createElement("button");
    done.classList.add("done");
    done.innerHTML = "Done";
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
