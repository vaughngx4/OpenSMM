import { isString } from "../validate.js";

// random http nonsense
export function stripNonsense(str) {
  if (!isString(str)) {
    return str;
  }
  const nonsense = "#_";
  if (str.endsWith(nonsense)) {
    str = str.substring(0, str.length - 2);
  }
  return str;
}
