import { allowToggle } from "./topbar.js";
import { getTwitterAccounts, postScheduledPost, getPosts, deletePost } from "./api.js";
import { popUp, closePopup } from "./modal-popup.js";
import { dropDown, accordian, iconButton } from "./buttons.js";
import { prompt, closePrompt } from "./prompt.js";

loading();
allowToggle();

// UI
let appScreen = document.getElementById("appScreen");
appScreen.className = "app-screen";

// add account button
let addBtn = document.createElement("button");
addBtn.className = "button1";
addBtn.innerText = "Add Account";
addBtn.addEventListener("click", async () => {
  choosePlatform();
});
appScreen.appendChild(addBtn);
let accounts = document.createElement("div");
accounts.className = "accounts";
appScreen.appendChild(accounts);

// accounts overview
let twitterAccount = document.createElement("div");
twitterAccount.className = "account";
twitterAccount.style.background = "#1DA1F2";
let accountIcon = document.createElement("i");
accountIcon.className = "fa-brands fa-twitter";
accountIcon.style.fontSize = "20px";
twitterAccount.appendChild(accountIcon);
accounts.appendChild(twitterAccount);
let accountCount = document.createElement("h1");
accountCount.style.color = "#fff";
accountCount.innerText = "0";
twitterAccount.appendChild(accountCount);

// schedule post button
let postBtn = document.createElement("button");
postBtn.className = "button1";
postBtn.innerText = "Schedule a Post";
postBtn.style.marginTop = "20px";
postBtn.style.marginBottom = "15px";
postBtn.addEventListener("click", async () => {
  newPost();
});
appScreen.appendChild(postBtn);

// posts view shows next
// UI

// functions
async function choosePlatform() {
  let elem = document.createElement("div");
  elem.style.display = "flex";
  elem.style.flexDirection = "column";
  elem.style.alignItems = "center";
  const drop = dropDown("-- choose a platform --", ["Twitter"]);
  drop.style.marginTop = "20px";
  elem.appendChild(drop);
  let goBtn = document.createElement("button");
  goBtn.className = "button1";
  goBtn.innerText = "Add";
  goBtn.style.marginTop = "20px";
  goBtn.addEventListener("click", async () => {
    addAccount(drop.querySelector(".drop-btn").innerText);
    closePopup();
  });
  elem.appendChild(goBtn);
  popUp("Add Account", elem, "20vh", "40vw");
}

async function addAccount(platform) {
  if ("Twitter" == platform) {
    window.open("/twitter/login", "_self");
  }
}

