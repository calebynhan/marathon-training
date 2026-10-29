# Strava sync

Marks days done in the app by writing Caleb's Strava runs into `done.js`.
Runs nightly at 11:59 PM Central as a scheduled task, or whenever Caleb asks ("sync Strava").

## Data

`done.js` holds one entry per local date that has at least one run:

```js
window.DONE = {
  "2026-10-26": { "mi": 4.3, "pace": "9:38/mi" }
};
```

- `mi`: total run distance that day, meters / 1609.344, rounded to 0.1.
- `pace`: total moving time / total miles, as `m:ss/mi`.
- Key is the run's local start date (`start_date_local`), not UTC.
- Only runs (Run, Trail Run, Virtual Run, Treadmill). Ignore rides, walks, lifts.
- Only dates from 2026-10-26 (plan start) onward.
- Never delete existing entries. Overwrite a date only if Strava's numbers for it changed.
- `data.js` is the plan. Do not edit it.

## Steps

1. Get the repo: `add_repo` calebynhan/marathon-training with push access, clone it, `git pull`.
2. Open https://www.strava.com/athlete/training in the built-in browser (Claude Browser on Caleb's computer).
   If it lands on the login page, stop: Caleb has to log in himself. Never enter his password.
3. In that tab, run the fetch below with the JavaScript tool. Check the field names in the first
   result before trusting them; Strava's internal JSON can change.
4. Group runs by local date, compute `mi` and `pace`, merge into `done.js`.
5. If `done.js` changed: commit (`Sync Strava runs through YYYY-MM-DD`), push to `main`, then deploy
   to production with the Vercel MCP `create_deployment`:
   `{"name":"miles","project":"prj_PB3KBMAL7WaNbdxKRQFlLrRxNMgX","target":"production","gitSource":{"type":"github","org":"calebynhan","repo":"marathon-training","ref":"main"}}`
   with team slug `calebynhan-4900s-projects`. Confirm the deployment reaches READY.
6. If nothing changed, do nothing else.
7. Report in one or two lines: dates added and miles, or "no new runs".
   If Strava needed a login, email calebynhan@gmail.com (Gmail connector) saying the sync
   is blocked until he logs into Strava in the Claude desktop app's browser.

## Fetch

```js
const out = [];
for (let page = 1; page <= 3; page++) {
  const r = await fetch(`/athlete/training_activities?activity_type=Run&order=start_date_local+DESC&page=${page}&per_page=30`,
    { headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" } });
  const j = await r.json();
  const models = j.models || [];
  out.push(...models);
  if (models.length < 30) break;
}
out.map(a => ({ id: a.id, date: a.start_date_local_raw ?? a.start_time ?? a.start_date_local, type: a.sport_type ?? a.type,
  meters: a.distance_raw, moving: a.moving_time_raw, name: a.name }));
```

If those raw fields are missing, inspect `Object.keys(out[0])` and adapt.
