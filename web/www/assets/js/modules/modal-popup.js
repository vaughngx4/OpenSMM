export async function closePopup(callback) {
  callback = callback || "none";
  document.getElementById("modalContent").style.animation =
    "zoomout 0.7s ease forwards";
  document.getElementById("bgmodal").style.animation =
    "fadeout 0.7s ease forwards";
  setTimeout(function () {
    bgmodal.style.display = "none";
  }, 700);
  if (callback != "none") {
    callback();
  }
}
export async function popUp(heading, element, callback) {
  callback = callback || "none";
  // height = height || "80%";
  // width = width || "80%";
  document.getElementById("infoHeading").innerHTML = heading;
  var description = document.getElementById("infoDescription");
  var content = document.getElementById("modalContent");
  // description.style.height = "100%"; // Can this be removed?
  description.innerHTML = ``;
  description.appendChild(element);
  // content.style.height = height;
  // content.style.width = width;
  bgmodal.style.display = "flex";
  bgmodal.style.animation = "fadein 0.7s ease forwards";
  content.style.animation = "zoomin 0.7s ease forwards";
  document.getElementById("closePopup").addEventListener("click", () => {
    closePopup(callback);
  });
}
