/**
 * Just. Clean. Logs.
 * Usage:
 * const logger = new Logger('mymodule');
 * logger.log('info', 'This is a log message', rawData);
 * @summary LOGS!
 * @param {string} stat - Application or module the log data is coming from
 */
let logLevels = ["info", "warn", "debug", "sensitive"];
let logLevel = process.env.LOG_LEVEL || "info";
logLevel = logLevel.toLowerCase();
class Logger {
  constructor(stat) {
    this.stat = stat.toUpperCase();
  }
  /**
   * @summary Log to console
   * @param {string} level - Log level i.e WARN, INFO, DEBUG, ERROR etc.
   * @param {string} message - Log message
   */
  log(level, message, rawData) {
    rawData = rawData || false;
    if (
      logLevels.indexOf(level.toLocaleLowerCase()) <=
      logLevels.indexOf(logLevel.toLocaleLowerCase())
    ) {
      let seconds;
      const d = new Date(new Date().toUTCString());
      if (d.getSeconds() < 10) {
        seconds = `0${d.getSeconds()}`;
      } else {
        seconds = `${d.getSeconds()}`;
      }
      const timestamp = `${d.getFullYear()}-${
        d.getMonth() + 1
      }-${d.getDate()}:${d.getHours()}:${d.getMinutes()}:${seconds}`;
      console.log(
        `${timestamp} ${level.toUpperCase()}:${this.stat}:${message.replace(
          /(\r\n|\n|\r)/gm,
          ""
        )}`
      );
      if (rawData) {
        console.log(rawData);
      }
    }
  }
}

export default Logger;
