# plan.json schema

This is the exact shape `app.js` expects. When generating or updating a plan, output a full JSON file matching this structure — no extra commentary, just the JSON (it gets pasted directly over `plans/plan.json`).

```json
{
  "planName": "string — shown in the top bar",
  "startDate": "YYYY-MM-DD",
  "weeks": [
    {
      "week": 1,
      "summary": "1-2 sentence summary of the week's focus/intent",
      "days": [
        {
          "day": 1,
          "label": "Day 1",
          "type": "recovery | long | speed | rest",
          "title": "Recovery Run",
          "duration": "15 min",
          "exercises": [
            {
              "name": "Easy Run",
              "sets": 1,
              "reps": "15 min @ conversational pace",
              "notes": ""
            }
          ]
        }
      ]
    }
  ]
}
```

## Rules

- `type` must be one of `recovery`, `long`, `speed`, `rest` — these drive the color-coded tags in the UI. Don't invent new types unless you also add a CSS rule for `.day-tag.<type>` in `style.css`.
- `rest` days should have `"exercises": []` and `"duration": ""`.
- `exercises[].sets` is a number — the app auto-generates that many blank set/rep/weight rows for logging.
- `exercises[].reps` is the *target* shown before logging (e.g. "8 reps" or "400m @ 5k pace"), not what was actually done — actual performance is logged separately by the user in the app and lives in `localStorage`, not in `plan.json`.
- Each `days` array should have exactly 7 entries (one per day of the week), in order.

## Incorporating logged progress

When the user pastes their exported progress JSON (from the Export button) alongside this file, it looks like:

```json
{
  "exportedAt": "ISO timestamp",
  "planName": "...",
  "progress": {
    "w1d5": {
      "completed": true,
      "sessionNotes": "felt strong, could push pace next time",
      "exercises": [
        { "name": "Tempo Run", "target": "12 min @ threshold pace", "sets": [{ "reps": "12 min", "weight": "" }] }
      ]
    }
  }
}
```

Keys are `w{week}d{day}`. Use `completed`, `sessionNotes`, and actual logged `sets` values to inform adjustments to upcoming weeks (progression, deload, pace changes) — don't just copy old weeks forward unchanged.
