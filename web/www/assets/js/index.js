import { postScheduledPost, getPosts, deletePost, getAccounts } from "./api.js";
import { popUp, closePopup } from "./modules/modal-popup.js";
import { accordian, iconButton, dropDown } from "./modules/buttons.js";
import { prompt, closePrompt } from "./modules/prompt.js";
import { popMsg } from "./modules/popup-message.js";
import { loading } from "./modules/loading.js";
import { Gallery } from "./modules/classes/gallery.js";
import { NotificationBadge } from "./modules/classes/notification-count.js";
import { changeTheme } from "./modules/themes.js";
import { nav } from "./nav.js";
import { loadParamsMessage } from "./modules/params.js";
nav("home");
changeTheme();

loading();

let appScreen = document.getElementById("appScreen");
appScreen.className = "app-screen";

loadParamsMessage();

async function newPost() {
  let container = document.createElement("div");
  container.classList.add("post-info-container");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  let postInfo = document.createElement("div");
  postInfo.classList.add("post-info");
  let col1 = document.createElement("div");
  col1.classList.add("post-info-col1");
  postInfo.appendChild(col1);
  let col2 = document.createElement("div");
  col2.classList.add("post-info-col2");
  postInfo.appendChild(col2);

  // text label
  let textLabel = document.createElement("label");
  textLabel.htmlFor = "postText";
  textLabel.innerText = "Text";
  col2.appendChild(textLabel);

  // text
  let postText = document.createElement("textarea");
  postText.className = "text-area";
  postText.name = "postText";
  col2.appendChild(postText);

  // date time selection
  let dateSelector = document.createElement("div");
  dateSelector.classList.add("date-selector");
  let dateLabel = document.createElement("label");
  dateLabel.innerText = "Scheduled Date: ";
  dateLabel.htmlFor = "scheduledDate";
  dateSelector.appendChild(dateLabel);
  let dateInput = document.createElement("input");
  dateInput.type = "datetime-local";
  dateInput.style.marginLeft = "10px";
  dateSelector.appendChild(dateInput);
  col2.appendChild(dateSelector);

  // accounts
  let accountsLabel = document.createElement("label");
  accountsLabel.innerText = "Post to";
  col1.appendChild(accountsLabel);

  // accounts view
  let accountsView = document.createElement("div");
  accountsView.classList.add("accounts-view");
  col1.appendChild(accountsView);

  // account selector
  const accounts = await getAccounts();
  let accountSelector = document.createElement("div");
  accountSelector.classList.add("account-selector");
  if (accounts.length == 0) {
    let msg = document.createElement("p");
    msg.innerText = "Nothing to see here. Try adding an account first!";
    accountSelector.appendChild(msg);
  }
  // facebook account selector
  const fbAccounts = accounts.filter((e) => {
    if (e.platform == "facebook") {
      return e;
    }
  });
  if (fbAccounts.length > 0) {
    const fbAccountSelector = accountSelectorAccordian(fbAccounts, "facebook");
    accountSelector.appendChild(fbAccountSelector);
  }
  // selector logic
  let selectedAccountsIds = [];
  let selectedAccounts = [];
  let accountSelectionButton = document.createElement("button");
  accountSelectionButton.innerText = "Choose Accounts";
  accountSelectionButton.classList.add("button1");
  col1.appendChild(accountSelectionButton);
  accountSelectionButton.addEventListener("click", () => {
    prompt("Choose Accounts", "confirm", accountSelector, () => {
      selectedAccountsIds = [];
      selectedAccounts = [];
      if (accounts.length > 0) {
        accountSelector
          .querySelectorAll(".option")
          .forEach((opt) => {
            if (opt.querySelector(".checkbox").checked) {
              const acc =
                accounts[
                  accounts
                    .map((e) => {
                      return e._id;
                    })
                    .indexOf(opt.querySelector(".id").innerText)
                ];
              selectedAccountsIds.push(acc._id);
              selectedAccounts.push(acc);
            }
          });
      }
      accountsView.innerHTML = "";
      for (const obj of selectedAccounts) {
        let account = document.createElement("div");
        account.classList.add("selected-account");
        // user images are not yet implemented in the api, uncomment the lines below to hard-code a test image
        // let img = document.createElement("img");
        // img.src=`/${key}/attachments/userimg`;
        // account.appendChild(img);
        let accTypeBadge = document.createElement("ion-icon");
        accTypeBadge.name = `logo-${obj.platform}`;
        account.appendChild(accTypeBadge);
        let username = document.createElement("p");
        username.innerText = obj.userEmail;
        account.appendChild(username);
        accountsView.appendChild(account);
      }
      closePrompt();
    });
  });

  let post = {};

  // // poll settings
  // let pollSettings = document.createElement("div");
  // pollSettings.style.display = "flex";
  // pollSettings.style.flexDirection = "column";
  // pollSettings.style.alignItems = "center";
  // pollSettings.style.padding = "15px";
  // let pollDuration = document.createElement("div");
  // pollDuration.style.display = "flex";
  // pollDuration.style.flexDirection = "row";
  // pollDuration.style.padding = "10px";
  // let pollDurationLabel = document.createElement("label");
  // pollDurationLabel.innerText = "Duration: ";
  // pollDurationLabel.htmlFor = "pollDuration";
  // pollDuration.appendChild(pollDurationLabel);
  // let pollDurationMins = document.createElement("input");
  // pollDurationMins.name = "pollDuration";
  // pollDurationMins.type = "number";
  // pollDurationMins.min = "1";
  // pollDurationMins.style.height = "18px";
  // pollDurationMins.style.width = "60px";
  // pollDuration.appendChild(pollDurationMins);
  // let pollDurationText = document.createElement("p");
  // pollDurationText.innerText = "minutes";
  // pollDuration.appendChild(pollDurationText);
  // pollSettings.appendChild(pollDuration);
  // let pollOpts = document.createElement("div");
  // pollOpts.style.display = "flex";
  // pollOpts.style.flexDirection = "column";
  // pollOpts.style.alignItems = "center";
  // pollOpts.style.padding = "15px";
  // let pollOptsLabel = document.createElement("label");
  // pollOptsLabel.innerText = "Poll Options";
  // pollOpts.appendChild(pollOptsLabel);
  // multiAdd(pollOpts, "newpolloption");
  // pollSettings.appendChild(pollOpts);

  // post options
  let postOptions = document.createElement("div");
  postOptions.className = "post-options";

  // // poll options button
  // let pOBtn = document.createElement("button");
  // pOBtn.className = "button1";
  // pOBtn.innerText = "Poll Settings";
  // pOBtn.addEventListener("click", () => {
  //   prompt("Poll Settings(Optional)", "confirm", pollSettings, () => {
  //     let pollDuration = pollDurationMins.value || null;
  //     let pollOptions = [];
  //     let pollOptElems = document.querySelectorAll(".newpolloption");
  //     pollOptElems.forEach((elem) => {
  //       pollOptions.push(elem.value);
  //     });
  //     if (pollOptions.length < 1) {
  //       pollOptions = null;
  //       pollDuration = null;
  //     }
  //     if (pollDuration && pollOptions) {
  //       post["pollDuration"] = pollDuration;
  //       post["pollOptions"] = pollOptions;
  //     }
  //   });
  // });
  // postOptions.appendChild(pOBtn);

  // add attachment button
  let btnContainer = document.createElement("div");
  btnContainer.className = "button-container";
  let attachBtn = document.createElement("button");
  attachBtn.className = "button1";
  attachBtn.innerText = "Attach Media";
  let badge = new NotificationBadge(0);
  btnContainer.appendChild(attachBtn);
  btnContainer.appendChild(badge.getElement());
  let attachments = [];
  attachBtn.addEventListener("click", async () => {
    const gallery = new Gallery("/file", (filename) => {
      attachments.push(filename);
      closePrompt();
      badge.addValue(1);
    });
    let gal = await gallery.create();
    prompt("Attach Media", "cancel", gal, () => {
      gallery.stop(gallery.loadMsnry);
    });
  });
  postOptions.appendChild(btnContainer);

  col2.appendChild(postOptions);

  // schedule button
  let scheduleBtn = document.createElement("button");
  scheduleBtn.className = "button1";
  scheduleBtn.innerText = "Schedule Post";
  scheduleBtn.addEventListener("click", async () => {
    post["accounts"] = selectedAccountsIds;
    post["text"] = postText.value;
    post["datetime"] = dateInput.value;
    if (0 == post.accounts.length) {
      popMsg(
        "var(--yellow",
        "var(--darker)",
        "Please select at least 1 account"
      );
      return;
    }
    const sd = new Date(post.datetime);
    const cd = new Date();
    if ("" == post.datetime || sd - cd < 0) {
      popMsg("var(--yellow", "var(--darker)", "Invalid date/time selected");
      return;
    }
    if ("" == post.text && attachments.length == 0) {
      popMsg(
        "var(--yellow",
        "var(--darker)",
        "Please add either text or media to your post"
      );
      return;
    }
    if (attachments.length > 0) {
      post["attachment"] = attachments;
    }
    closePopup();
    loading();
    const res = await postScheduledPost(post);
    closePrompt();
    popDash();
    if ("success" == res.status) {
      popMsg("var(--green)", "#fff", res.message);
    } else if ("error" == res.status) {
      popMsg("var(--red)", "#fff", res.message);
    }
  });
  container.appendChild(postInfo);
  container.appendChild(scheduleBtn);
  popUp("New Post", container);
}

