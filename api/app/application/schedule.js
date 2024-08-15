import Agenda from "agenda";
import { dbURI } from "./database.js";

const agenda = new Agenda({ db: { address: dbURI } });
await agenda.start();

export async function scheduleDateTime(name, date, callback) {
  agenda.define(
    `${name}`,
    { priority: "high", concurrency: 10 },
    async (job, done) => {
      callback();
      done();
    }
  );
  await agenda.schedule(date, `${name}`);
}

export async function unschedule(name) {
  return await agenda.cancel({ name: `${name}` });
}

export async function getJobs() {
  return await agenda.jobs();
}