async function newPost() {
  let container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  let postInfo = document.createElement("div");
  postInfo.style.display = "flex";
  postInfo.style.flexDirection = "row";
  postInfo.style.paddingBottom = "50px";
  postInfo.style.justifyContent = "space-around";
  let col1 = document.createElement("div");
  col1.style.display = "flex";
  col1.style.flexDirection = "column";
  col1.style.alignItems = "center";
  postInfo.appendChild(col1);
  let col2 = document.createElement("div");
  col2.style.display = "flex";
  col2.style.flexDirection = "column";
  col2.style.alignItems = "center";
  postInfo.appendChild(col2);
  let textLabel = document.createElement("label");
  textLabel.htmlFor = "postText";
  textLabel.innerText = "Text";
  col1.appendChild(textLabel);
  let postText = document.createElement("textarea");
  postText.className = "text-area";
  postText.name = "postText";
  postText.style.height = "25vh";
  postText.style.width = "25vw";
  col1.appendChild(postText);
  let dateSelector = document.createElement("div");
  dateSelector.style.display = "flex";
  dateSelector.style.flexDirection = "row";
  dateSelector.style.padding = "20px";
  let dateLabel = document.createElement("label");
  dateLabel.innerText = "Scheduled Date: ";
  dateLabel.htmlFor = "scheduledDate";
  dateSelector.appendChild(dateLabel);
  let dateInput = document.createElement("input");
  dateInput.type = "datetime-local";
  //dateInput.value = new Date().toString;
  dateInput.style.marginLeft = "10px";
  dateSelector.appendChild(dateInput);
  col2.appendChild(dateSelector);
  let accountsLabel = document.createElement("label");
  accountsLabel.innerText = "Post to";
  col2.appendChild(accountsLabel);
  let accountSelection = document.createElement("div");
  accountSelection.style.display = "flex";
  accountSelection.style.flexDirection = "column";
  accountSelection.style.width = "25vw";
  let twitterChk = document.createElement("input");
  twitterChk.className = "checkbox";
  twitterChk.type = "checkbox";
  const result = await getTwitterAccounts();
  const twitterAccounts = result.data;
  //const twitterAccounts = ["sintelli_tech"];
  let options = [];
  twitterAccounts.forEach((item) => {
    let opt = document.createElement("div");
    opt.className = "option";
    opt.style.display = "flex";
    opt.style.flexDirection = "row";
    opt.style.padding = "10px";
    opt.style.justifyContent = "space-between";
    let optText = document.createElement("div");
    optText.style.display = "flex";
    optText.style.flexDirection = "row";
    optText.style.marginLeft = "80px";
    let optTextPre = document.createElement("h2");
    optTextPre.style.fontSize = "14px";
    optTextPre.style.fontWeight = "300";
    optTextPre.innerText = "@";
    optText.appendChild(optTextPre);
    let optItem = document.createElement("h3");
    optItem.style.fontSize = "14px";
    optItem.style.fontWeight = "300";
    optItem.innerText = item;
    optText.appendChild(optItem);
    opt.appendChild(optText);
    let chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "checkbox";
    chk.addEventListener("click", async () => {
      toggleChkChild(twitterChk, chk);
    });
    opt.appendChild(chk);
    options.push(opt);
  });
  let twitterAccountSelections = accordian(
    "Twitter",
    options,
    '<i class="fa-brands fa-twitter"></i>',
    twitterChk
  );
  accountSelection.appendChild(twitterAccountSelections);
  twitterChk.addEventListener("click", async () => {
    toggleChkMaster(twitterChk, twitterAccountSelections);
  });
  col2.appendChild(accountSelection);
  let scheduleBtn = document.createElement("button");
  scheduleBtn.className = "button1";
  scheduleBtn.innerText = "Schedule Post";
  scheduleBtn.addEventListener("click", async () => {
    let selectedAccounts = {
      twitter: [],
    };
    twitterAccountSelections.querySelectorAll(".option").forEach((opt) => {
      if (true == opt.querySelector(".checkbox").checked) {
        selectedAccounts.twitter.push(opt.querySelector("h3").innerText);
      }
    });
    closePopup();
    loading();
    await postScheduledPost({
      // poll options not yet added but api supports it
      accounts: selectedAccounts,
      text: postText.value,
      datetime: dateInput.value,
    });
    closePrompt();
    popDash();
  });
  container.appendChild(postInfo);
  container.appendChild(scheduleBtn);
  popUp("New Post", container, "80vh", "60vw");
}

async function showPosts(){
  const result = await getPosts();
  const posts = result.data;
  posts.forEach((post) => {
    let container = document.createElement("div");
    container.className = "post";
    let postText = document.createElement("p");
    postText.innerText = post.text;
    postText.padding = "5px";
    container.appendChild(postText);
    let datetime = document.createElement("p");
    datetime.style.fontWeight = "400";
    datetime.innerText = post.datetime;
    container.appendChild(datetime);
    let deletePostBtn = iconButton(`<i class="fa-solid fa-trash-can"></i>`);
    deletePostBtn.style.color = "red";
    deletePostBtn.style.cursor = "pointer";
    deletePostBtn.style.padding = "10px";
    deletePostBtn.addEventListener('click', async () => {
      deletePost(post._id)
      popDash();
    });
    container.appendChild(deletePostBtn);
    appScreen.appendChild(container);
  });
}

async function popDash() {
  const result = await getTwitterAccounts();
  accountCount.innerText = `${result.data.length}`;
  const posts = document.querySelectorAll(".post");
  posts.forEach((post) => {
    post.remove();
  });
  showPosts();
}

async function toggleChkMaster(master, elem) {
  const chkBoxes = elem.querySelectorAll(".checkbox");
  chkBoxes.forEach((chk) => {
    if (true == master.checked) {
      chk.checked = true;
    } else {
      chk.checked = false;
    }
  });
}

async function toggleChkChild(master, child) {
  if (false == child.checked) {
    master.checked = false;
  }
}

async function loading() {
  var loadingImage = document.createElement("div");
  loadingImage.style.padding = "10px";
  var image = document.createElement("img");
  image.src = "/assets/img/loading.gif";
  image.style.height = "210px";
  image.style.width = "300px";
  image.style.objectFit = "fill";
  loadingImage.appendChild(image);
  prompt("Loading...", "floating", loadingImage);
}
// functions

window.addEventListener("DOMContentLoaded", () => {
  popDash();
  closePrompt();
});
