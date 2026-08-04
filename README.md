# Training Plan

A simple mobile-friendly training plan tracker, styled after Nike Run Club plans.
Plan → week summary → day workouts → exercise detail with set/rep logging.

## How it works

- `plans/plan.json` holds the plan (weeks → days → exercises). Ask Claude to edit this file to generate or update your plan.
- Progress (completed workouts, actual sets/reps, notes, RPE) is saved to your phone's browser via `localStorage` — nothing leaves your device automatically.
- Tap **Export** in the top bar to copy your logged progress as JSON. Paste it into a Claude conversation along with `plan.json` to get an updated plan back.

## Running locally

```
python3 -m http.server 8000
```
then open `http://localhost:8000`.

## Hosting on GitHub Pages

1. Push this repo to GitHub.
2. Repo Settings → Pages → Deploy from branch → `main` / root.
3. Open the published URL on your phone, then "Add to Home Screen" for an app-like feel.

## Updating the plan with Claude

The exact JSON shape Claude needs to produce is documented in [`PLAN_SCHEMA.md`](PLAN_SCHEMA.md) — point Claude at that file so it doesn't have to guess the format.

1. Open a Claude conversation (this repo or a fresh one). Share `PLAN_SCHEMA.md`, your current `plans/plan.json`, and (if you have it) your exported progress JSON from the Export button.
2. Ask Claude to adjust the plan based on what you completed, RPE, and notes.
3. Take the JSON Claude gives you and paste it over `plans/plan.json`, then commit and push — GitHub Pages redeploys automatically. (If Claude has repo/git access in that conversation, it can do this step directly.)
