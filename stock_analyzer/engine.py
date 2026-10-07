"""
Stock analysis engine.

Same rules as the corrected command-line analyzer, but every calculation is
recorded as a step (formula -> inputs -> result -> rule -> points) so the web
page can show the full working.
"""
import math
import numpy as np
import pandas as pd

MAX_SCORE = 85          # sum of all positive points
BUY_AT, WATCH_AT = 75, 60

# Yahoo has renamed rows over time; try each name in order.
LABELS = {
    "net_income":  ("financials",    ["Net Income", "Net Income Common Stockholders"]),
    "revenue":     ("financials",    ["Total Revenue", "Operating Revenue"]),
    "ebit":        ("financials",    ["EBIT", "Ebit", "Operating Income"]),
    "equity":      ("balance_sheet", ["Stockholders Equity", "Total Stockholder Equity", "Common Stock Equity"]),
    "assets":      ("balance_sheet", ["Total Assets"]),
    "cur_liab":    ("balance_sheet", ["Current Liabilities", "Total Current Liabilities"]),
    "debt":        ("balance_sheet", ["Total Debt"]),
    "ocf":         ("cashflow",      ["Operating Cash Flow", "Total Cash From Operating Activities"]),
    "capex":       ("cashflow",      ["Capital Expenditure", "Capital Expenditures"]),
}
FRIENDLY = {
    "net_income": "Net income", "revenue": "Revenue", "ebit": "EBIT", "equity": "Shareholders' equity",
    "assets": "Total assets", "cur_liab": "Current liabilities", "debt": "Total debt",
    "ocf": "Operating cash flow", "capex": "Capital expenditure",
}


# ----------------------------------------------------------------- helpers
def num(x):
    try:
        x = float(x)
        return None if math.isnan(x) or math.isinf(x) else x
    except (TypeError, ValueError):
        return None


def div(a, b):
    return a / b if a is not None and b not in (None, 0) else None


def pct(x, d=1):
    return "n/a" if x is None else f"{x * 100:.{d}f}%".replace("-", "−")


def fx(x, d=2):
    return "n/a" if x is None else f"{x:,.{d}f}".replace("-", "−")


def period(ts):
    try:
        return pd.Timestamp(ts).strftime("%b %Y")
    except Exception:
        return str(ts)


class Money:
    """Compact money formatting: crores for INR, millions/billions otherwise."""
    SYMBOLS = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}

    def __init__(self, currency):
        self.cur = (currency or "").upper()
        self.sym = self.SYMBOLS.get(self.cur, (self.cur + " ") if self.cur else "")

    def __call__(self, x):
        if x is None:
            return "n/a"
        sign = "−" if x < 0 else ""
        a = abs(x)
        if self.cur == "INR":
            cr = a / 1e7
            body = f"{cr:,.0f} Cr" if cr >= 100 else f"{cr:,.2f} Cr"
        elif a >= 1e12:
            body = f"{a / 1e12:,.2f}T"
        elif a >= 1e9:
            body = f"{a / 1e9:,.2f}B"
        elif a >= 1e6:
            body = f"{a / 1e6:,.1f}M"
        else:
            body = f"{a:,.0f}"
        return f"{sign}{self.sym}{body}"


def find_row(data, key):
    table, names = LABELS[key]
    df = data.get(table)
    if df is None or getattr(df, "empty", True):
        return None, None
    for n in names:
        if n in df.index:
            s = pd.to_numeric(df.loc[n], errors="coerce").dropna()
            if isinstance(s, pd.DataFrame):          # duplicate labels
                s = s.iloc[0]
            if len(s):
                s = s.sort_index(ascending=False)    # newest first
                return n, s
    return None, None


def latest(data, key):
    label, s = find_row(data, key)
    if s is None:
        return {"key": key, "value": None, "period": None, "label": None}
    return {"key": key, "value": float(s.iloc[0]), "period": period(s.index[0]), "label": label}


def item(label, display, *, value=None, formula=None, working=None, rule=None,
         outcome="info", points=None, note=None):
    return {"label": label, "value": value, "display": display, "formula": formula,
            "working": working, "rule": rule, "outcome": outcome, "points": points, "note": note}


def reward(value, op, threshold):
    """Rule that adds points. Returns pass / fail / na."""
    if value is None:
        return "na"
    return "pass" if (value > threshold if op == ">" else value < threshold) else "fail"


