var cron = require('node-cron');

const tz = process.env.TZ;

// ┌────────────── second (optional)
// │ ┌──────────── minute
// │ │ ┌────────── hour
// │ │ │ ┌──────── day of month
// │ │ │ │ ┌────── month
// │ │ │ │ │ ┌──── day of week
// │ │ │ │ │ │
// │ │ │ │ │ │
// * * * * * *

async function schedule(date, callback){
  cron.schedule(`0 ${date.getMinutes} ${date.getHours()} ${date.getDate()} ${date.getMonth()} *`, () => {
    callback();
  }, {
    scheduled: true,
    timezone: tz
  });
}

async function unschedule(){

}

async function getTasks(){
  return cron.getTasks();
}

module.exports = { schedule, unschedule, getTasks }
