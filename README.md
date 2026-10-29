# Miles

Day-by-day training app for a sub-3:30 at the Christie Clinic Illinois Marathon (Sat Apr 24, 2027).
Static site: no build step, no dependencies.

- `index.html`, `styles.css`, `app.js`: the app
- `data.js`: the plan, one entry per day (`d` date, `w` week, `mi` miles, `t` type, `x` steps, `s` strength A/B)
- `fonts/`: Barlow and Barlow Condensed (SIL Open Font License, see `fonts/OFL.txt`)

Run locally: `npx serve .`
Deploy: pushes to `main` deploy to Vercel once the repo is connected to the `miles` project.
