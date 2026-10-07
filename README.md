# ashu481g.github.io

Personal website of Kumar Ashwini, hosted on GitHub Pages at **https://ashu481g.github.io/**.

The home page is a portfolio. Alongside it live several small tools, each in its own folder, that the portfolio links to under "Tools I made for everyday use".

| Page | Address | Folder |
|---|---|---|
| Portfolio (home) | `/` | repository root + `assets/` |
| Calendar hub | `/calendar/` | `calendar/` |
| Driving test quiz | `/driving-quiz/` | `driving-quiz/` |
| Math practice | `/math-practice/` | `math-practice/` |
| Revision portal | `/revision-portal/` | `revision-portal/` |
| Daily yoga player | `/yoga/` | `yoga/` |

CampusPulse is hosted separately on Vercel and is only linked from the portfolio.

---

## Folder structure

```
ashu481g.github.io/
├── index.html                 Portfolio page (markup only)
├── README.md                  This guide
├── assets/                    Files used only by the portfolio
│   ├── css/portfolio.css
│   ├── js/portfolio.js
│   └── img/kapp.jpg           Passport photo
│
├── calendar/                  Calendar hub (Google Calendar free/busy)
│   ├── index.html
│   ├── style.css
│   └── app.js                 Settings (API key, calendar ID) at the top
│
├── driving-quiz/              Driving licence practice quiz
│   ├── index.html
│   ├── style.css
│   ├── app.js                 Quiz logic
│   ├── questions.js           Question bank (405 questions)
│   └── img/                   Road-sign images used by questions (q080.png …)
│
├── math-practice/             Arithmetic practice app for kids
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── data/config.json       Digit and question-count options
│   └── README.md              App-specific notes
│
├── revision-portal/           MBA end-term revision portal
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── data/subjects.json     Subjects, modules, videos, overlaps
│   └── README.md              App-specific notes
│
├── yoga/                      Daily Habuild yoga class player
│   ├── index.html
│   ├── style.css
│   ├── app.js                 Player logic
│   ├── data.js                Weekly videos, breathing tracks, books (Drive IDs)
│   └── audio/                 Local copies of audio tracks (for repeat playback)
│
├── tiles/                     Old addresses → redirect to the new folders
└── revision_portal/           Old address → redirects to /revision-portal/
```

---

## House rules

These keep every page easy to find and change.

1. **One folder per page.** Every page lives in its own folder with an `index.html`, so its address is short: `/yoga/`, not `/tiles/yoga-index.html`.
2. **Three kinds of file, kept apart.**
   - `index.html` holds markup only: no `<style>` blocks, no `style="…"` attributes, no inline `<script>` code and no `onclick="…"` attributes.
   - `style.css` holds all styling.
   - `app.js` holds all behaviour.
3. **Content goes in a data file, not in the logic.** Anything you are likely to edit (questions, videos, subjects, options) lives in `questions.js`, `data.js` or `data/*.json`. Changing content should never require touching `app.js`.
4. **Names are lowercase with hyphens:** `driving-quiz`, `style.css`, `q080.png`. No spaces or capitals; GitHub Pages addresses are case-sensitive.
5. **No version numbers in file names.** Use Git history instead of `app-v7.js` and `style-v6.css`. To force browsers to fetch a fresh copy after a change, see "Browser cache" below.
6. **Links between pages are relative or start at the site root,** for example `href="yoga/"` from the home page.

---

## Common tasks

### Edit the portfolio text
Open `index.html`. Each section is a `<section>` with an `id`, matching the menu on the left:
`about`, `built`, `tools`, `analysis`, `experience`, `contact`.

- **Add a project** to "Things I've built" or "Research and analysis": copy an existing `<li>…</li>` block inside `<ul class="work">` and edit it.
- **Add a tool** to "Tools I made for everyday use": copy an `<li>` inside `<ul class="tools">`.
- **Add a new section:** add a `<section class="block" id="new-id">` in `index.html`, then add a matching `<li><a href="#new-id">…</a></li>` to the `<nav class="side">` menu. The highlighting picks it up automatically.

### Change contact details
Open `assets/js/portfolio.js` and edit the `CONTACT` block near the top (emails, phone, LinkedIn, WhatsApp message). The details are kept in the script, not the page text, so that they stay hidden until a visitor clicks and are harder for spam bots to collect.

### Change the photo
Replace `assets/img/kapp.jpg`, keeping the same name. Passport proportions (35 × 45 mm) and a file under 500 KB work best. If the file is missing, the page simply hides the photo frame.

### Yoga player: change videos, audio or books
Edit `yoga/data.js` only.
- `SESSIONS`: one class per weekday, in order Sunday → Saturday. `id` is the Google Drive file ID from the share link `drive.google.com/file/d/<ID>/view`.
- `BREATHING` and `PDFS`: paste the output of the Google Apps Script over these lists.
- For an audio track to repeat 15 or 30 times reliably, also upload the audio file to `yoga/audio/` with **exactly** the same file name as in `BREATHING`.
- Every Drive file must be shared as "Anyone with the link".

