// Notification badge by vaughgx4

export class NotificationBadge {
  constructor(counter) {
    counter = counter || 0;
    this.counter = counter;
    this.element = document.createElement("span");
    this.element.className = "button-badge"; // css in styles.css under Generic Buttons
    this.element.innerText = `${this.counter}`;
  }

  getElement() {
    return this.element;
  }

  getValue() {
    return this.counter;
  }

  setValue(value) {
    this.counter = value;
    this.element.innerText = `${this.counter}`;
  }

  addValue(number) {
    this.counter = this.counter + number;
    this.element.innerText = `${this.counter}`;
  }

  subtractValue(number) {
    this.counter = this.counter - number;
    this.element.innerText = `${this.counter}`;
  }
}