async function showPosts() {
  let outerContainer = document.createElement("div");
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
    let deletePostBtn = iconButton(
      `<ion-icon name="trash-outline"></ion-icon>`,
      null,
      "var(--red)"
    );
    deletePostBtn.addEventListener("click", async () => {
      let delText = document.createElement("p");
      delText.style.fontWeight = "300";
      delText.innerHTML =
        "This won't delete the post from social media,<br> only from the database and/or schedule.";
      prompt("Are you sure?", "confirm", delText, async () => {
        await deletePost(post._id);
        location.reload();
      });
    });
    container.appendChild(deletePostBtn);
    outerContainer.appendChild(container);
    let finalStatus = "unknown";
    for (const data of post.data) {
      console.log(data.status.split(":"));
      if (data.status.split(":")[0] == "pending") {
        finalStatus = "pending";
      } else if (data.status.split(":")[0] == "posted") {
        finalStatus = "posted";
      } else if (data.status.split(":")[0] == "error") {
        finalStatus = "error";
      }
    }
    if ("pending" == finalStatus) {
      container.style.borderRightColor = "var(--neutral)";
    } else if ("posted" == finalStatus) {
      container.style.borderRightColor = "var(--green)";
    } else if ("error" == finalStatus) {
      container.style.borderRightColor = "var(--red)";
    }
  });
  appScreen.appendChild(outerContainer);

  // Post Legend

  let postLegend = document.createElement("div");
  postLegend.classList.add("post-legend");
  let postLegendList = document.createElement("ul");
  appScreen.appendChild(postLegend);
  postLegend.appendChild(postLegendList);

  // Pending
  let pendingPostLegendListItem = document.createElement("li");
  let pendingPostLegend = document.createElement("p");
  pendingPostLegend.innerHTML = "Pending:";
  let pendingPostLegendBox = document.createElement("div");
  pendingPostLegendBox.classList.add("pending-legend-box");
  pendingPostLegendBox.classList.add("post-legend-box");

  postLegendList.appendChild(pendingPostLegendListItem);
  pendingPostLegendListItem.appendChild(pendingPostLegend);
  pendingPostLegendListItem.appendChild(pendingPostLegendBox);

  // Posted
  let postedPostLegendListItem = document.createElement("li");
  let postedPostLegend = document.createElement("p");
  postedPostLegend.innerHTML = "Posted:";
  let postedPostLegendBox = document.createElement("div");
  postedPostLegendBox.classList.add("posted-legend-box");
  postedPostLegendBox.classList.add("post-legend-box");

  postLegendList.appendChild(postedPostLegendListItem);
  postedPostLegendListItem.appendChild(postedPostLegend);
  postedPostLegendListItem.appendChild(postedPostLegendBox);

  // Error
  let errorPostLegendListItem = document.createElement("li");
  let errorPostLegend = document.createElement("p");
  errorPostLegend.innerHTML = "Error:";
  let errorPostLegendBox = document.createElement("div");
  errorPostLegendBox.classList.add("error-legend-box");
  errorPostLegendBox.classList.add("post-legend-box");

  postLegendList.appendChild(errorPostLegendListItem);
  errorPostLegendListItem.appendChild(errorPostLegend);
  errorPostLegendListItem.appendChild(errorPostLegendBox);
}

