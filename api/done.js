// Caleb's runs synced from Strava, by local date: { "YYYY-MM-DD": { mi, pace } }.
//
// The nightly sync writes them to the DONE_JSON environment variable in Vercel and redeploys,
// so new runs show up without a git push (see SYNC.md). A GitHub Action copies them back into
// done.json in the repo each night as a backup; done.json is also the fallback here if DONE_JSON
// is missing or unreadable.
//
//   GET /api/done              -> window.DONE = {...};   (script for the app)
//   GET /api/done?format=json  -> {...}                  (for the backup Action)

const SNAPSHOT = require("../done.json");

function readDone() {
  try {
    const v = JSON.parse(process.env.DONE_JSON || "null");
    if (v && typeof v === "object" && !Array.isArray(v)) return v;
  } catch (e) {
    // fall through to the repo snapshot
  }
  return SNAPSHOT;
}

module.exports = function handler(req, res) {
  const done = readDone();
  res.setHeader("Cache-Control", "no-cache");
  if (req.query && req.query.format === "json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(JSON.stringify(done));
    return;
  }
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.status(200).send(`window.DONE = ${JSON.stringify(done)};\n`);
};
