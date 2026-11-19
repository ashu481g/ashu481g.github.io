# Drive PDF Reader

Browse your Google Drive on your Android tablet and read PDFs inside the page.

Files: `index.html` (markup), `style.css` (styles), `app.js` (logic + settings).

## One-time setup (about 10 minutes)

1. **Host the three files** on any HTTPS site, for example Vercel or GitHub Pages.
   Note the address, e.g. `https://drive-pdf-reader.vercel.app`.
2. Open **Google Cloud Console** → create or choose a project.
3. **APIs & Services → Library** → enable **Google Drive API**.
4. **APIs & Services → OAuth consent screen** → User type *External* →
   fill in the app name and your email → add scope
   `.../auth/drive.readonly` → under **Test users** add your Gmail address.
5. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   → type *Web application* → under **Authorized JavaScript origins** add your
   site address (no trailing slash). Add `http://localhost:8000` too if you
   want to test on a computer.
6. Copy the **Client ID** and paste it into `CLIENT_ID` at the top of `app.js`.
   Redeploy.

## Using it on the tablet

- Open the site in Chrome → menu ⋮ → **Add to Home screen** so it opens like an app.
- Sign in once. Google shows a "Google hasn't verified this app" warning because
  this is your own private app: tap **Continue**.
- Tabs: **My Drive**, **Shared with me**, **Recent**. Search finds PDFs and folders by name.
- Viewer: pinch or −/+ to zoom, **Fit** for page width, type a page number to jump,
  ☾ for night mode, ⛶ for full screen, ↗ to open the file in Google Drive.
- The Android back gesture goes back a folder or closes the PDF.
- It remembers the last folder, the last PDF and the page you were on.

## Notes

- The sign-in lasts about an hour. After that, a **Reconnect** button appears.
- Access is read-only; the page never changes anything in your Drive.
- PDFs are downloaded to the tablet's memory to display, so very large files
  (100 MB+) may be slow.
