# Attendance Register

A personal, single-user attendance tracker: add subjects, record attendance per class, correct or delete past entries, and see per-subject and overall statistics. Built as a static site for GitHub Pages — no backend, no database, no login.

## What it does

- Add, edit, and delete subjects (with duplicate-name/code prevention).
- Record attendance (Present/Absent) for a subject and date, with optional remarks.
- Detects duplicate subject+date entries and offers to edit the existing record instead of creating a second one.
- Edit or delete any past attendance record — date, status, and remarks are all correctable.
- Per-subject report: total classes, present, absent, attendance %, and the full chronological history.
- Dashboard with an overall summary and a subject-wise table (click a row to jump to that subject's report).
- Export all data as a single JSON backup file, and import it back in (with validation).
- Reset all data, with a two-step confirmation.

## Technology

Plain HTML5, CSS3, and vanilla JavaScript (ES modules). No build step, no frameworks, no external JS dependencies. Two Google Fonts (Lora, IBM Plex Sans, IBM Plex Mono) are loaded from a CDN for typography; everything else is self-contained.

## Project structure

```
/
├── index.html          # single page — must stay in the repo root for GitHub Pages
├── css/
│   └── style.css
├── js/
│   ├── app.js           # bootstraps the app, hash-based router
│   ├── ui.js             # all DOM rendering + event handling
│   ├── subjects.js        # subject business logic
│   ├── attendance.js      # attendance business logic
│   ├── reports.js         # centralized stats/percentage calculations
│   ├── validation.js      # shared validation rules
│   ├── constants.js       # storage keys, schema version, status registry
│   └── storage.js         # Data Access Layer — the ONLY module touching localStorage
├── data/
│   ├── subjects.json      # example file showing the schema (not loaded by the app)
│   └── attendance.json    # example file showing the schema (not loaded by the app)
└── README.md
```

**Layered architecture:** UI → Business Logic (subjects/attendance/reports) → Data Access Layer (storage.js) → localStorage. Every module except `storage.js` is storage-agnostic — it calls functions like `getSubjects()` or `addAttendance()` without knowing they're backed by `localStorage`. If you ever add a real backend, you only need to rewrite `storage.js`; the UI and business-logic layers stay the same.

## How data is stored — and why JSON files can't be written directly

GitHub Pages serves static files only; there is no server process to write to files in the repository. A browser has no access to your GitHub repo's filesystem, so `data/subjects.json` and `data/attendance.json` **cannot** be updated live by the app — those two files in this repo are schema references only, showing you the shape of the data, not the live data itself.

Instead:
- **localStorage** (scoped to your browser + this site's origin) is the live, working data store. Every add/edit/delete happens there automatically.
- **JSON** is used as the *portability format*, via the Export/Import feature in Data Management. Export downloads a single backup file (`attendance-backup-YYYY-MM-DD.json`) containing both your subjects and attendance records; Import reads a backup file back in.

**Practical implication:** your data lives in *one browser on one device*. It will not appear if you open the site in a different browser, a different computer, or an incognito window — and it can be lost if you clear that browser's site data. Export a backup periodically, and definitely before clearing browser data or switching devices. The Data Management page shows when you last exported.

It is technically possible to write to repository files via the GitHub API from client-side JS, but that requires embedding or entering an auth token in a public static site, which is a real security concern — this is intentionally left as a future enhancement rather than part of this MVP.

## Running locally

Because the app uses ES modules (`<script type="module">`), opening `index.html` directly from disk (`file://...`) will fail in most browsers due to module CORS restrictions. Serve it over `http://` instead:

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any other static file server (e.g. `npx serve`, VS Code's "Live Server" extension) works the same way.

## Deploying to GitHub Pages

```bash
# from the project root
git init
git add .
git commit -m "Initial commit: attendance register"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `/root`**. GitHub will publish it at `https://<your-username>.github.io/<your-repo>/` within a minute or two. Because `index.html` is in the repo root, no further configuration is needed.

## Exporting and importing data

- **Export** (Data Management → Export backup): downloads one JSON file with every subject and attendance record.
- **Import** (Data Management → choose file → Import backup): validates the file's structure first (rejects anything that isn't a recognizable backup) and, if valid, asks you to confirm before **replacing** all current data.

## Known limitations

- Single browser/device only — see the storage explanation above.
- No login or multi-user support (by design — this is a personal tool).
- No automatic sync or cloud backup; you are responsible for exporting backups.
- Only Present/Absent are built in, though the status system is designed to extend (see below).

## Possible future enhancements

- Additional statuses (Late, Excused, Cancelled) — add one entry to the `STATUSES` object in `js/constants.js`; the total/percentage math in `reports.js` already reads from that config generically, so no other file needs to change.
- A real backend (REST API + database) — only `js/storage.js` would need to be rewritten; every other module already talks to it through function calls, not localStorage directly.
- GitHub API–based persistence, so Export/Import isn't needed for day-to-day use (left out of the MVP due to the token-management/security concerns noted above).
- Calendar-view attendance entry, CSV export, or per-week/per-month breakdowns.

## Test checklist

- [ ] Add a subject
- [ ] Add a duplicate subject (by name, and separately by code) — rejected
- [ ] Edit a subject
- [ ] Delete a subject with no attendance records — simple confirmation
- [ ] Delete a subject with attendance records — warning mentions record count, records are removed too
- [ ] Record attendance for a subject/date
- [ ] Record attendance again for the same subject/date — duplicate dialog appears, "Edit existing record" opens it
- [ ] Edit an attendance record's date
- [ ] Edit an attendance record's status
- [ ] Edit an attendance record's date into another existing record's date — rejected with a message
- [ ] Delete an attendance record — confirmation required
- [ ] Attendance percentage matches (Present ÷ Total × 100, one decimal place)
- [ ] Dashboard totals match the sum across subjects
- [ ] Export downloads a backup JSON file
- [ ] Import a valid backup — data is replaced after confirmation
- [ ] Import an invalid/malformed JSON file — rejected with a clear message, current data untouched
- [ ] Reset all data — requires two confirmations, then clears everything
- [ ] Refresh the browser — data persists (localStorage)
- [ ] Deploy to GitHub Pages and confirm the live URL works the same way
