import { allowToggle } from "./topbar.js";
allowToggle();

themeSelector()
changeTheme()

function themeSelector() {
    const submitTheme = document.querySelector('#change-theme-submit');        
    const radioButtons = document.querySelectorAll('input[name="theme"]');
    if(submitTheme) {
        submitTheme.addEventListener("click", () => {
            let selectedTheme;
            for (const radioButton of radioButtons) {
                if (radioButton.checked) {
                    selectedTheme = radioButton.value;
                    break;
                }
            }
            if(selectedTheme == "default") {
                removeStyleSheet()
            } else {
                addStyleSheet(selectedTheme);
            }
        });
    }
}

function addStyleSheet(selectedTheme) {
    localStorage.setItem("theme", selectedTheme);
    let li = document.createElement('link');
    li.classList.add('theme-style-sheet')
    li.type = 'text/css';     
    let href="assets/themes-css/" + selectedTheme + '.css';
    li.setAttribute('href', href);
    li.setAttribute('rel','stylesheet');
    let s = document.getElementsByTagName('head')[0];
    s.appendChild(li, s);
}

export function changeTheme() {
    let styleSheet =  document.querySelector('.theme-style-sheet');
    if(styleSheet == null) {
        let setTheme = localStorage.theme;
        if(setTheme !== "default") {
            addStyleSheet(setTheme);
        }        
    }

}

function removeStyleSheet() {
    let removeTheme = document.querySelector(".theme-style-sheet");
    removeTheme.remove(); 
    localStorage.setItem("theme", "default");
}