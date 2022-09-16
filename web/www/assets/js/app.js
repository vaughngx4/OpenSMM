import { allowToggle } from "./topbar.js";
import {
  getTwitterAccounts,
  postScheduledPost,
  getPosts,
  deletePost,
} from "./api.js";
import { popUp, closePopup } from "./modal-popup.js";
import { dropDown, accordian, iconButton, multiAdd } from "./buttons.js";
import { prompt, closePrompt } from "./prompt.js";
//import Validate from "./validate.js";
import { popMsg } from "./popup-message.js";

//const validate = new Validate();
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
// get url parameters
function getUrlParams() {
  let vars = {};
  window.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function (m, key, value) {
      vars[key] = value;
    }
  );
  if (Object.keys(vars).length === 0) {
    return false;
  } else {
    return vars;
  }
}

// load params as prompt
async function loadMessage() {
  const params = getUrlParams();
  if (params) {
    let elem = document.createElement('div');
    elem.style.display = "flex";
    elem.style.flexDirection = "column";
    elem.style.alignItems = "center";
    let image = document.createElement("img");
    image.style.height = "80px";
    image.style.width = "80px";
    image.style.padding = "10px";
    let text = "Error!";
    image.src = "/assets/img/error.png";
    if ("success" == params["status"]) {
      text = "Success!";
      image.src = "/assets/img/success.png";
    }
    elem.appendChild(image);
    let message = document.createElement('p');
    message.style.color = "#fff";
    message.style.padding = "10px";
    message.innerText = decodeURIComponent(params["message"]);
    elem.appendChild(message);
    prompt(text, "notify", elem);
  }
}
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

  // date time selection
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

  // account selection
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
  // const result = await getTwitterAccounts();
  // const twitterAccounts = result.data;
  const twitterAccounts = ["sintelli_tech"];
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

  // poll options
  let pollLabel = document.createElement("label");
  pollLabel.style.color = "#fff";
  pollLabel.innerText = "Poll Settings (optional)";
  pollLabel.style.paddingTop = "10px";
  col1.appendChild(pollLabel);
  let pollDuration = document.createElement("div");
  pollDuration.style.display = "flex";
  pollDuration.style.flexDirection = "row";
  pollDuration.style.padding = "10px";
  let pollDurationLabel = document.createElement("label");
  pollDurationLabel.style.color = "#fff";
  pollDurationLabel.innerText = "Duration: ";
  pollDurationLabel.htmlFor = "pollDuration";
  pollDurationLabel.style.marginRight = "5px";
  pollDuration.appendChild(pollDurationLabel);
  let pollDurationMins = document.createElement("input");
  pollDurationMins.name = "pollDuration";
  pollDurationMins.type = "number";
  pollDurationMins.min = "1";
  pollDurationMins.style.height = "18px";
  pollDurationMins.style.width = "60px";
  pollDuration.appendChild(pollDurationMins);
  let pollDurationText = document.createElement("p");
  pollDurationText.style.color = "#fff";
  pollDurationText.innerText = "minutes";
  pollDuration.appendChild(pollDurationText);
  col1.appendChild(pollDuration);
  let pollOpts = document.createElement("div");
  pollOpts.style.display = "flex";
  pollOpts.style.flexDirection = "column";
  let pollOptsLabel = document.createElement("label");
  pollOptsLabel.style.color = "#fff";
  pollOptsLabel.innerText = "Poll Options";
  pollOptsLabel.style.marginBottom = "10px";
  pollOpts.appendChild(pollOptsLabel);
  multiAdd(pollOpts, "newpolloption");
  col1.appendChild(pollOpts);

  // schedule button
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
    let pollDuration = pollDurationMins.value || null;
    let pollOptions = [];
    let pollOptElems = document.querySelectorAll(".newpolloption");
    pollOptElems.forEach((elem) => {
      pollOptions.push(elem.value);
    });
    if (pollOptions.length < 1) {
      pollOptions = null;
      pollDuration = null;
    }
    let post = {};
    if (!pollDuration || !pollOptions) {
      post = {
        accounts: selectedAccounts,
        text: postText.value,
        datetime: dateInput.value,
      };
    } else {
      post = {
        accounts: selectedAccounts,
        text: postText.value,
        datetime: dateInput.value,
        pollDuration,
        pollOptions,
      };
    }
    closePopup();
    loading();
    const res = await postScheduledPost(post);
    closePrompt();
    popDash();
    if ("success" == res.status) {
      popMsg("green", "#fff", res.message);
    } else if ("error" == res.status) {
      popMsg("red", "#fff", res.message);
    }
  });
  container.appendChild(postInfo);
  container.appendChild(scheduleBtn);
  popUp("New Post", container, "80vh", "60vw");
}

async function showPosts() {
  let outerContainer = document.createElement('div');
  outerContainer.style.display = "flex";
  outerContainer.style.flexDirection = "column"
  outerContainer.style.height = "300px";
  outerContainer.style.width = "450px";
  outerContainer.style.overflowY = "scroll";
  outerContainer.className = "posts-container";
  const result = await getPosts();
  const posts = result.data;
  posts.forEach((post) => {
    let container = document.createElement("div");
    container.className = "post";
    let postText = document.createElement("p");
    postText.innerText = post.text;
    container.appendChild(postText);
    let datetime = document.createElement("p");
    datetime.style.fontWeight = "400";
    datetime.innerText = new Date(post.datetime).toLocaleString();
    container.appendChild(datetime);
    let deletePostBtn = iconButton(`<i class="fa-solid fa-trash-can"></i>`, null, "red");
    deletePostBtn.addEventListener("click", async () => {
      let delText = document.createElement('p');
      delText.style.color = "#fff";
      delText.style.fontWeight = "300";
      delText.innerHTML = "This won't delete the post from social media,<br> only from the database and/or schedule.";
      prompt("Are you sure?", "confirm", delText, () => {
        deletePost(post._id);
        popDash();
      })
    });
    container.appendChild(deletePostBtn);
    outerContainer.appendChild(container);
    if("pending" == post.data.twitter.status){
      container.style.borderRightColor = "blue";
    } else if("posted" == post.data.twitter.status){
      container.style.borderRightColor = "green";
    } else if("error" == post.data.twitter.status){
      container.style.borderRightColor = "red";
    }
  });
  appScreen.appendChild(outerContainer);
}

async function popDash() {
  const result = await getTwitterAccounts();
  accountCount.innerText = `${result.data.length}`;
  const posts = document.querySelectorAll(".posts-container");
  posts.forEach((post) => {
    post.remove();
  });
  await showPosts();
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
  loadMessage();
});
