export function dot(color, element) {
    let tag = document.createElement("span");
    tag.className = "tag-dot";
    tag.style.backgroundColor = color;
    element.after(tag);
}