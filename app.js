const STORAGE_KEY = "workoutProgress.v1";

let PLAN = null;
let PROGRESS = loadProgress();

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PROGRESS));
}

function dayKey(week, day) {
  return `w${week}d${day}`;
}

function getEntry(week, day) {
  const key = dayKey(week, day);
  return PROGRESS[key] || null;
}

async function init() {
  const res = await fetch("plans/plan.json");
  PLAN = await res.json();
  document.getElementById("planName").textContent = PLAN.planName;
  render();
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  PLAN.weeks.forEach((week) => {
    app.appendChild(renderWeek(week));
  });
}

function renderWeek(week) {
  const el = document.createElement("div");
  el.className = "week";

  const workoutDays = week.days.filter((d) => d.type !== "rest");
  const doneCount = workoutDays.filter((d) => getEntry(week.week, d.day)?.completed).length;

  const header = document.createElement("div");
  header.className = "week-header";
  header.innerHTML = `
    <div>
      <div class="week-title">Week ${week.week}</div>
      <div class="week-progress">${doneCount} of ${workoutDays.length} workouts completed</div>
    </div>
    <div class="chevron"></div>
  `;
  header.addEventListener("click", () => {
    el.classList.toggle("open");
  });
  el.appendChild(header);

  if (week.summary) {
    const summary = document.createElement("div");
    summary.className = "week-summary";
    summary.textContent = week.summary;
    el.appendChild(summary);
  }

  const daysWrap = document.createElement("div");
  daysWrap.className = "week-days";
  week.days.forEach((day) => {
    daysWrap.appendChild(renderDayRow(week, day));
  });
  el.appendChild(daysWrap);

  return el;
}

function renderDayRow(week, day) {
  const row = document.createElement("div");
  row.className = "day-row";
  const entry = getEntry(week.week, day.day);
  const isRest = day.type === "rest";

  row.innerHTML = `
    <div class="day-tag ${day.type}">${day.type.toUpperCase()}</div>
    <div class="day-info">
      <div class="day-label">${day.label}</div>
      <div class="day-title">${day.title}</div>
      ${day.duration ? `<div class="day-duration">${day.duration}</div>` : ""}
    </div>
    ${isRest ? "" : `<div class="day-check ${entry?.completed ? "done" : ""}"></div>`}
  `;

  if (!isRest) {
    row.addEventListener("click", () => openWorkout(week, day));
  }

  return row;
}

function openWorkout(week, day) {
  const modal = document.getElementById("workoutModal");
  const body = document.getElementById("modalBody");
  const entry = getEntry(week.week, day.day) || {
    completed: false,
    sessionNotes: "",
    rpe: "",
    exercises: day.exercises.map((ex) => ({
      name: ex.name,
      target: ex.reps,
      sets: Array.from({ length: ex.sets }, () => ({ reps: "", weight: "" })),
    })),
  };

  body.innerHTML = "";

  const title = document.createElement("div");
  title.className = "modal-title";
  title.textContent = day.title;
  body.appendChild(title);

  const sub = document.createElement("div");
  sub.className = "modal-sub";
  sub.textContent = `${week.summary ? `Week ${week.week} — ` : `Week ${week.week} — `}${day.duration || ""}`;
  body.appendChild(sub);

  if (entry.completed) {
    const banner = document.createElement("div");
    banner.className = "completed-banner";
    banner.textContent = "✓ Marked complete";
    body.appendChild(banner);
  }

  const exercisesWrap = document.createElement("div");
  exercisesWrap.id = "exercisesWrap";
  entry.exercises.forEach((ex, exIdx) => {
    exercisesWrap.appendChild(renderExerciseCard(ex, exIdx, entry));
  });
  body.appendChild(exercisesWrap);

  const addExBtn = document.createElement("button");
  addExBtn.className = "add-exercise-btn";
  addExBtn.textContent = "+ Add exercise";
  addExBtn.addEventListener("click", () => {
    entry.exercises.push({ name: "", target: "", sets: [{ reps: "", weight: "" }] });
    exercisesWrap.appendChild(renderExerciseCard(entry.exercises[entry.exercises.length - 1], entry.exercises.length - 1, entry));
  });
  body.appendChild(addExBtn);

  const notesBlock = document.createElement("div");
  notesBlock.className = "session-notes-block";
  notesBlock.innerHTML = `<label>Session notes / RPE</label>`;
  const notesArea = document.createElement("textarea");
  notesArea.placeholder = "How did it feel? RPE 1-10, anything to adjust next time...";
  notesArea.value = entry.sessionNotes || "";
  notesArea.addEventListener("input", (e) => (entry.sessionNotes = e.target.value));
  notesBlock.appendChild(notesArea);
  body.appendChild(notesBlock);

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const completeBtn = document.createElement("button");
  completeBtn.className = "btn btn-primary";
  completeBtn.textContent = entry.completed ? "Save changes" : "Complete workout";
  completeBtn.addEventListener("click", () => {
    entry.completed = true;
    entry.completedAt = entry.completedAt || new Date().toISOString();
    PROGRESS[dayKey(week.week, day.day)] = entry;
    saveProgress();
    closeModal();
    render();
  });
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-secondary";
  closeBtn.textContent = "Save & close";
  closeBtn.addEventListener("click", () => {
    PROGRESS[dayKey(week.week, day.day)] = entry;
    saveProgress();
    closeModal();
    render();
  });
  actions.appendChild(closeBtn);
  actions.appendChild(completeBtn);
  body.appendChild(actions);

  modal.classList.remove("hidden");
}

