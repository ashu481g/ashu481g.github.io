"""
Stock Analyzer web app.
Local:   uvicorn app:app --reload      then open http://127.0.0.1:8000
Vercel:  push to GitHub and import the repo (see README). Files in public/ are served by Vercel's CDN.
"""
import os
import re
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles

import engine
from demo import PROFILES, get_demo
from exporter import to_excel

app = FastAPI(title="Stock Analyzer")
_cache = {}
CACHE_SECONDS = 15 * 60
TICKER_RE = re.compile(r"^[A-Z0-9.\-^&=]{1,20}$")


def run(ticker: str):
    ticker = ticker.strip().upper()
    if not TICKER_RE.match(ticker):
        raise HTTPException(400, "Enter a ticker symbol such as TCS.NS or AAPL.")
    hit = _cache.get(ticker)
    if hit and time.time() - hit[0] < CACHE_SECONDS:
        return hit[1]
    try:
        data = get_demo(ticker) if ticker in PROFILES else engine.fetch(ticker)
    except LookupError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        if "RateLimit" in type(e).__name__ or "Too Many Requests" in str(e):
            raise HTTPException(429, "Yahoo Finance is limiting requests from this server right now. "
                                     "Wait a few minutes and try again.")
        raise HTTPException(502, f"Couldn't reach Yahoo Finance ({type(e).__name__}). "
                                 "Check your internet connection or try again in a minute.")
    result = engine.clean(engine.analyze(ticker, data))
    _cache[ticker] = (time.time(), result)
    return result


# Let Vercel's CDN cache each ticker's result for 15 minutes, so repeat visits
# don't call Yahoo again (in-memory caches don't survive between serverless instances).
CDN_CACHE = {"Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600"}


@app.get("/api/analyze")
def analyze(ticker: str = Query(...)):
    return JSONResponse(run(ticker), headers=CDN_CACHE)


@app.get("/api/export")
def export(ticker: str = Query(...)):
    a = run(ticker)
    return Response(to_excel(a),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{a["ticker"]}_analysis.xlsx"', **CDN_CACHE})


# On Vercel the public/ folder is served by the CDN automatically and must not be mounted.
# Locally, FastAPI serves it.
if not os.environ.get("VERCEL"):
    app.mount("/", StaticFiles(directory=Path(__file__).parent / "public", html=True), name="public")
