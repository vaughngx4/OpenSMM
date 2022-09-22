import { allowToggle } from "./topbar.js";
import { addStyleSheet, removeStyleSheet, changeTheme } from "./themes.js";
allowToggle();
changeTheme();

// UI

themeSelector();

// UI

function themeSelector() {
  const submitTheme = document.querySelector("#change-theme-submit");
  const radioButtons = document.querySelectorAll('input[name="theme"]');
  const currentTheme = localStorage.getItem("theme");
  for (const radioButton of radioButtons) {
    if (currentTheme == radioButton.value) {
      radioButton.checked = true;
      break;
    }
  }
  if (submitTheme) {
    submitTheme.addEventListener("click", () => {
      let selectedTheme;
      for (const radioButton of radioButtons) {
        if (radioButton.checked) {
          selectedTheme = radioButton.value;
          break;
        }
      }
      if (selectedTheme == "default-theme") {
        removeStyleSheet();
      } else {
        addStyleSheet(selectedTheme);
      }
    });
  }
}