async function popDash() {
  appScreen.innerHTML = "";

  // add account button
  let addAccountBtn = document.createElement("button");
  addAccountBtn.className = "button1";
  addAccountBtn.innerText = "Add Account";
  addAccountBtn.style.marginTop = "20px";
  addAccountBtn.addEventListener("click", async () => {
    addAccount();
  });
  appScreen.appendChild(addAccountBtn);

  let accounts = document.createElement("div");
  accounts.className = "accounts";
  appScreen.appendChild(accounts);

  // accounts overview
  function numAccounts(platform, bgColor, count) {
    let accc = document.createElement("div");
    accc.className = "account";
    accc.style.background = bgColor;
    let accountIcon = document.createElement("ion-icon");
    accountIcon.className = "icon";
    accountIcon.name = `logo-${platform}`;
    accc.appendChild(accountIcon);
    accounts.appendChild(accc);
    let accountCount = document.createElement("h1");
    accountCount.className = "text";
    accountCount.innerText = count;
    accc.appendChild(accountCount);
  }

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
  const result = await getAccounts();
  // account count
  // Instagram
  // numAccounts(
  //   "instagram",
  //   "#E1306C",
  //   result.filter((e) => {
  //     return e.platform == "instagram";
  //   }).length || 0
  // );
  // // Twitter
  // numAccounts(
  //   "twitter",
  //   "#1DA1F2",
  //   result.filter((e) => {
  //     return e.platform == "twitter";
  //   }).length || 0
  // );
  // Facebook
  numAccounts(
    "facebook",
    "#0165E1",
    result.filter((e) => {
      return e.platform == "facebook";
    }).length || 0
  );
  //const posts = document.querySelectorAll(".posts-container");
  //posts.forEach((post) => {
  //  post.remove();
  //});
  await showPosts();
}

