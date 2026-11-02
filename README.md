# Miles

Day-by-day marathon training app. Static site plus one serverless function, no build step.

- `/` shows the plan saved on this device. New visitors get a short form, and Claude writes a plan for them.
- `/me` shows Caleb's plan (sub-3:30 at the Christie Clinic Illinois Marathon, Sat Apr 24, 2027) with his Strava runs.

## Files

- `index.html`, `styles.css`, `app.js`: the app
- `setup.js`: picks the plan for this page (Caleb's at `/me`, otherwise the one saved on the device) and runs the "Your race" form
- `api/plan.js`: Vercel function that writes a plan with Claude and streams progress back. Uses the `ANTHROPIC_API_KEY` env var; the key never reaches the browser
- `data.js`: Caleb's plan, one entry per day (`d` date, `w` week, `mi` miles, `t` type, `x` steps, `s` strength A/B)
- `done.js`: Caleb's runs synced from Strava (see `SYNC.md`)
- `fonts/`: Barlow and Barlow Condensed (SIL Open Font License, see `fonts/OFL.txt`)

Plans made by other people live only in their browser's localStorage (`miles.plan.v1`). Nothing is stored on the server.

## Environment variables (Vercel)

- `ANTHROPIC_API_KEY` (required for new plans)
- `ACCESS_CODE` (optional): if set, people must enter this code to make a plan
- `PLAN_MODEL` (optional): defaults to `claude-sonnet-5-5`

Run locally: `npx vercel dev` (needs the env vars), or `npx serve .` for the static parts.
