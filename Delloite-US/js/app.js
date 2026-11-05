/* Project Orchard dashboard – logic. Content lives in data.js. */
(function () {
  "use strict";

  const D = ORCHARD;
  const I = D.inputs;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  const charts = {};

  /* ---------- Formatting ---------- */
  const r0 = (v) => Math.round(v);
  const fmtM = (v) => (v < 0 ? "−$" : "$") + Math.abs(r0(v)).toLocaleString("en-US") + "M";
  const fmtSignedM = (v) => (v >= 0 ? "+$" : "−$") + Math.abs(r0(v)).toLocaleString("en-US") + "M";
  const fmtPct = (v, d = 0) => (v * 100).toFixed(d) + "%";
  const fmtX = (v) => v.toFixed(2) + "x";
  const fmtUnit = (v, unit) => {
    if (unit === "%") return fmtPct(v, v * 100 % 1 ? 1 : 0);
    if (unit === "x") return v.toFixed(1) + "x";
    return fmtM(v);
  };
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ---------- Model (mirrors IIML_Hellites_Orchard_Model.xlsx) ---------- */
  const gapSeries = () => {
    const years = ["FY25", "FY26", "FY27", "FY28", "FY29"];
    const mk = (g) => years.map((_, i) => I.revFY25 * Math.pow(1 + g, i));
    return { years, organic: mk(I.organicG), lo: mk(I.targetLo), hi: mk(I.targetHi) };
  };

  function brightwater(p) {
    const bw = I.bw;
    const revenue = p.rev * (1 + p.uplift);
    const standalone = revenue * p.margin;
    const mfg = revenue * (1 - bw.gm) * p.inhouse * (1 - 1 / (1 + bw.coPackPremium));
    const dist = revenue * p.routed * p.netSave;
    const ebitda = standalone + mfg + dist + p.brand;
    const disc = Math.pow(1 + p.wacc, I.yearsToFY29);
    const pv = (ebitda * p.mult) / disc;
    const investFull = bw.price + bw.tx + bw.integ;
    const S = D.structure;
    const investStruct = bw.tx + bw.integ + S.upfront + S.rollover + p.earnout / Math.pow(1 + p.wacc, I.yearsToFY29 - 1);
    return {
      revenue, standalone, mfg, dist, brand: p.brand, ebitda, pv,
      valueFull: pv - investFull,
      valueStruct: pv - investStruct,
      breakeven: (investFull * disc) / p.mult,
      synergyShare: ebitda ? (mfg + dist) / ebitda : 0
    };
  }

  function leverage() {
    const bw = I.bw, ml = I.ml, S = D.structure;
    const bwE = I.ebitda + bw.rev * bw.ebitdaM;
    const mlE = I.ebitda + ml.rev * ml.ebitdaM;
    return [
      { name: "Status quo", v: I.netDebt / I.ebitda },
      { name: "Brightwater: full price, all cash/debt", v: (I.netDebt + bw.price + bw.tx + bw.integ) / bwE },
      { name: "Brightwater: structured (recommended)", v: (I.netDebt + bw.tx + bw.integ + S.upfront) / bwE, rec: true },
      { name: "Marrow Lane", v: (I.netDebt + ml.price + ml.tx + ml.integ) / mlE },
      { name: "Both acquisitions", v: (I.netDebt + bw.price + bw.tx + bw.integ + ml.price + ml.tx + ml.integ) / (I.ebitda + bw.rev * bw.ebitdaM + ml.rev * ml.ebitdaM) }
    ];
  }

  function altValue(a, wacc) {
    const ebitda = a.rev * a.margin + a.syn;
    const pv = (ebitda * a.mult) / Math.pow(1 + wacc, I.yearsToFY29);
    return { ebitda, pv, value: pv - a.invest };
  }

  /* ---------- Chart defaults ---------- */
  function chartTheme() {
    if (!window.Chart) return;
    Chart.defaults.font.family = cssVar("--font") || "Inter, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = cssVar("--ink-2");
    Chart.defaults.borderColor = cssVar("--line");
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
  }
  function makeChart(id, cfg) {
    if (!window.Chart) return;
    if (charts[id]) charts[id].destroy();
    const canvas = document.getElementById(id);
    if (canvas) charts[id] = new Chart(canvas, cfg);
  }

  /* ---------- Summary ---------- */
  function renderSummary() {
    $("#heroTitle").textContent = D.hero.title;
    $("#heroLede").textContent = D.hero.lede;

    const g = gapSeries();
    const base = brightwater(D.scenarios.base);
    const lev = leverage();
    const kpis = [
      { l: "FY29 revenue gap to the board's ambition", v: `${fmtM(g.lo[4] - g.organic[4])}–${r0(g.hi[4] - g.organic[4])}M`, s: "At 2% organic vs 5–6% target" },
      { l: "Functional revenue gap", v: `~${fmtM(g.lo[4] * I.functionalShare - I.vitalRev)}`, s: "12% target vs Vital's $22M today" },
      { l: "Value created, base case", v: fmtSignedM(base.valueStruct), s: "Structured deal, present value", cls: "good" },
      { l: "Leverage at close", v: fmtX(lev[2].v), s: `vs ${fmtX(lev[1].v)} all-cash; board limit 2.5x`, cls: "good" }
    ];
    const row = $("#heroKpis");
    row.innerHTML = "";
    kpis.forEach((k) => row.appendChild(kpiTile(k)));

    const gl = $("#guideList");
    D.guide.forEach((x) => {
      const li = el("li");
      li.innerHTML = `<a href="${x.href}">${x.text}</a>`;
      gl.appendChild(li);
    });
  }

  function kpiTile(k) {
    const t = el("div", "kpi");
    t.innerHTML = `<div class="kpi-label">${k.l}</div><div class="kpi-value ${k.cls || ""}">${k.v}</div><div class="kpi-sub">${k.s}</div>`;
    return t;
  }

  /* ---------- Q1 ---------- */
  function renderDiagnosis() {
    const rc = $("#rootCauses");
    D.rootCauses.forEach((c, i) => {
      rc.appendChild(el("li", "", `<div class="issue-num">${i + 1}</div><div><strong>${c.t}</strong><span>${c.d}</span></div>`));
    });

    const pr = $("#priorities");
    D.priorities.forEach((p) => pr.appendChild(el("div", "priority", `<h4>${p.t}</h4><p>${p.d}</p>`)));

    const g = gapSeries();
    const gs = $("#gapStats");
    const fnLo = g.lo[4] * I.functionalShare, fnHi = g.hi[4] * I.functionalShare;
    [
      [`${fmtM(g.organic[4])}`, "FY29 revenue at today's 2% growth"],
      [`${fmtM(g.lo[4])}–${r0(g.hi[4]).toLocaleString("en-US")}M`, "FY29 revenue the board wants (5–6% a year)"],
      [`${fmtM(fnLo)}–${r0(fnHi)}M`, "Functional revenue needed for the 12% target, against $22M from Vital today"],
      [`${fmtM(I.bw.fy29Lo)}–${I.bw.fy29Hi}M`, "Brightwater's own FY29 forecast, which alone covers both gaps"]
    ].forEach(([b, s]) => gs.appendChild(el("div", "gap-stat", `<b>${b}</b><span>${s}</span>`)));
  }

  function drawDiagnosisCharts() {
    const c = [cssVar("--c1"), cssVar("--c2"), cssVar("--c3"), cssVar("--c4")];
    makeChart("mixChart", {
      type: "bar",
      data: {
        labels: D.mix.map((m) => m.name),
        datasets: [
          { label: "Share of revenue", data: D.mix.map((m) => m.share * 100), backgroundColor: c[2], yAxisID: "y", borderRadius: 4 },
          { label: "Annual growth", data: D.mix.map((m) => m.growth * 100), backgroundColor: D.mix.map((m) => (m.growth < 0 ? cssVar("--bad") : m.growth === 0 ? cssVar("--muted") : c[0])), yAxisID: "y1", borderRadius: 4 }
        ]
      },
      options: {
        plugins: { tooltip: { callbacks: { label: (x) => `${x.dataset.label}: ${x.raw.toFixed(0)}%` } } },
        scales: {
          y: { position: "left", title: { display: true, text: "Share of revenue (%)" }, beginAtZero: true, max: 45 },
          y1: { position: "right", title: { display: true, text: "Growth (%)" }, min: -5, max: 15, grid: { drawOnChartArea: false } },
          x: { ticks: { autoSkip: false, maxRotation: 0, callback: function (v) { const l = this.getLabelForValue(v); return l.length > 16 ? l.split(" (")[0] : l; } } }
        }
      }
    });

    const g = gapSeries();
    makeChart("gapChart", {
      type: "line",
      data: {
        labels: g.years,
        datasets: [
          { label: "Board target (6%)", data: g.hi, borderColor: c[3], backgroundColor: "transparent", borderDash: [5, 4], tension: .2, pointRadius: 2 },
          { label: "Board target (5%)", data: g.lo, borderColor: c[1], backgroundColor: "transparent", borderDash: [5, 4], tension: .2, pointRadius: 2 },
          { label: "Organic (2%)", data: g.organic, borderColor: c[0], backgroundColor: "transparent", borderWidth: 3, tension: .2, pointRadius: 3 }
        ]
      },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: { tooltip: { callbacks: { label: (x) => `${x.dataset.label}: ${fmtM(x.raw)}` } } },
        scales: { y: { ticks: { callback: (v) => "$" + v.toLocaleString("en-US") } } }
      }
    });
  }

  /* ---------- Q2 ---------- */
  let weights = D.criteria.map((c) => c.w);

  function renderOptions() {
    const t = $("#optionTable");
    t.innerHTML = `<thead><tr><th>Option</th><th>FY29 revenue gap</th><th>Functional target</th><th class="num">Leverage at close</th><th>Brand control</th><th>Verdict</th></tr></thead>`;
    const tb = el("tbody");
    D.options.forEach((o) => {
      const tr = el("tr", o.rec ? "rec" : "");
      tr.innerHTML = `<td><strong>${o.name}</strong></td><td>${o.gap}</td><td>${o.fn}</td><td class="num">${o.lev}</td><td>${o.control}</td><td><span class="pill ${o.verdict[0]}">${o.verdict[1]}</span></td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);

    const box = $("#weightSliders");
    box.innerHTML = "";
    D.criteria.forEach((c, i) => {
      const s = el("div", "slider");
      s.innerHTML = `<label for="w${i}"><span>${c.name}</span><output id="wo${i}">${weights[i]}</output></label><input type="range" id="w${i}" min="0" max="40" step="5" value="${weights[i]}">`;
      box.appendChild(s);
      s.querySelector("input").addEventListener("input", (e) => {
        weights[i] = Number(e.target.value);
        $("#wo" + i).textContent = weights[i];
        drawScoreChart();
      });
    });
    $("#resetWeights").onclick = () => { weights = D.criteria.map((c) => c.w); renderOptions(); drawScoreChart(); };
  }

  function scoreFor(key) {
    const tot = weights.reduce((a, b) => a + b, 0) || 1;
    return D.scores[key].reduce((a, s, i) => a + s * weights[i], 0) / tot;
  }

  function drawScoreChart() {
    const opts = D.options;
    const vals = opts.map((o) => scoreFor(o.key));
    const top = Math.max(...vals);
    makeChart("scoreChart", {
      type: "bar",
      data: {
        labels: opts.map((o) => o.name.replace(" (", "\n(").split("\n")),
        datasets: [{ label: "Weighted score (1–5)", data: vals, backgroundColor: vals.map((v) => (v === top ? cssVar("--c1") : cssVar("--c3"))), borderRadius: 4 }]
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => `Score: ${x.raw.toFixed(2)}` } } },
        scales: { x: { min: 0, max: 5 } },
        animation: { duration: 250 }
      }
    });
  }

  /* ---------- Q3 ---------- */
  let params = { ...D.scenarios.base };

  function renderSimulator() {
    const box = $("#simSliders");
    box.innerHTML = "";
    D.sliders.forEach((s) => {
      const d = el("div", "slider");
      d.innerHTML = `<label for="s_${s.id}"><span>${s.label}</span><output id="o_${s.id}"></output></label>
        <input type="range" id="s_${s.id}" min="${s.min}" max="${s.max}" step="${s.step}">
        <small>${s.hint}</small>`;
      box.appendChild(d);
      d.querySelector("input").addEventListener("input", (e) => {
        params[s.id] = Number(e.target.value);
        document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        $("#scenarioNote").textContent = "Custom assumptions";
        updateSimulator();
      });
    });

    document.querySelectorAll(".chip").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        b.classList.add("active");
        params = { ...D.scenarios[b.dataset.scenario] };
        syncSliders();
        updateSimulator();
      });
    });
    syncSliders();
    renderLeverage();
    renderAlternatives();
  }

  function syncSliders() {
    D.sliders.forEach((s) => {
      $("#s_" + s.id).value = params[s.id];
    });
    const active = document.querySelector(".chip.active");
    $("#scenarioNote").textContent = active ? D.scenarios[active.dataset.scenario].note : "";
  }

  function updateSimulator() {
    D.sliders.forEach((s) => { $("#o_" + s.id).textContent = fmtUnit(params[s.id], s.unit); });
    const m = brightwater(params);
    const row = $("#simKpis");
    row.innerHTML = "";
    [
      { l: "FY29 run-rate EBITDA", v: fmtM(m.ebitda), s: `Breakeven needs ${fmtM(m.breakeven)}`, cls: m.ebitda >= m.breakeven ? "good" : "bad" },
      { l: "Present value of Brightwater", v: fmtM(m.pv), s: "FY29 EV discounted to today" },
      { l: "Value created: full price", v: fmtSignedM(m.valueFull), s: "$492M paid upfront", cls: m.valueFull >= 0 ? "good" : "bad" },
      { l: "Value created: structured", v: fmtSignedM(m.valueStruct), s: `Earn-out paid: ${fmtM(params.earnout)}`, cls: m.valueStruct >= 0 ? "good" : "bad" }
    ].forEach((k) => row.appendChild(kpiTile(k)));

    $("#breakevenNote").textContent =
      `Synergies are ${fmtPct(m.synergyShare)} of FY29 EBITDA. At the full $492M price, Alderbrook needs ${fmtM(m.breakeven)} of FY29 EBITDA ` +
      `at a ${params.mult.toFixed(1)}x exit to break even. The structured deal is ${fmtM(m.valueStruct - m.valueFull)} better in this scenario.`;
    drawBridge(m);
    renderAlternatives();
  }

  function drawBridge(m) {
    const labels = ["Standalone EBITDA", "Manufacturing in-house", "DSD distribution", "Brand & retention cost", "FY29 EBITDA", "Breakeven"];
    const vals = [m.standalone, m.mfg, m.dist, m.brand, m.ebitda, m.breakeven];
    let run = 0;
    const floating = vals.map((v, i) => {
      if (i >= 4) return [0, v];
      const start = run; run += v; return [start, run];
    });
    const colors = [cssVar("--c3"), cssVar("--c1"), cssVar("--c2"), cssVar("--bad"), cssVar("--c1"), cssVar("--muted")];
    makeChart("bridgeChart", {
      type: "bar",
      data: { labels, datasets: [{ label: "$M", data: floating, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => fmtM(vals[x.dataIndex]) } } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => "$" + v } }, x: { ticks: { autoSkip: false, maxRotation: 0, font: { size: 11 } } } },
        animation: { duration: 250 }
      }
    });
  }

  function renderLeverage() {
    const box = $("#leverageMeters");
    box.innerHTML = "";
    const max = 4;
    const ok = cssVar("--good"), warn = cssVar("--warn"), bad = cssVar("--bad");
    leverage().forEach((l) => {
      const color = l.v <= I.boardCap ? ok : l.v <= I.covenant ? warn : bad;
      const m = el("div", "meter");
      m.innerHTML = `<div class="meter-head"><span>${l.name}</span><span style="color:${color}">${fmtX(l.v)}</span></div>
        <div class="meter-track">
          <div class="meter-fill" style="width:${Math.min(100, (l.v / max) * 100)}%;background:${color}"></div>
          <div class="meter-mark" style="left:${(I.boardCap / max) * 100}%"></div>
          <div class="meter-mark" style="left:${(I.covenant / max) * 100}%"></div>
        </div>`;
      box.appendChild(m);
    });
    const scale = el("div", "meter-track meter-scale");
    scale.style.background = "transparent"; scale.style.border = "0";
    scale.innerHTML = `<div class="meter-mark" style="left:${(I.boardCap / max) * 100}%;background:transparent"><span>Board 2.5x</span></div>
      <div class="meter-mark" style="left:${(I.covenant / max) * 100}%;background:transparent"><span>Covenant 3.5x</span></div>`;
    box.prepend(scale);
  }

  function renderAlternatives() {
    const t = $("#altTable");
    const bw = brightwater(params);
    t.innerHTML = `<thead><tr><th>Option</th><th class="num">FY29 EBITDA</th><th class="num">Present value</th><th class="num">Investment</th><th class="num">Value created</th><th>Counts to functional target</th></tr></thead>`;
    const tb = el("tbody");
    const S = D.structure;
    const rowsHtml = [
      `<tr class="rec"><td><strong>Brightwater (structured, current scenario)</strong></td><td class="num">${fmtM(bw.ebitda)}</td><td class="num">${fmtM(bw.pv)}</td><td class="num">${fmtM(I.bw.tx + I.bw.integ + S.upfront + S.rollover + params.earnout)}</td><td class="num">${fmtSignedM(bw.valueStruct)}</td><td>Yes</td></tr>`
    ];
    D.alternatives.forEach((a) => {
      const v = altValue(a, params.wacc);
      rowsHtml.push(`<tr><td>${a.name}</td><td class="num">${fmtM(v.ebitda)}</td><td class="num">${fmtM(v.pv)}</td><td class="num">${fmtM(a.invest)}</td><td class="num">${fmtSignedM(v.value)}</td><td>${a.fn}</td></tr>`);
    });
    tb.innerHTML = rowsHtml.join("");
    t.appendChild(tb);
  }

  /* ---------- Q4 ---------- */
  function renderExecution() {
    const tl = $("#timeline");
    D.phases.forEach((p) => {
      tl.appendChild(el("div", "phase", `<div class="phase-when">${p.when}</div><h4>${p.t}</h4><ul>${p.items.map((i) => `<li>${i}</li>`).join("")}</ul><div class="gate">${p.gate}</div>`));
    });
    const kq = $("#keyQuestions");
    D.keyQuestions.forEach((q) => kq.appendChild(el("li", "", `${q.q}<span>${q.d}</span>`)));
    const rt = $("#riskTable");
    rt.innerHTML = `<thead><tr><th>Risk</th><th>Mitigation</th></tr></thead><tbody>${D.risks.map((r) => `<tr><td><strong>${r.r}</strong></td><td>${r.m}</td></tr>`).join("")}</tbody>`;
    const kg = $("#kpiGrid");
    D.kpis.forEach((k) => kg.appendChild(el("div", "kpi-mini", `<b>${k.t}</b><span>${k.d}</span>`)));
  }

  /* ---------- Q5 ---------- */
  function renderAI() {
    const uc = $("#useCases");
    D.useCases.forEach((u) => {
      uc.appendChild(el("div", "usecase", `<div class="usecase-top"><h4>${u.t}</h4><span class="pill good">${u.tag}</span></div><p>${u.d}</p><div class="metric">→ ${u.m}</div>`));
    });
    const cg = $("#capabilities");
    D.capabilities.forEach((c) => cg.appendChild(el("div", "cap", `<h4>${c.t}</h4><ul>${c.items.map((i) => `<li>${i}</li>`).join("")}</ul>`)));
  }

  /* ---------- Appendix and team ---------- */
  function renderAppendix() {
    const map = { fact: ["tag-fact", "Case fact"], assume: ["tag-assume", "Team assumption"], calc: ["tag-calc", "Calculated"] };
    $("#assumptionTable").innerHTML = `<thead><tr><th>Input</th><th>Status</th></tr></thead><tbody>${D.assumptions
      .map(([t, k]) => `<tr><td>${t}</td><td><span class="tag ${map[k][0]}">${map[k][1]}</span></td></tr>`).join("")}</tbody>`;
    $("#aiNote").textContent = D.aiNote;

    const tg = $("#teamGrid");
    D.team.forEach((m) => {
      const initials = m.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
      const avatar = m.photo
        ? `<img class="avatar avatar-photo" src="${m.photo}" alt="Photo of ${m.name}" width="72" height="72" loading="lazy">`
        : `<div class="avatar">${initials}</div>`;
      tg.appendChild(el("div", "member", `${avatar}
        <div class="member-info"><h3>${m.name}</h3><p>${m.role} · ${m.roll}</p><p>${m.year}</p><p>${m.course}, ${m.college}</p></div>
        <a class="btn btn-small" href="${m.cv}" download>Download CV</a>`));
    });
  }

  /* ---------- Theme and nav ---------- */
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("orchard-theme"); } catch (e) { /* storage unavailable */ }
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $("#themeToggle").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("orchard-theme", next); } catch (e) { /* ignore */ }
      redrawCharts();
    });
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawCharts);
    }
  }

  function initNav() {
    const links = [...document.querySelectorAll(".nav a")];
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("main > section").forEach((s) => obs.observe(s));
  }

  function redrawCharts() {
    chartTheme();
    drawDiagnosisCharts();
    drawScoreChart();
    updateSimulator();
    renderLeverage();
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderSummary();
    renderDiagnosis();
    renderOptions();
    renderSimulator();
    renderExecution();
    renderAI();
    renderAppendix();
    initNav();
    redrawCharts();
  });
})();
