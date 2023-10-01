export async function nav(page) {
  // sidebar set active item
  document.getElementById(`sidebar-${page}`).classList.add('active');
  // sidebar toggle
  const toggle = document.querySelector(".toggle");
  toggle.addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("active");
    document.querySelector(".main").classList.toggle("active");
    toggle.classList.toggle("active");
    if (toggle.classList.contains("active")) {
      toggle.querySelector(".icon .caret-backward").style.display = "block";
      toggle.querySelector(".icon .caret-forward").style.display = "none";
    } else {
      toggle.querySelector(".icon .caret-forward").style.display = "block";
      toggle.querySelector(".icon .caret-backward").style.display = "none";
    }
  });
  // sidebar active item
  let menuList = document.querySelectorAll(".menu-list li");
  function activeLink() {
    menuList.forEach((item) => {
      item.classList.remove("active");
      this.classList.add("active");
    });
  }
  menuList.forEach((item) => {
    item.addEventListener("click", activeLink);
  });
  // mobile sidebar mods
  var w = parseInt(screen.width);
  if (w <= 750) {
    //mobile menu code here !!! debug
  }
}
