"""Offline sample companies, shaped exactly like yfinance output.
Use tickers DEMO-STRONG, DEMO-AVERAGE or DEMO-WEAK to try the app without internet."""
import numpy as np
import pandas as pd

SCALE = 1e8  # ₹ — so 200 becomes ₹2,000 Cr

PROFILES = {
    "DEMO-STRONG": dict(name="Demo: Strong compounder", sector="Technology",
        ni=[200, 170, 145, 125, 105], rev=[1000, 880, 770, 680, 600], ebit=[300, 260, 220, 190, 160],
        equity=[800, 720, 650, 590, 540], assets=[1200, 1100, 1000, 920, 850], cur_liab=[250, 240, 220, 210, 200],
        debt=[50, 60, 70, 80, 90], ocf=[260, 220, 190, 165, 140], capex=[-60, -55, -50, -45, -40],
        pe=18, evx=12.5, trend=0.0005, vol=0.012, seed=1),
    "DEMO-AVERAGE": dict(name="Demo: Steady but slow", sector="Consumer Defensive",
        ni=[110, 100, 92, 85, 80], rev=[1000, 920, 860, 800, 760], ebit=[160, 150, 140, 130, 125],
        equity=[900, 850, 800, 760, 720], assets=[1600, 1500, 1420, 1350, 1300], cur_liab=[400, 380, 360, 350, 340],
        debt=[300, 280, 270, 260, 250], ocf=[150, 140, 130, 120, 115], capex=[-80, -75, -70, -65, -60],
        pe=26, evx=17, trend=0.0003, vol=0.012, seed=5),
    "DEMO-WEAK": dict(name="Demo: Distressed", sector="Industrials",
        ni=[-50, 10, 40, 60, 70], rev=[600, 650, 700, 720, 700], ebit=[-20, 40, 70, 90, 95],
        equity=[200, 250, 260, 240, 220], assets=[1500, 1450, 1400, 1300, 1250], cur_liab=[700, 650, 600, 550, 500],
        debt=[900, 850, 800, 700, 650], ocf=[-30, 20, 60, 80, 85], capex=[-90, -90, -80, -70, -60],
        pe=None, evx=None, trend=-0.0015, vol=0.035, seed=0),
}


def get_demo(ticker):
    p = PROFILES[ticker]
    cols = pd.to_datetime(["2025-03-31", "2024-03-31", "2023-03-31", "2022-03-31", "2021-03-31"])
    s = lambda xs: [x * SCALE for x in xs]
    fin = pd.DataFrame([s(p["ni"]), s(p["rev"]), s(p["ebit"]), s([e * 1.2 for e in p["ebit"]])],
                       index=["Net Income", "Total Revenue", "EBIT", "EBITDA"], columns=cols)
    bs = pd.DataFrame([s(p["equity"]), s(p["assets"]), s(p["cur_liab"]), s(p["debt"])],
                      index=["Stockholders Equity", "Total Assets", "Current Liabilities", "Total Debt"], columns=cols)
    cf = pd.DataFrame([s(p["ocf"]), s(p["capex"])], index=["Operating Cash Flow", "Capital Expenditure"], columns=cols)
    rng = np.random.default_rng(p["seed"])
    idx = pd.bdate_range(end=pd.Timestamp.today().normalize(), periods=1250)
    close = 100 * np.exp(np.cumsum(p["trend"] + p["vol"] * rng.standard_normal(len(idx))))
    ebitda = p["ebit"][0] * 1.2 * SCALE
    info = {"longName": p["name"], "sector": p["sector"], "currency": "INR", "exchange": "DEMO",
            "trailingPE": p["pe"], "forwardPE": p["pe"] * 0.9 if p["pe"] else None, "priceToBook": 5.0,
            "enterpriseValue": ebitda * p["evx"] if p["evx"] else 1500 * SCALE, "ebitda": ebitda,
            "marketCap": ebitda * p["evx"] * 0.95 if p["evx"] else 600 * SCALE, "currentPrice": float(close[-1])}
    return {"info": info, "financials": fin, "balance_sheet": bs, "cashflow": cf,
            "history": pd.DataFrame({"Close": close}, index=idx)}
