# Attendance Register

A personal, single-user attendance tracker: add subjects, record attendance per class, correct or delete past entries, and see per-subject and overall statistics. The site is static (GitHub Pages); data is stored in a Supabase (Postgres) database behind a login, so every device you sign in from sees the same records.

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

Plain HTML5, CSS3, and vanilla JavaScript (ES modules). No build step, no frameworks. The only external JS dependency is `@supabase/supabase-js`, loaded as an ES module from jsDelivr. Two Google Fonts (Lora, IBM Plex Sans, IBM Plex Mono) are loaded from a CDN for typography; everything else is self-contained.

## Project structure

```
/
├── index.html          # single page — must stay in the repo root for GitHub Pages
├── css/
│   └── style.css
├── js/
│   ├── app.js           # startup (sign-in, load data) + hash-based router
│   ├── auth.js           # sign-in screen, account box, save-failed banner
│   ├── config.js         # your Supabase Project URL + publishable key
│   ├── supabaseClient.js # creates the Supabase client
│   ├── ui.js             # all DOM rendering + event handling
│   ├── subjects.js        # subject business logic
│   ├── attendance.js      # attendance business logic
│   ├── reports.js         # centralized stats/percentage calculations
│   ├── validation.js      # shared validation rules
│   ├── constants.js       # storage keys, schema version, status registry
│   └── storage.js         # Data Access Layer — the ONLY module talking to Supabase
├── supabase/
│   └── setup.sql          # run once in the Supabase SQL Editor
├── data/
│   ├── subjects.json      # example file showing the schema (not loaded by the app)
│   └── attendance.json    # example file showing the schema (not loaded by the app)
└── README.md
```

**Layered architecture:** UI → Business Logic (subjects/attendance/reports) → Data Access Layer (storage.js) → Supabase. Every module except `storage.js` is storage-agnostic — it calls functions like `getSubjects()` or `addAttendance()` without knowing where the data lives. Moving from localStorage to Supabase only required rewriting `storage.js`.

## How data is stored

- **Supabase** is the source of truth. Tables `subjects`, `attendance` and `app_meta` are created by `supabase/setup.sql`. Row Level Security limits every signed-in user to their own rows.
- On startup, `storage.js` loads everything into memory; reads are instant, and each change is pushed to Supabase in the background (only the rows that changed). If a save fails, a red banner appears.
- Returning to the tab refreshes the data, so changes made on another device show up.
- `data/*.json` are schema examples only; the app never reads them.
- Export/Import still produce/accept the same JSON backup format.
- First run on a browser that still has data from the old localStorage version: the app offers to upload it (only if your account is empty).

### One-time Supabase setup

1. Create a free project at supabase.com.
2. SQL Editor → New query → paste `supabase/setup.sql` → Run.
3. Authentication → Users → Add user → Create new user (tick *Auto Confirm User*).
4. Authentication → sign-in settings → turn **off** "Allow new users to sign up".
5. Copy the Project URL and the **publishable** key (Connect button) into `js/config.js`. Never use the secret key here.

Free Supabase projects pause after about a week with no activity; restore them from the dashboard if that happens.

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

- Needs an internet connection; there is no offline mode.
- If two devices edit at the same moment, the last save wins.
- Only Present/Absent are built in, though the status system is designed to extend (see below).

## Possible future enhancements

- Additional statuses (Late, Excused, Cancelled) — add one entry to the `STATUSES` object in `js/constants.js`; the total/percentage math in `reports.js` already reads from that config generically, so no other file needs to change.
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
