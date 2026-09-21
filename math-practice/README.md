# Math Practice — Version 1

Static HTML/CSS/Vanilla JS mathematics practice application.

## Run locally
Because `data/config.json` is loaded when available, use a small static HTTP server for the full configuration path.

Python:
`python -m http.server 8080`

Then open:
`http://localhost:8080/`

The app also has built-in JavaScript defaults, so the core application does not depend on the JSON file being available.

## GitHub Pages
1. Create a repository.
2. Copy the contents of this folder into the repository root.
3. Ensure `index.html` is directly in the repository root.
4. In GitHub: Settings → Pages.
5. Select GitHub Actions or Deploy from a branch, depending on repository setup.
6. Publish the root of the selected branch.
7. Open the generated GitHub Pages URL.

## Version 1 features
- Addition, subtraction, multiplication and division.
- Independent upper/lower digit selection.
- Fixed question counts or Practice Until I Stop.
- Random problem generation with exact digit lengths.
- Non-negative subtraction.
- Whole-number division generation with no remainder.
- Multiplication/division help tables.
- Immediate answer validation and encouraging feedback.
- Session and operation-wise statistics.
- Responsive mobile/tablet/desktop layout.
- Keyboard Enter submission and visible focus states.
- Optional localStorage for last-used preferences.
- No backend, database, API or external library.


## Additional learning tabs
- **English / Hindi Comics**: three short, child-friendly comic stories with an English/Hindi switch.
- **Daily Super Car**: a date-based daily featured supercar with a locally generated stylized illustration and a short fact. The feature works offline and does not require an external image service.