function accountSelectorAccordian(accounts, platform, useAtSymbol) {
  useAtSymbol = useAtSymbol || false;
  if (accounts.length > 0) {
    let mainChk = document.createElement("input");
    mainChk.className = "checkbox";
    mainChk.type = "checkbox";
    let options = [];
    accounts.forEach((item) => {
      // container
      let opt = document.createElement("div");
      opt.className = "account-option-at";
      opt.classList.add("option");
      // hidden identifier
      let hidId = document.createElement("label");
      hidId.classList.add("id");
      hidId.innerText = item._id;
      hidId.hidden = true;
      opt.appendChild(hidId);
      // text container
      let optText = document.createElement("div");
      opt.appendChild(optText);
      if (useAtSymbol) {
        // @ symbol
        let optTextPre = document.createElement("h2");
        optTextPre.innerText = "@";
        optText.appendChild(optTextPre);
      }
      // display name (username/tag/page name etc.)
      let optItem = document.createElement("h3");
      optItem.innerText = item.userEmail;
      optText.appendChild(optItem);
      // checkbox
      let chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "checkbox";
      chk.addEventListener("click", async () => {
        toggleChkChild(mainChk, chk);
      });
      opt.appendChild(chk);
      options.push(opt);
    });
    let accountSelector = accordian(
      platform.charAt(0).toUpperCase() + platform.slice(1),
      options,
      `<ion-icon name="logo-${[platform]}"></ion-icon>`,
      mainChk
    );
    mainChk.addEventListener("click", async () => {
      toggleChkMaster(mainChk, accountSelector);
    });
    return accountSelector;
  }
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

async function addAccount() {
  let elem = document.createElement("div");
  let accountsDrop = dropDown("choose a platform", ["Facebook Page"]);
  elem.appendChild(accountsDrop);
  prompt("Add Account", "confirm", elem, () => {
    switch (accountsDrop.innerText) {
      case "Facebook Page":
        window.location.replace("/facebook/auth");
        break;

      default:
        popMsg("var(--yellow)", "var(--darker)", "Please select a platform");
        break;
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  popDash();
  closePrompt();
  loadParamsMessage();
});
