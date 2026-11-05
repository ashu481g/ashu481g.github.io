# Project Orchard dashboard (Team Hellites, IIM Lucknow)

A static site with no build step, no login and no paid services. Open `index.html` locally or host the folder as it is.

## Folder structure

```
hellites-orchard/
├── index.html                 markup only
├── css/styles.css             all styles (light and dark themes)
├── js/data.js                 ALL content and numbers; edit this file to change wording
├── js/app.js                  model calculations, charts, interactivity
└── assets/
    ├── pdf/IIML_Hellites_Orchard.pdf          ← replace with the final PDF summary
    └── cv/
        ├── Kumar_Ashwini_PGP41426_CV.pdf      ← replace with Kumar's CV
        └── Pankaj_Goswami_PGP41434_CV.pdf     ← replace with Pankaj's CV
```

The three PDFs are placeholders. Overwrite them with the real files, **keeping the same file names**, and the download buttons will work. If you rename a file, update the path in `js/data.js` (team → `cv`) or in `index.html` (summary links).

## Before submitting

1. Replace the placeholder PDFs.
2. In `js/data.js`, review the hero text, the option scores and the assumptions so they match your team's final recommendation.
3. Replace the illustrative exit multiples (scenarios → `mult`) and the discount rate (`wacc`) once you have researched benchmarks.
4. Open the live link in a private or incognito window to confirm it loads without login.
5. Check it on a phone.

## Hosting

- **Vercel:** create a project from this folder (Framework preset: Other). No build command; output directory is the root.
- **GitHub Pages:** push the folder to a repository, then Settings → Pages → deploy from branch, root folder.
- **Personal page:** upload the whole folder as a subfolder, e.g. `yoursite.com/orchard/`. All paths are relative.

## Note on CVs

A public link exposes the CVs, including phone numbers and emails, to anyone who has it. Keep the URL unlisted and consider removing the CVs after judging. Attach the CVs to the submission email as well.

## Dependencies

Chart.js 4.4.1 from cdnjs and the Google Fonts Inter and Source Serif 4, both free with no API key.
