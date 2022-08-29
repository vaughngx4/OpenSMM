import { allowToggle } from './topbar.js';
import { fetchTwitter } from './api.js';
import { popUp, closePopup } from './modal-popup.js'
import { newDropDown } from './dropdown.js'
allowToggle();

fetchTwitter(); //debug !!!

// UI
let appScreen = document.getElementById('appScreen');
appScreen.className = "app-screen";

// add account button
let addBtn = document.createElement('button');
addBtn.className="button1";
addBtn.innerText="Add Account";
addBtn.addEventListener('click', async () => {
    choosePlatform();
});
appScreen.appendChild(addBtn);
let accounts = document.createElement('div');
accounts.className = "accounts";
appScreen.appendChild(accounts);

// accounts overview
let account = document.createElement('div');
account.className = "account";
account.style.background = "#1DA1F2";
let accountIcon = document.createElement('i');
accountIcon.className = "fa-brands fa-twitter";
accountIcon.style.fontSize = "20px";
account.appendChild(accountIcon);
accounts.appendChild(account);
let accountCount = document.createElement('h1');
accountCount.style.color = "#fff";
accountCount.innerText = "0";
account.appendChild(accountCount);

// schedule post button
let postBtn = document.createElement('button');
postBtn.className="button1";
postBtn.innerText="Schedule a Post";
postBtn.style.marginTop = "20px";
postBtn.addEventListener('click', async () => {
    
})
appScreen.appendChild(postBtn);
// UI

// functions
async function choosePlatform(){
    let elem = document.createElement('div');
    elem.style.display = "flex";
    elem.style.flexDirection = "column";
    elem.style.alignItems = "center";
    const drop = newDropDown('-- choose a platform --', ['Twitter']);
    drop.style.marginTop = "20px";
    elem.appendChild(drop);
    let goBtn = document.createElement('button');
    goBtn.className = "button1";
    goBtn.innerText = "Add";
    goBtn.style.marginTop = "20px";
    goBtn.addEventListener('click', async () => {
        addAccount(drop.querySelector('.drop-btn').innerText);
        closePopup();
    });
    elem.appendChild(goBtn);
    popUp('Add Account', elem, '20vh', '40vw');
}
async function addAccount(platform){
    if ('Twitter' == platform) {
        window.open('/twitter/login', '_blank');
    }
}
// functions
