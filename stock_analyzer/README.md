# Stock Analyzer (web)

Type a ticker, get every calculation step by step and a Buy / Watch / Reject verdict.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```
Open http://127.0.0.1:8000

## Deploy to Vercel (free Hobby plan)

1. Create a GitHub repository and push this folder to it (the files must be at the repo root).
2. On vercel.com: Add New → Project → import the repository → Deploy. No settings to change;
   Vercel detects FastAPI from `requirements.txt` and `app.py`.
3. Open the URL Vercel gives you, e.g. https://stock-analyzer-xyz.vercel.app

Or from the command line: `npm i -g vercel`, then `vercel` (preview) and `vercel --prod`.

How it runs on Vercel: `app.py` becomes one Python serverless function (the `/api/...` routes), and
`public/` (HTML, CSS, JS) is served from Vercel's CDN. `vercel.json` allows each analysis up to 60 s.
Results are cached at the CDN for 15 minutes per ticker.

Note: Yahoo Finance sometimes rate-limits requests coming from cloud servers. If that happens the
page shows a "Yahoo Finance is limiting requests" message; wait a few minutes and try again. The
offline samples (DEMO-STRONG, DEMO-AVERAGE, DEMO-WEAK) always work.

Tickers: NSE `TCS.NS`, BSE `500325.BO`, US `AAPL`.