function renderExerciseCard(ex, exIdx, entry) {
  const card = document.createElement("div");
  card.className = "exercise-card";

  const nameRow = document.createElement("div");
  nameRow.className = "field-row";
  nameRow.innerHTML = `
    <div class="field" style="flex:2">
      <label>Exercise</label>
      <input type="text" value="${escapeAttr(ex.name)}" data-role="name" />
    </div>
  `;
  card.appendChild(nameRow);
  nameRow.querySelector("[data-role=name]").addEventListener("input", (e) => (ex.name = e.target.value));

  const targetRow = document.createElement("div");
  targetRow.className = "field-row";
  targetRow.innerHTML = `
    <div class="field">
      <label>Target</label>
      <input type="text" value="${escapeAttr(ex.target || "")}" data-role="target" />
    </div>
  `;
  card.appendChild(targetRow);
  targetRow.querySelector("[data-role=target]").addEventListener("input", (e) => (ex.target = e.target.value));

  const setsWrap = document.createElement("div");
  ex.sets.forEach((set, setIdx) => {
    const setRow = document.createElement("div");
    setRow.className = "field-row";
    setRow.innerHTML = `
      <div class="field">
        <label>Set ${setIdx + 1} — Reps/Time</label>
        <input type="text" value="${escapeAttr(set.reps)}" data-role="reps" />
      </div>
      <div class="field">
        <label>Weight/Pace</label>
        <input type="text" value="${escapeAttr(set.weight)}" data-role="weight" />
      </div>
    `;
    setRow.querySelector("[data-role=reps]").addEventListener("input", (e) => (set.reps = e.target.value));
    setRow.querySelector("[data-role=weight]").addEventListener("input", (e) => (set.weight = e.target.value));
    setsWrap.appendChild(setRow);
  });
  card.appendChild(setsWrap);

  const addSetBtn = document.createElement("button");
  addSetBtn.className = "add-set-btn";
  addSetBtn.style.marginBottom = "0";
  addSetBtn.textContent = "+ Add set";
  addSetBtn.addEventListener("click", () => {
    ex.sets.push({ reps: "", weight: "" });
    const newRow = document.createElement("div");
    newRow.className = "field-row";
    const setIdx = ex.sets.length - 1;
    newRow.innerHTML = `
      <div class="field">
        <label>Set ${setIdx + 1} — Reps/Time</label>
        <input type="text" value="" data-role="reps" />
      </div>
      <div class="field">
        <label>Weight/Pace</label>
        <input type="text" value="" data-role="weight" />
      </div>
    `;
    const set = ex.sets[setIdx];
    newRow.querySelector("[data-role=reps]").addEventListener("input", (e) => (set.reps = e.target.value));
    newRow.querySelector("[data-role=weight]").addEventListener("input", (e) => (set.weight = e.target.value));
    setsWrap.appendChild(newRow);
  });
  card.appendChild(addSetBtn);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-exercise";
  removeBtn.textContent = "Remove exercise";
  removeBtn.addEventListener("click", () => {
    const idx = entry.exercises.indexOf(ex);
    if (idx > -1) entry.exercises.splice(idx, 1);
    card.remove();
  });
  card.appendChild(removeBtn);

  return card;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

function closeModal() {
  document.getElementById("workoutModal").classList.add("hidden");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("workoutModal").addEventListener("click", (e) => {
  if (e.target.id === "workoutModal") closeModal();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    planName: PLAN?.planName,
    progress: PROGRESS,
  };

  let schema = "";
  try {
    schema = await (await fetch("PLAN_SCHEMA.md")).text();
  } catch {
    // schema fetch is best-effort; export still works without it
  }

  const text = [
    "I'm updating my training plan. Here is the plan.json schema this app expects, my current plan, and my logged progress. Please update plans/plan.json based on what I completed, my notes, and RPE.",
    "",
    "=== PLAN_SCHEMA.md ===",
    schema,
    "",
    "=== current plans/plan.json ===",
    JSON.stringify(PLAN, null, 2),
    "",
    "=== exported progress ===",
    JSON.stringify(payload, null, 2),
  ].join("\n");

  navigator.clipboard?.writeText(text).then(
    () => alert("Plan, schema, and progress copied to clipboard. Paste it to Claude to update your plan."),
    () => fallbackExport(text)
  );
  if (!navigator.clipboard) fallbackExport(text);
});

function fallbackExport(text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "workout-export.txt";
  a.click();
  URL.revokeObjectURL(url);
}

init();
