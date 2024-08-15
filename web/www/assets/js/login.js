import { loadParamsMessage } from "./modules/params.js";

loadParamsMessage();

function getCookie(c_name) {
  var c_value = document.cookie;
  var c_start = c_value.indexOf(" " + c_name + "=");
  if (c_start == -1) {
    c_start = c_value.indexOf(c_name + "=");
  }
  if (c_start == -1) {
    c_value = null;
  } else {
    c_start = c_value.indexOf("=", c_start) + 1;
    var c_end = c_value.indexOf(";", c_start);
    if (c_end == -1) {
      c_end = c_value.length;
    }
    c_value = decodeURIComponent(c_value.substring(c_start, c_end));
  }
  return c_value;
}

function setCookie(c_name, value, exdays) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value =
    encodeURIComponent(value) +
    (exdays == null
      ? ""
      : "; expires=" + exdate.toUTCString() + "SameSite=Lax");
  document.cookie = c_name + "=" + c_value;
}
// remember me
document.getElementById("loginBtn").addEventListener("click", async () => {
  if (document.getElementById("rememberMeCheck").checked) {
    setCookie("user-email", document.getElementById("user-email").value);
  } else {
    setCookie("user-email", "");
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  const userEmail = getCookie("user-email");
  if (userEmail) {
    document.getElementById("user-email").value = userEmail;
    document.getElementById("rememberMeCheck").checked = true;
  }
});
