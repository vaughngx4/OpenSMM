import { gallery } from "./modules/gallery.js";
import { changeTheme } from "./modules/themes.js";
import { allowToggle } from "./modules/topbar.js";
allowToggle();
changeTheme();

// UI

const appScreen = document.getElementById("appScreen");
let media = await gallery("/files");
appScreen.appendChild(media);

// UI
