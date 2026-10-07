"use strict";

const $ = (sel) => document.querySelector(sel);
const form = $("#search");
const input = $("#ticker");
const goBtn = $("#go");
const statusEl = $("#status");
const reportEl = $("#report");
const emptyEl = $("#empty");

const SEG_COLORS = ["var(--seg-1)", "var(--seg-2)", "var(--seg-3)", "var(--seg-4)"];
const SCORED = ["profitability", "stability", "growth", "valuation"];

/* Small DOM builder: el("p", {class: "x"}, "text", childNode, ...) */
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "style") n.style.cssText = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const k of kids.flat()) {
    if (k === null || k === undefined || k === false) continue;
    n.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return n;
}

function svg(tag, attrs = {}) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

const signed = (p) => (p > 0 ? `+${p}` : p < 0 ? `−${Math.abs(p)}` : "0");
const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();

/* ---------------------------------------------------------------- fetch */
async function analyze(ticker) {
  ticker = ticker.trim().toUpperCase();
  if (!ticker) return;
  input.value = ticker;
  history.replaceState(null, "", `?t=${encodeURIComponent(ticker)}`);

  goBtn.disabled = true;
  emptyEl.hidden = true;
  reportEl.hidden = true;
  showStatus(
    el("p", {}, el("span", { class: "spinner", "aria-hidden": "true" }),
      ticker.startsWith("DEMO-") ? "Loading the offline sample…" : `Fetching ${ticker} from Yahoo Finance and running the analysis…`)
  );

  try {
    const res = await fetch(`/api/analyze?ticker=${encodeURIComponent(ticker)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail || `The server returned an error (${res.status}).`);
    statusEl.hidden = true;
    render(body);
  } catch (err) {
    const offline = err instanceof TypeError;
    showStatus(
      el("h3", {}, offline ? "The analysis server isn't reachable" : `Couldn't analyze ${ticker}`),
      el("p", {}, offline ? "Start it with “uvicorn app:app --reload” and reload this page." : err.message),
      true
    );
  } finally {
    goBtn.disabled = false;
  }
}

function showStatus(...args) {
  const isError = args[args.length - 1] === true;
  if (isError) args.pop();
  statusEl.replaceChildren(...args);
  statusEl.classList.toggle("is-error", isError);
  statusEl.hidden = false;
}

