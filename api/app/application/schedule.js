const Agenda = require("agenda");
const { dbURI } = require("./database");

const agenda = new Agenda({ db: { address: dbURI } });

async function schedule(name, date, callback) {
  agenda.define(`${name}`, { priority: "high", concurrency: 10 }, async (job, done) => {
    callback();
    done();
  });
  await agenda.start();
  await agenda.schedule(date, `${name}`);
}

async function unschedule(name) {
  return await agenda.cancel({ name: `${name}` });
}

async function getJobs() {
  return await agenda.jobs();
}

module.exports = { schedule, unschedule, getJobs };
