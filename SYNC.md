# Strava sync

Marks days done in the app by storing Caleb's Strava runs in Vercel. No git push is involved.
Runs nightly as a scheduled task in the claude.ai "marathon" project, or whenever Caleb asks ("sync Strava").

## Where the runs live

The `DONE_JSON` environment variable on the Vercel project `miles`
(`prj_PB3KBMAL7WaNbdxKRQFlLrRxNMgX`, team slug `calebynhan-4900s-projects`, type plain,
targets production and preview). `api/done.js` serves it to the app as `window.DONE`.
Env vars are read at build time, so a change only shows up after a redeploy.

Backup: the GitHub Action `.github/workflows/backup-done.yml` runs nightly at 05:17 UTC (about an hour
after the sync), reads `/api/done?format=json` from production, and commits any change to `done.json`.
It never removes dates; if Vercel is missing a date the backup has, the Action fails instead.
Vercel skips building commits that only touch `done.json` (`ignoreCommand` in `vercel.json`).
If `DONE_JSON` is ever lost, `api/done.js` falls back to `done.json`; restore the env var from it.

```json
{ "2026-10-26": { "mi": 4.3, "pace": "9:38/mi" } }
```

- `mi`: total run distance that day, meters / 1609.344, rounded to 0.1.
- `pace`: total moving time / total miles, rounded to the nearest second, as `m:ss/mi`.
- Key is the run's local start date, not UTC. In the fetch below, `start_date` ("Sat, 10/31/2026") is
  the local date; `start_date_local_raw` and `start_time` are UTC and can land on the next day.
- Only runs (Run, Trail Run, Virtual Run, Treadmill). Ignore rides, walks, lifts.
- Only dates from 2026-10-26 (plan start) onward.
- Never delete existing entries. Overwrite a date only if Strava's numbers for it changed.
- `data.js` is the plan. Do not edit it.

## Steps

1. Read the current `DONE_JSON` with the Vercel MCP (`filter_project_envs` / `get_project_env`).
   If it's missing, start from `done.json` in the repo.
2. Open https://www.strava.com/athlete/training in the built-in browser (Claude Browser on Caleb's computer).
   If it lands on the login page, Caleb has to log in himself. Never enter his password.
3. In that tab, run the fetch below with the JavaScript tool. Check the field names in the first
   result before trusting them; Strava's internal JSON can change.
4. Group runs by local date, compute `mi` and `pace`, merge into the current `DONE_JSON`.
5. If anything changed: upsert `DONE_JSON` (compact JSON, keys sorted) with `create_project_env`
   (`upsert: "true"`, type `plain`, targets production and preview). Then redeploy the current
   production deployment so the new value is built in: find the latest READY production deployment
   with `list_deployments` (projectId above, target production) and call `create_deployment` with
   `{"name":"miles","project":"prj_PB3KBMAL7WaNbdxKRQFlLrRxNMgX","target":"production","deploymentId":"<that id>"}`.
   Confirm it reaches READY with `get_deployment`, then check https://<production domain>/api/done
   includes the new dates.
6. If nothing changed, do nothing else.
7. Report in one line: dates added and miles, or "No new runs."

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
out.map(a => ({ id: a.id, localDate: a.start_date, type: a.sport_type ?? a.type,
  meters: a.distance_raw, moving: a.moving_time_raw, name: a.name }));
```

If those fields are missing, inspect `Object.keys(out[0])` and adapt.
