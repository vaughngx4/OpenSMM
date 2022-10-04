import Agenda from "agenda";
import db from "./database.js";
const { dbURI } = db;

const agenda = new Agenda({ db: { address: dbURI } });

export async function schedule(name, date, callback) {
  agenda.define(
    `${name}`,
    { priority: "high", concurrency: 10 },
    async (job, done) => {
      callback();
      done();
    }
  );
  await agenda.start();
  await agenda.schedule(date, `${name}`);
}

export async function unschedule(name) {
  return await agenda.cancel({ name: `${name}` });
}

export async function getJobs() {
  return await agenda.jobs();
}