/* ---------------------------------------------------------------- render */
function render(a) {
  const c = a.company;
  $("#co-name").textContent = c.name;
  const meta = [a.ticker];
  if (c.sector) meta.push(c.industry ? `${c.sector}, ${c.industry}` : c.sector);
  if (c.price != null) meta.push(`Last price ${c.symbol}${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  $("#co-meta").textContent = meta.join("   |   ");

  renderVerdict(a);
  renderTape(a);

  const list = $("#steps");
  list.replaceChildren(...a.steps.map((s) => renderStep(s, a)), renderFinal(a));

  reportEl.hidden = false;
  document.title = `${a.ticker}: ${titleCase(a.result.verdict)} | Stock Analyzer`;
}

function renderVerdict(a) {
  const r = a.result;
  const box = $("#verdict");
  box.className = `verdict v-${r.verdict.toLowerCase()}`;
  box.replaceChildren(
    el("div", { class: "verdict-row" },
      el("p", { class: "verdict-word" }, titleCase(r.verdict)),
      el("p", { class: "verdict-score" },
        el("strong", {}, r.score), ` of ${r.max} points, ${r.confidence.toLowerCase()} confidence`)),
    el("ul", {}, r.reasons.map((x) => el("li", {}, x))),
    el("div", { class: "verdict-actions" },
      el("a", { class: "btn-link", href: `/api/export?ticker=${encodeURIComponent(a.ticker)}` }, "Download Excel workings"),
      el("a", { href: "#step-final" }, "Jump to the score breakdown"))
  );
}

/* Score tape: stacked contributions per step, penalties hatched off the top. */
function renderTape(a) {
  const r = a.result;
  const tape = $("#tape");
  const pct = (v) => (Math.max(0, Math.min(v, r.max)) / r.max) * 100;
  const track = el("div", { class: "tape-track" });

  let acc = 0;
  let delay = 0;
  SCORED.forEach((id, i) => {
    const b = r.blocks.find((x) => x.id === id);
    if (!b || b.points <= 0) return;
    const idx = a.steps.findIndex((s) => s.id === id) + 1;
    track.append(
      el("button", {
        class: "tape-seg",
        type: "button",
        title: `Step ${idx}: ${b.title}, ${b.points} of ${b.possible} points`,
        "aria-label": `Step ${idx}: ${b.title}, ${b.points} of ${b.possible} points`,
        style: `--a:${pct(acc)};--s:${pct(b.points)};background:${SEG_COLORS[i]};animation-delay:${delay}s`,
        onclick: () => document.getElementById(`step-${id}`).scrollIntoView({ behavior: "smooth" }),
      }, el("span", {}, b.points >= 8 ? idx : ""))
    );
    acc += b.points;
    delay += 0.3;
  });

  const risk = r.blocks.find((x) => x.id === "risk");
  const pen = Math.min(-(risk ? risk.points : 0), acc);
  if (pen > 0) {
    track.append(el("div", {
      class: "tape-pen", style: `--a:${pct(acc - pen)};--s:${pct(pen)}`,
      title: `Price risk penalty: −${pen}`,
    }));
  }

  const line = (v, cls, label) =>
    el("div", { class: `tape-line ${cls}`, style: `--a:${pct(v)}` }, el("span", { class: "tape-line-label" }, label));

  tape.replaceChildren(
    track,
    line(r.buy_at, "buy", `Buy ${r.buy_at}`),
    line(r.watch_at, "watch", `Watch ${r.watch_at}`),
    el("span", { class: "tape-axis", style: "--a:0" }, "0"),
    el("span", { class: "tape-axis", style: "--a:100" }, r.max),
    el("div", { class: "tape-marker", style: `--a:${pct(r.score)}` }, r.score, el("small", {}, `/${r.max}`)),
  );
  const cap = el("p", { class: "tape-caption" },
    "Each block is one step's points. Hatching shows the price-risk penalty. Click a block to jump to its working.");
  tape.append(cap);

  tape.classList.remove("is-animating");
  void tape.offsetWidth;
  tape.classList.add("is-animating");
}

function renderStep(s, a) {
  const scoredStep = SCORED.includes(s.id) || s.id === "risk";
  let pointsLabel = null;
  if (scoredStep) {
    const cls = s.points > 0 ? "pos" : s.points < 0 ? "neg" : "";
    const text = s.id === "risk"
      ? (s.points === 0 ? "No penalty" : `${signed(s.points)} points`)
      : `${s.points} of ${s.possible} points`;
    pointsLabel = el("span", { class: `step-points ${cls}` }, text);
  }

  const body = [];
  if (s.id === "risk" && s.extra && s.extra.chart && s.extra.chart.length > 1) body.push(renderChart(s.extra.chart, s.extra.currency));
  if (s.items.length) body.push(el("ul", { class: "items" }, s.items.map(renderItem)));
  if (s.id === "flags") body.push(renderFlags(s.extra.flags));
  if (s.notes.length) body.push(el("ul", { class: "notes" }, s.notes.map((n) => el("li", {}, n))));

  return el("li", { class: "step", id: `step-${s.id}` },
    el("div", {},
      el("div", { class: "step-head" }, el("h3", { class: "step-title" }, s.title), pointsLabel),
      el("p", { class: "step-intro" }, s.intro),
      body));
}

function renderItem(it) {
  let pts = null;
  if (it.points !== null && it.points !== undefined) {
    let text, cls;
    if (it.outcome === "na") { text = "Not tested"; cls = ""; }
    else if (it.points > 0) { text = `${signed(it.points)} points`; cls = "p-pass"; }
    else if (it.points < 0) { text = `${signed(it.points)} points`; cls = "p-fail"; }
    else if (it.rule && /costs/.test(it.rule)) { text = "No penalty"; cls = "p-pass"; }
    else { text = "0 points"; cls = "p-fail"; }
    pts = el("span", { class: `pts ${cls}` }, text);
  }

  const kids = [
    el("div", {},
      el("p", { class: "it-label" }, it.label),
      it.formula && el("p", { class: "it-formula" }, it.formula),
      it.working && el("p", { class: "it-working" }, it.working),
      it.note && el("p", { class: "it-note" }, it.note)),
    el("div", { class: "it-side" },
      el("p", { class: "it-value" }, it.display),
      it.rule && el("p", { class: "it-rule" }, it.rule),
      pts),
  ];
  if (it.series && it.series.length > 1) kids.push(renderBars(it.series));

  const o = it.points === null || it.points === undefined ? (it.outcome === "info" ? "" : `o-${it.outcome}`) : `o-${it.outcome}`;
  return el("li", { class: `it ${o}` }, kids);
}

function renderBars(series) {
  const max = Math.max(...series.map((d) => Math.abs(d.value))) || 1;
  return el("div", { class: "series", "aria-hidden": "true" },
    series.map((d) =>
      el("div", { class: "bar", title: `${d.period}: ${d.display}` },
        el("i", { class: d.value < 0 ? "neg" : "", style: `height:${(Math.abs(d.value) / max) * 48}px` }),
        el("b", {}, d.period.slice(-4)))));
}

function renderFlags(flags) {
  if (!flags.length) return el("p", { class: "no-flags" }, "No red flags found.");
  return el("ul", { class: "flags" }, flags.map((f) => el("li", {}, el("strong", {}, f.text), el("span", {}, f.why))));
}

function renderChart(points, sym) {
  const W = 760, H = 220, P = { l: 52, r: 8, t: 10, b: 24 };
  const vals = points.flatMap((p) => (p.m != null ? [p.c, p.m] : [p.c]));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const x = (i) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - lo) / (hi - lo || 1)) * (H - P.t - P.b);
  const path = (key) => {
    let d = "", pen = false;
    points.forEach((p, i) => {
      if (p[key] == null) { pen = false; return; }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const fmt = (v) => sym + v.toLocaleString(undefined, { maximumFractionDigits: v < 100 ? 2 : 0 });

  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Weekly closing price with 200-day moving average, last 5 years" });
  [lo, (lo + hi) / 2, hi].forEach((v) => {
    s.append(svg("line", { class: "grid", x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) }));
    const t = svg("text", { x: P.l - 6, y: y(v) + 4, "text-anchor": "end" });
    t.textContent = fmt(v);
    s.append(t);
  });
  const years = new Set();
  points.forEach((p, i) => {
    const yr = p.d.slice(0, 4);
    if (!years.has(yr) && p.d.slice(5, 7) === "01") {
      years.add(yr);
      const t = svg("text", { x: x(i), y: H - 6, "text-anchor": "middle" });
      t.textContent = yr;
      s.append(t);
    }
  });
  s.append(svg("path", { class: "m-line", d: path("m") }));
  s.append(svg("path", { class: "c-line", d: path("c") }));

  return el("figure", { class: "chart" }, s,
    el("figcaption", { class: "legend" }, el("span", {}, "Weekly close"), el("span", { class: "m" }, "200-day average")));
}

function renderFinal(a) {
  const r = a.result;
  const rows = r.blocks.map((b) => {
    const idx = a.steps.findIndex((s) => s.id === b.id) + 1;
    return el("tr", {},
      el("td", {}, el("a", { href: `#step-${b.id}` }, `${idx}. ${b.title}`)),
      el("td", {}, b.id === "risk" ? (b.points ? signed(b.points) : "0") : `${b.points} / ${b.possible}`));
  });
  const floorNote = r.raw < 0 ? el("p", { class: "thresholds" }, `Raw total ${signed(r.raw)} is floored at 0.`) : null;

  return el("li", { class: "step", id: "step-final" },
    el("div", {},
      el("div", { class: "step-head" }, el("h3", { class: "step-title" }, "Add up the score and decide")),
      el("p", { class: "step-intro" }, "Points from each step, less any price-risk penalty."),
      el("table", { class: "tally" },
        el("thead", {}, el("tr", {}, el("th", {}, "Step"), el("th", {}, "Points"))),
        el("tbody", {}, rows),
        el("tfoot", {}, el("tr", {}, el("td", {}, "Final score"), el("td", {}, `${r.score} / ${r.max}`)))),
      floorNote,
      el("p", { class: "thresholds" },
        `Buy at ${r.buy_at} or more, watch from ${r.watch_at} to ${r.buy_at - 1}, reject below ${r.watch_at}. ` +
        `Confidence is high only when the score is above 75 with no red flags and volatility under 30%; ` +
        `medium when the score is above 60; otherwise low.`),
      el("p", { class: "thresholds" }, `Result: ${titleCase(r.verdict)} with ${r.confidence.toLowerCase()} confidence.`)));
}

/* ---------------------------------------------------------------- wire up */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  analyze(input.value);
});
document.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => analyze(b.dataset.t)));

const initial = new URLSearchParams(location.search).get("t");
if (initial) analyze(initial);
