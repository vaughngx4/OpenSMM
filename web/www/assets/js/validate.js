class validate {
  constructor() {}
  minutes(mins) {
    if (mins < 1) {
      return false;
    } else {
      return true;
    }
  }
}

export default validate;