def scored(it, value, op, threshold, pts):
    oc = reward(value, op, threshold)
    it["outcome"] = oc
    it["points"] = pts if oc == "pass" else 0
    if oc == "na":
        it["note"] = "Missing or not meaningful, so no points awarded."
    return it


def penalty(it, value, triggered, pts):
    if value is None:
        it.update(outcome="na", points=0, note="Missing, so no penalty applied.")
    else:
        it.update(outcome="fail" if triggered else "pass", points=-pts if triggered else 0)
    return it


def step(sid, title, intro, items, notes=None, extra=None):
    pts = [i["points"] for i in items if i.get("points") is not None]
    return {"id": sid, "title": title, "intro": intro, "items": items,
            "points": sum(pts), "possible": sum(i.get("possible", 0) for i in items),
            "notes": notes or [], "extra": extra}


# ----------------------------------------------------------------- analysis
def analyze(ticker, data):
    info = data.get("info") or {}
    money = Money(info.get("currency") or info.get("financialCurrency"))
    sector = info.get("sector") or ""
    is_financial = "financial" in sector.lower() or "bank" in (info.get("industry") or "").lower()
    L = {k: latest(data, k) for k in LABELS}
    v = {k: L[k]["value"] for k in L}
    steps = []

    # ---- Step 1: inputs
    found, missing = [], []
    for k, rec in L.items():
        if rec["value"] is None:
            missing.append(FRIENDLY[k])
        else:
            found.append(item(FRIENDLY[k], money(rec["value"]), value=rec["value"],
                              note=f"Yahoo row “{rec['label']}”, period ending {rec['period']}."))
    hist = data.get("history")
    close = hist["Close"].dropna() if hist is not None and len(hist) else pd.Series(dtype=float)
    price_note = (f"{len(close):,} daily closes from {close.index[0]:%d %b %Y} to {close.index[-1]:%d %b %Y}."
                  if len(close) else "No price history returned.")
    notes = [price_note]
    if missing:
        notes.append("Not reported by Yahoo for this company: " + ", ".join(missing) +
                     ". Calculations that need these will show n/a and earn no points.")
    steps.append(step("inputs", "Collect the raw figures",
                      "Latest annual figures pulled from the income statement, balance sheet and cash flow statement.",
                      found, notes))

    # ---- Step 2: profitability
    roe = div(v["net_income"], v["equity"])
    roa = div(v["net_income"], v["assets"])
    cap_emp = v["assets"] - v["cur_liab"] if v["assets"] is not None and v["cur_liab"] is not None else None
    roce = div(v["ebit"], cap_emp)
    nm = div(v["net_income"], v["revenue"])
    om = div(v["ebit"], v["revenue"])
    it_roe = item("Return on equity (ROE)", pct(roe), value=roe, formula="Net income ÷ Shareholders' equity",
                  working=f"{money(v['net_income'])} ÷ {money(v['equity'])} = {pct(roe)}",
                  rule="Above 15% earns 10 points")
    it_roe["possible"] = 10
    it_roce = item("Return on capital employed (ROCE)", pct(roce), value=roce,
                   formula="EBIT ÷ (Total assets − Current liabilities)",
                   working=(f"{money(v['ebit'])} ÷ ({money(v['assets'])} − {money(v['cur_liab'])}) "
                            f"= {money(v['ebit'])} ÷ {money(cap_emp)} = {pct(roce)}"),
                   rule="Above 15% earns 10 points")
    it_roce["possible"] = 10
    steps.append(step("profitability", "Measure profitability",
                      "How much profit the business earns on the money invested in it.",
                      [scored(it_roe, roe, ">", 0.15, 10), scored(it_roce, roce, ">", 0.15, 10),
                       item("Return on assets (ROA)", pct(roa), value=roa, formula="Net income ÷ Total assets",
                            working=f"{money(v['net_income'])} ÷ {money(v['assets'])} = {pct(roa)}"),
                       item("Net profit margin", pct(nm), value=nm, formula="Net income ÷ Revenue",
                            working=f"{money(v['net_income'])} ÷ {money(v['revenue'])} = {pct(nm)}"),
                       item("Operating margin", pct(om), value=om, formula="EBIT ÷ Revenue",
                            working=f"{money(v['ebit'])} ÷ {money(v['revenue'])} = {pct(om)}")],
                      ["Banks usually don't report current liabilities, so ROCE is n/a for them."] if is_financial else None))

    # ---- Step 3: balance sheet & cash
    de = div(v["debt"], v["equity"])
    fcf = v["ocf"] + v["capex"] if v["ocf"] is not None and v["capex"] is not None else None
    it_de = item("Debt to equity", fx(de), value=de, formula="Total debt ÷ Shareholders' equity",
                 working=f"{money(v['debt'])} ÷ {money(v['equity'])} = {fx(de)}", rule="Below 1.0 earns 10 points")
    it_de["possible"] = 10
    it_fcf = item("Free cash flow", money(fcf), value=fcf, formula="Operating cash flow + Capital expenditure (capex is negative)",
                  working=f"{money(v['ocf'])} + ({money(v['capex'])}) = {money(fcf)}", rule="Positive earns 10 points")
    it_fcf["possible"] = 10
    steps.append(step("stability", "Check debt and cash generation",
                      "Whether the company can carry its debt and produces cash after investing in the business.",
                      [scored(it_de, de, "<", 1.0, 10), scored(it_fcf, fcf, ">", 0, 10)],
                      ["For banks and NBFCs, borrowing is the raw material of the business, so debt to equity "
                       "is not a fair test and usually fails."] if is_financial else None))

    # ---- Step 4: growth
    def cagr_item(key, name, pts):
        _, s = find_row(data, key)
        it = item(f"{name} CAGR", "n/a", formula="(Latest ÷ Earliest)^(1 ÷ years) − 1",
                  rule=f"Above 10% earns {pts} points")
        it["possible"] = pts
        val = None
        if s is None or len(s) < 3:
            it["working"] = "Fewer than 3 annual figures available."
        else:
            start, end = float(s.iloc[-1]), float(s.iloc[0])
            years = (s.index[0] - s.index[-1]).days / 365.25
            series = [{"period": period(i), "value": float(x), "display": money(float(x))} for i, x in s.sort_index().items()]
            it["series"] = series
            if start <= 0 or end <= 0:
                it["working"] = (f"Earliest {money(start)} ({period(s.index[-1])}), latest {money(end)} "
                                 f"({period(s.index[0])}). CAGR is undefined when either figure is zero or a loss.")
            else:
                val = (end / start) ** (1 / years) - 1
                it["working"] = (f"({money(end)} ÷ {money(start)})^(1 ÷ {years:.1f}) − 1 = {pct(val)}  "
                                 f"[{period(s.index[-1])} to {period(s.index[0])}]")
        it["value"], it["display"] = val, pct(val)
        return scored(it, val, ">", 0.10, pts), val

    it_rg, rev_cagr = cagr_item("revenue", "Revenue", 12)
    it_pg, prof_cagr = cagr_item("net_income", "Profit", 13)
    steps.append(step("growth", "Measure growth",
                      "Compound annual growth over the years Yahoo provides (usually 4 annual reports).",
                      [it_rg, it_pg]))

    # ---- Step 5: valuation
    pe = num(info.get("trailingPE"))
    ev, ebitda = num(info.get("enterpriseValue")), num(info.get("ebitda"))
    ev_ebitda = div(ev, ebitda) if ebitda and ebitda > 0 else None
    it_pe = item("Price to earnings (P/E)", fx(pe, 1), value=pe, formula="Share price ÷ Earnings per share (trailing 12 months)",
                 working=f"Reported by Yahoo: {fx(pe, 1)}" if pe else "Not reported (often because earnings are negative).",
                 rule="Below 25 earns 10 points")
    it_pe["possible"] = 10
    it_ev = item("EV / EBITDA", fx(ev_ebitda, 1), value=ev_ebitda, formula="Enterprise value ÷ EBITDA",
                 working=(f"{money(ev)} ÷ {money(ebitda)} = {fx(ev_ebitda, 1)}" if ev_ebitda is not None else
                          f"EBITDA is {money(ebitda)}, so the ratio isn't meaningful." if ebitda is not None and ebitda <= 0 else
                          "Enterprise value or EBITDA not reported."),
                 rule="Below 20 earns 10 points")
    it_ev["possible"] = 10
    ey = div(1, pe)
    steps.append(step("valuation", "Check the price you pay",
                      "Whether the share price looks reasonable relative to earnings and operating profit.",
                      [scored(it_pe, pe, "<", 25, 10), scored(it_ev, ev_ebitda, "<", 20, 10),
                       item("Forward P/E", fx(num(info.get("forwardPE")), 1), value=num(info.get("forwardPE")),
                            formula="Share price ÷ Expected EPS for next year"),
                       item("Price to book (P/B)", fx(num(info.get("priceToBook"))), value=num(info.get("priceToBook"))),
                       item("Earnings yield", pct(ey), value=ey, formula="1 ÷ P/E", working=f"1 ÷ {fx(pe, 1)} = {pct(ey)}" if pe else None),
                       item("Market capitalisation", money(num(info.get("marketCap"))), value=num(info.get("marketCap")))],
                      ["Banks don't report EBITDA, so EV / EBITDA is n/a for them."] if is_financial else None))

    # ---- Step 6: price risk
    vol = dd = last = dma = above = None
    peak_d = trough_d = None
    chart = []
    if len(close) > 1:
        rets = close.pct_change().dropna()
        vol = float(np.std(rets) * np.sqrt(252))
        cum = (1 + rets).cumprod()
        draw = (cum - cum.cummax()) / cum.cummax()
        dd = float(draw.min())
        trough_d = draw.idxmin()
        peak_d = cum.loc[:trough_d].idxmax()
        last = float(close.iloc[-1])
        ma = close.rolling(200).mean()
        dma = num(ma.iloc[-1])
        above = None if dma is None else bool(last > dma)
        weekly = pd.DataFrame({"c": close, "m": ma}).resample("W").last().dropna(subset=["c"])
        chart = [{"d": i.strftime("%Y-%m-%d"), "c": round(float(r.c), 2), "m": num(r.m)} for i, r in weekly.iterrows()]
    it_vol = item("Annualised volatility", pct(vol), value=vol, formula="Std. dev. of daily returns × √252",
                  working=f"σ(daily) {pct(vol / math.sqrt(252) if vol else None, 2)} × 15.87 = {pct(vol)}" if vol else None,
                  rule="Above 50% costs 5 points")
    it_dd = item("Maximum drawdown", pct(dd), value=dd, formula="Largest fall from a previous peak (5 years)",
                 working=(f"Peak on {peak_d:%d %b %Y}, low on {trough_d:%d %b %Y}: {pct(dd)}" if dd is not None else None),
                 rule="Worse than −50% costs 5 points")
    it_ma = item("Price vs 200-day average", "Above" if above else ("Below" if above is False else "n/a"),
                 value=above, formula="Last close compared with the average of the last 200 closes",
                 working=f"Last close {fx(last)} vs 200-day average {fx(dma)}" if dma else "Fewer than 200 days of prices.",
                 rule="Below the average costs 5 points")
    for it in (it_vol, it_dd, it_ma):
        it["possible"] = 0
    steps.append(step("risk", "Assess price risk",
                      "How bumpy the share price has been, and whether it is currently trending down.",
                      [penalty(it_vol, vol, vol is not None and vol > 0.5, 5),
                       penalty(it_dd, dd, dd is not None and dd < -0.5, 5),
                       penalty(it_ma, above, above is False, 5)],
                      extra={"chart": chart, "currency": money.sym}))

    # ---- Step 7: quality (information only)
    _, ni_s = find_row(data, "net_income")
    _, eq_s = find_row(data, "equity")
    roe_rows, cv = [], None
    if ni_s is not None and eq_s is not None:
        common = ni_s.index.intersection(eq_s.index).sort_values()
        roes = [float(ni_s[c] / eq_s[c]) for c in common if eq_s[c]]
        roe_rows = [{"period": period(c), "value": r, "display": pct(r)} for c, r in zip(common, roes)]
        if len(roes) >= 3 and np.mean(roes) > 0:
            cv = float(np.std(roes) / np.mean(roes))
    it_q = item("ROE consistency (coefficient of variation)", fx(cv), value=cv,
                formula="Std. dev. of yearly ROE ÷ Average ROE",
                working=("Yearly ROE: " + ", ".join(f"{r['period']} {r['display']}" for r in roe_rows)) if roe_rows else "Not enough years.",
                note=("Below 0.3 suggests a stable business." if cv is not None else None))
    it_q["series"] = roe_rows
    it_q["outcome"] = "info" if cv is None else ("pass" if cv < 0.3 else "fail")
    steps.append(step("quality", "Check consistency of returns",
                      "Shown for context. Like the original program, this does not change the score.", [it_q]))

    # ---- Step 8: red flags
    flags = []
    def flag(cond, text, why):
        if cond:
            flags.append({"text": text, "why": why})
    flag(de is not None and de > 2, "High leverage", f"Debt to equity is {fx(de)}, above 2.")
    flag(fcf is not None and fcf < 0, "Negative free cash flow", f"Free cash flow is {money(fcf)}.")
    flag(prof_cagr is not None and prof_cagr < 0, "Declining profits", f"Profit CAGR is {pct(prof_cagr)}.")
    flag(v["net_income"] is not None and v["net_income"] < 0, "Loss in the latest year", f"Net income is {money(v['net_income'])}.")
    flag(pe is not None and pe > 50, "Extremely high P/E", f"P/E is {fx(pe, 1)}, above 50.")
    flag(vol is not None and vol > 0.5, "Very high volatility", f"Volatility is {pct(vol)}, above 50%.")
    flag(above is False, "Below 200-day average", "The share price is in a downtrend.")
    flag(dd is not None and dd < -0.5, "Deep drawdown", f"The stock fell {pct(-dd, 0)} from a peak in the last 5 years.")
    steps.append(step("flags", "Look for red flags",
                      "Warnings that don't change the score directly but lower confidence in it.", [],
                      extra={"flags": flags}))

    # ---- Step 9: score & verdict
    blocks = [{"id": s["id"], "title": s["title"], "points": s["points"], "possible": s["possible"]}
              for s in steps if s["id"] in ("profitability", "stability", "growth", "valuation", "risk")]
    raw = sum(b["points"] for b in blocks)
    score = max(raw, 0)
    verdict = "BUY" if score >= BUY_AT else ("WATCH" if score >= WATCH_AT else "REJECT")
    confidence = ("HIGH" if score > 75 and not flags and (vol if vol is not None else 1) < 0.3
                  else "MEDIUM" if score > 60 else "LOW")
    reasons = []
    if verdict == "BUY":
        reasons.append(f"Score {score} is at or above the buy line of {BUY_AT}.")
    elif verdict == "WATCH":
        reasons.append(f"Score {score} is between the watch line ({WATCH_AT}) and the buy line ({BUY_AT}).")
    else:
        reasons.append(f"Score {score} is below the watch line of {WATCH_AT}.")
    if confidence == "HIGH":
        reasons.append("Confidence is high: score above 75, no red flags and volatility under 30%.")
    elif confidence == "MEDIUM":
        why = []
        if score <= 75: why.append("the score is not above 75")
        if flags: why.append(f"{len(flags)} red flag{'s' if len(flags) > 1 else ''}")
        if vol is not None and vol >= 0.3: why.append("volatility is 30% or more")
        reasons.append("Confidence is medium because " + " and ".join(why) + ".")
    else:
        reasons.append("Confidence is low because the score is 60 or below.")
    missing_pts = sum(i.get("possible", 0) for s in steps for i in s["items"] if i["outcome"] == "na")
    if missing_pts:
        reasons.append(f"{missing_pts} of the {MAX_SCORE} points could not be tested because the figure was "
                       "missing or not meaningful (for example a P/E when the company made a loss).")

    return {
        "ticker": ticker,
        "company": {"name": info.get("longName") or info.get("shortName") or ticker, "sector": sector,
                    "industry": info.get("industry") or "", "currency": money.cur, "symbol": money.sym,
                    "price": num(info.get("currentPrice") or info.get("regularMarketPrice")) or last,
                    "exchange": info.get("exchange") or ""},
        "steps": steps,
        "result": {"score": score, "raw": raw, "max": MAX_SCORE, "buy_at": BUY_AT, "watch_at": WATCH_AT,
                   "verdict": verdict, "confidence": confidence, "blocks": blocks, "reasons": reasons,
                   "flag_count": len(flags)},
    }


# ----------------------------------------------------------------- data
def fetch(ticker):
    import yfinance as yf
    t = yf.Ticker(ticker)
    history = t.history(period="5y", auto_adjust=True)
    if history is None or history.empty:
        raise LookupError(f"No price data found for “{ticker}”. Check the symbol: NSE stocks end in .NS "
                          f"(e.g. TCS.NS), BSE in .BO, US stocks have no suffix (e.g. AAPL).")
    try:
        info = t.info or {}
    except Exception:
        info = {}
    return {"info": info, "financials": t.financials, "balance_sheet": t.balance_sheet,
            "cashflow": t.cashflow, "history": history}


def clean(o):
    """Make the result JSON-safe (numpy types, NaN)."""
    if isinstance(o, dict):
        return {k: clean(x) for k, x in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(x) for x in o]
    if isinstance(o, (np.bool_, bool)):
        return bool(o)
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (float, np.floating)):
        return num(o)
    return o
