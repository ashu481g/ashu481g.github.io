# Teleprompter Studio

Record yourself on your webcam with a virtual background while a teleprompter at
the top of the screen follows your voice. The words you've already said fade
out, and the next word is highlighted in yellow.

## Start it

You need **Google Chrome or Microsoft Edge** (voice tracking uses their built-in
speech recognition) and **Python 3**. The page has to be served from
`http://localhost`, so you can't just double-click `index.html`.

- **Windows:** double-click `start-windows.bat`
- **Mac / Linux:** run `bash start-mac-linux.sh`
- **Or by hand:** open a terminal in this folder, run `python -m http.server 8000`,
  then go to http://localhost:8000

Allow camera and microphone access when the browser asks.

## Use it

1. **Edit script**: paste what you want to say. It's saved in the browser.
2. **Start camera**, then choose a background: None, Blur, Colour, one of the
   built-in backdrops, or your own image.
3. **Record** (or press `R`). After a 3-second countdown, recording starts and
   the prompter starts listening. Just read.
4. **Stop**. The take appears under *Takes*. Click **Download** to save it
   (MP4 in recent Chrome/Edge, otherwise WebM).

If the prompter loses your place, click the word you're on, or use `←`/`→`.
Press `Home` to go back to the top and `L` to pause or resume listening.

## Good to know

- **You need internet** for two things: Chrome/Edge send the audio to their speech
  service to turn it into text, and the background engine (about 10 MB) is downloaded
  the first time you pick a background. After that the browser caches it. The recording itself never leaves your
  computer.
- The prompter forgives skipped or misheard words. If you jump ahead or go back
  to re-read a line, it finds your place again after about three words.
- Speech recognition always uses the browser's **default** microphone, even if
  you pick a different one for the recording.
- The preview is mirrored like a mirror, but the recorded video isn't, so any
  text in your background reads correctly.
- Keep this tab open and visible while recording, because browsers pause
  drawing in hidden tabs.
- Takes are kept in memory until you close the tab. Download the ones you want.

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout |
| `styles.css` | Styling |
| `app.js` | Camera, recording, controls and settings |
| `teleprompter.js` | Voice-following prompter (speech recognition and fuzzy matching) |
| `background.js` | Background blur/replacement (MediaPipe selfie segmentation) |