### Driving quiz: add or fix a question
Edit `driving-quiz/questions.js`. Each line is one question:
```js
{"q": "406", "question": "…", "options": ["A", "B", "C"], "answer": 1, "img": null},
```
- `answer` is the position of the correct option, counting from 0.
- For a sign image, put a PNG in `driving-quiz/img/` (for example `q406.png`) and set `"img": "img/q406.png"`.
- The quiz always uses 3 options and picks 20 random questions per round (set in `app.js`, function `buildQuiz`).

### Revision portal: add a subject
Add an entry to `revision-portal/data/subjects.json`. The structure is described in `revision-portal/README.md`. Progress is stored in the visitor's own browser, so changing the file doesn't erase anyone's progress.

### Math practice: change options
Edit `math-practice/data/config.json` (digits per operation, question counts, table size).

### Calendar hub
Settings are at the top of `calendar/app.js` (`CLIENT_ID`, `API_KEY`, `CALENDAR_ID`, `OWNER_EMAIL`).
The page relies on three settings outside this repository; check them if the calendar stops working:
1. **Google Calendar** (pgp41426@iiml.ac.in) → Settings → *Access permissions for events* → "Make available to public" with **See only free/busy (hide details)**.
2. **Google Cloud Console** → Credentials → the API key is restricted to `https://ashu481g.github.io/*` and to the Google Calendar API only.
3. **Google Cloud Console** → OAuth client → *Authorised JavaScript origins* includes `https://ashu481g.github.io`.

The API key appears in the page source by design. That's normal for browser apps; the restrictions above are what protect it.

---

## Adding a new tool

1. Create a folder with a lowercase, hyphenated name, for example `budget-tracker/`.
2. Add the three files below.
3. Add a tile for it in `index.html` → `<ul class="tools">`, linking to `budget-tracker/`.
4. Test locally (next section), then commit and push.

`budget-tracker/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Budget Tracker</title>
  <link rel="stylesheet" href="style.css">
  <script src="app.js" defer></script>
</head>
<body>
  <main>
    <h1>Budget Tracker</h1>
    <!-- markup only -->
  </main>
</body>
</html>
```
`budget-tracker/style.css` holds the styles; `budget-tracker/app.js` holds the code. If the tool has editable content, add `data.js` (loaded before `app.js`) or `data/*.json` (loaded with `fetch`).

---

## Testing on your computer

Some pages load data with `fetch()`, which browsers block when a file is opened directly (`file://…`). Run a small local web server from the **repository root** instead:

```bash
python -m http.server 8080
```

Then open:
- http://localhost:8080/ (portfolio)
- http://localhost:8080/driving-quiz/
- http://localhost:8080/math-practice/
- http://localhost:8080/revision-portal/
- http://localhost:8080/yoga/
- http://localhost:8080/calendar/ (the public timeline only works on the live site, because the API key is restricted to ashu481g.github.io)

Press `Ctrl + C` in the terminal to stop the server.

---

## Publishing

1. Commit and push to the `main` branch (or upload files on github.com → *Add file* → *Upload files*).
2. GitHub rebuilds the site in about a minute. Progress shows under the repository's **Actions** tab.
3. Open the page and press `Ctrl + Shift + R` to bypass the browser cache.

### Browser cache
GitHub Pages lets browsers keep CSS and JS files for up to 10 minutes. If a change doesn't show up for visitors, add or bump a version tag on the link in that page's `index.html`:
```html
<link rel="stylesheet" href="style.css?v=2">
<script src="app.js?v=2" defer></script>
```
Increase the number whenever you want everyone to get the new file immediately. The file name itself stays the same.

---

## Old addresses

Before this reorganisation, some pages lived at other addresses. Small redirect pages keep old links and bookmarks working:

| Old address | Now |
|---|---|
| `/tiles/Calendar.html`, `/tiles/Google Calendar.html` | `/calendar/` |
| `/tiles/DrivingQuiz.html`, `/tiles/Driving Test.html` | `/driving-quiz/` |
| `/tiles/yoga-index.html` | `/yoga/` |
| `/revision_portal/index.html` | `/revision-portal/` |

Once you no longer need the old links, delete the `tiles/` and `revision_portal/` folders.

---

## Checklist before pushing

- [ ] Page works through the local server with no red errors in the browser console (F12 → Console).
- [ ] No inline styles or scripts were added to any `index.html`.
- [ ] New files and folders use lowercase-hyphen names.
- [ ] Any new tool has a tile on the portfolio.
- [ ] Checked once on a phone-sized window (F12 → device toolbar).
