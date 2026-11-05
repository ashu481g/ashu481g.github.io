/* =========================================================
   Project Orchard – content and model inputs (Team Hellites)
   Edit this file to change wording, numbers or the team.
   All $ figures in $ millions. Case data is fictional.
   ========================================================= */

const ORCHARD = {

  /* ---------- Summary ---------- */
  hero: {
    title: "Acquire Brightwater through a structured, pay-for-proof deal, and use it to build Alderbrook's AI-led innovation engine.",
    lede: "Alderbrook grows 2% a year in a functional-drinks market growing 12–15%. Brightwater is the only option that closes both the FY29 revenue gap and the 12% functional-revenue target. We pay for velocity once it is proven: $300M upfront, $50M seller rollover and up to $100M in earn-outs. That keeps leverage under the board's 2.5x, ring-fences the brand and caps the downside of a third failed acquisition."
  },

  guide: [
    { href: "#summary",   text: "Recommendation and headline numbers (1 min)" },
    { href: "#diagnosis", text: "What limits growth and the FY29 gap (2 min)" },
    { href: "#options",   text: "Option comparison; change the weights to test the ranking (2 min)" },
    { href: "#value",     text: "Value and leverage simulator; try the Bear scenario (3 min)" },
    { href: "#execution", text: "Gated execution plan and questions to answer before signing (1 min)" },
    { href: "#ai",        text: "AI and data plan (1 min)" }
  ],

  /* ---------- Q1 ---------- */
  mix: [
    { name: "Juice",                 share: 0.38, growth: -0.03 },
    { name: "Iced tea",              share: 0.24, growth: 0.00 },
    { name: "Sparkling water",       share: 0.26, growth: 0.07 },
    { name: "Hydration & other (incl. Vital)", share: 0.12, growth: 0.11 }
  ],

  rootCauses: [
    { t: "Portfolio anchored in shrinking categories", d: "62% of revenue is juice (declining 3% a year) and iced tea (flat). Sparkling water grows, but against strong national brands." },
    { t: "Slow, panel-driven innovation", d: "Vital took 14 months concept-to-shelf, against Brightwater's 90 days. Product planning relies on annual consumer panels." },
    { t: "Organic functional bet has not worked", d: "Vital reached $22M after two years, with 60% of volume sold on promotion." },
    { t: "Assets under-used", d: "Plants run at 68% utilisation. Weekly outlet-level sales data from 110,000 outlets is used mainly for route planning. There is no commercial data-science team." },
    { t: "Weak M&A integration record", d: "Both prior acquisitions (2016, 2019) now sit below their acquisition-year revenue." }
  ],

  priorities: [
    { t: "Win in functional, fast", d: "Demand is shifting to functional and better-for-you drinks (~$16B, growing 12–15% a year). Buy proven brand traction rather than wait 24–36 months." },
    { t: "Sense and launch like a challenger", d: "Seasonal, trend-led flavours need data-driven, sub-6-month launch cycles rather than annual panels." },
    { t: "Give retailers velocity, not promotions", d: "Retailers reward brands that turn on shelf. Use outlet data to place SKUs where they will sell, instead of buying volume with promotions." },
    { t: "Grow inside financial guardrails", d: "Hold operating margin at 11% or above and net debt / EBITDA at 2.5x or below. Avoid repeating past integration failures." }
  ],

  /* ---------- Company inputs (case facts) ---------- */
  inputs: {
    revFY25: 1800, organicG: 0.02, ebitda: 270, netDebt: 324,
    boardCap: 2.5, covenant: 3.5, targetLo: 0.05, targetHi: 0.06, functionalShare: 0.12, vitalRev: 22,
    bw: { rev: 95, gm: 0.44, ebitdaM: -0.02, price: 450, tx: 12, integ: 30, fy29Lo: 260, fy29Hi: 300, coPackPremium: 0.18 },
    ml: { rev: 48, ebitdaM: 0.13, price: 170, tx: 6, integ: 10, fy29Lo: 75, fy29Hi: 85 },
    yearsToFY29: 4
  },

  /* ---------- Q2 option comparison ---------- */
  options: [
    { key: "bwS", name: "Brightwater (structured)", rec: true,
      gap: "Closes it ($260–300M by FY29)", fn: "Yes", lev: "2.48x", control: "Full", verdict: ["good", "Recommended"] },
    { key: "bwF", name: "Brightwater (full price, all cash)",
      gap: "Closes it", fn: "Yes", lev: "3.04x", control: "Full", verdict: ["warn", "Too much leverage and downside"] },
    { key: "ml", name: "Marrow Lane",
      gap: "About a third ($75–85M)", fn: "No (coffee and tea)", lev: "1.85x", control: "Full; no successor", verdict: ["bad", "~27x EBITDA, wrong gap"] },
    { key: "pt", name: "Distribution partnership",
      gap: "Small (fees only)", fn: "No", lev: "1.24x", control: "None; could be sold to a rival", verdict: ["warn", "Use as pre-signing test"] },
    { key: "vt", name: "Relaunch Vital ($50M)",
      gap: "Small and slow (24–36 months)", fn: "Partly", lev: "1.39x", control: "Full", verdict: ["warn", "Fold into Brightwater"] }
  ],

  criteria: [
    { name: "Closes FY29 growth gap",           w: 20 },
    { name: "Hits 12% functional target",       w: 20 },
    { name: "Builds innovation and AI capability", w: 15 },
    { name: "Value vs investment (base case)",  w: 15 },
    { name: "Fits 2.5x leverage",               w: 10 },
    { name: "Execution and integration risk (5 = low)", w: 10 },
    { name: "Strategic control",                w: 10 }
  ],
  // scores per option, same order as criteria
  scores: {
    bwF: [5, 5, 5, 3, 1, 2, 5],
    bwS: [5, 5, 5, 4, 4, 3, 5],
    ml:  [2, 1, 1, 1, 5, 2, 5],
    pt:  [2, 1, 2, 3, 5, 4, 1],
    vt:  [1, 2, 2, 3, 5, 2, 5]
  },

  /* ---------- Q3 simulator ---------- */
  sliders: [
    { id: "rev",     label: "Brightwater FY29 standalone revenue", unit: "$M", min: 150, max: 320, step: 5, hint: "Management forecast: $260–300M" },
    { id: "uplift",  label: "Revenue uplift from Alderbrook DSD", unit: "%", min: 0, max: 0.30, step: 0.01, hint: "Convenience and foodservice outlets Brightwater does not reach today" },
    { id: "margin",  label: "Standalone EBITDA margin at scale", unit: "%", min: 0, max: 0.20, step: 0.01, hint: "Today −2%" },
    { id: "inhouse", label: "Co-packed volume moved to Alderbrook can lines", unit: "%", min: 0, max: 1, step: 0.05, hint: "Removes the 18% co-packing premium" },
    { id: "routed",  label: "Revenue routed through Alderbrook DSD", unit: "%", min: 0, max: 0.6, step: 0.05, hint: "Replaces distributors charging 25–30% of shelf price" },
    { id: "netSave", label: "Net distribution saving on routed revenue", unit: "%", min: 0, max: 0.15, step: 0.01, hint: "Distributor fee minus DSD cost-to-serve" },
    { id: "brand",   label: "Brand-autonomy and retention cost (run-rate)", unit: "$M", min: -10, max: 0, step: 1, hint: "Keeps the founder and 90-day innovation cell" },
    { id: "mult",    label: "Exit EV / EBITDA multiple", unit: "x", min: 8, max: 20, step: 0.5, hint: "Illustrative; benchmark against recent beverage deals" },
    { id: "wacc",    label: "Discount rate", unit: "%", min: 0.07, max: 0.13, step: 0.005, hint: "Illustrative cost of capital" },
    { id: "earnout", label: "Earn-out paid (structured deal)", unit: "$M", min: 0, max: 100, step: 10, hint: "Paid only if velocity and revenue milestones are hit" }
  ],

  scenarios: {
    bear: { rev: 195, uplift: 0.00, margin: 0.08, inhouse: 0.50, routed: 0.25, netSave: 0.05, brand: -5, mult: 12, wacc: 0.09, earnout: 0,
            note: "Conventional velocity stays at 0.8x; revenue is 25% below management's low case." },
    base: { rev: 260, uplift: 0.10, margin: 0.12, inhouse: 0.75, routed: 0.35, netSave: 0.08, brand: -3, mult: 14, wacc: 0.09, earnout: 50,
            note: "Management's low forecast plus modest DSD synergies." },
    bull: { rev: 300, uplift: 0.20, margin: 0.15, inhouse: 0.90, routed: 0.45, netSave: 0.10, brand: -3, mult: 16, wacc: 0.09, earnout: 100,
            note: "Management's high forecast; conventional velocity reaches category average." }
  },

  structure: { upfront: 300, rollover: 50, maxEarnout: 100 },

  alternatives: [
    { name: "Marrow Lane",       rev: 80,  margin: 0.13, syn: 3, mult: 12, invest: 186, fn: "No" },
    { name: "Distribution partnership", rev: 100, margin: 0.08, syn: 0, mult: 8, invest: 10, fn: "No (fees only)" },
    { name: "Relaunch Vital",    rev: 70,  margin: 0.10, syn: 0, mult: 12, invest: 50,  fn: "Yes" }
  ],

  /* ---------- Q4 ---------- */
  phases: [
    { when: "Weeks 0–6 (before board)", t: "Confirm and structure",
      items: ["Confirmatory diligence on the 7 questions", "Short distribution test in 2 DC regions to read conventional velocity", "Negotiate earn-out and rollover with the founder and PE investor"],
      gate: "Gate: velocity trend and can-line fit confirmed" },
    { when: "Day 1–100", t: "Protect and connect",
      items: ["Ring-fenced Brightwater unit with its own P&L; founder stays as brand lead", "Retention packages for the 5 AI specialists", "Integration office with board-level reporting"],
      gate: "Gate: no key-talent attrition" },
    { when: "Months 4–12", t: "Scale where it sells",
      items: ["Move co-packed volume to Alderbrook's two can lines", "DSD rollout to convenience in priority regions, targeted with outlet data", "Fold Vital into the Brightwater innovation pipeline"],
      gate: "Gate: conventional velocity of 1.0x or better before national rollout" },
    { when: "Months 13–36", t: "Industrialise the engine",
      items: ["National conventional-grocery rollout", "Commercial data-science team applies the trend engine to all Alderbrook brands", "Earn-out tranches paid against milestones"],
      gate: "Target: 12%+ functional revenue by FY29" }
  ],

  keyQuestions: [
    { q: "Why is conventional velocity only 0.8x, and is it fixable?", d: "Separate the effects of price point, shelf placement and awareness, using retailer scan data and the distribution test." },
    { q: "Do Alderbrook's two can lines have capacity and format fit?", d: "Check line time, changeover cost and botanical-ingredient handling." },
    { q: "Will the founder and the PE investor accept an earn-out and rollover?", d: "Find out whether there are competing bidders and the PE investor's exit timeline." },
    { q: "What does DSD cost per case for a low-volume brand?", d: "This determines the real distribution saving compared with distributors charging 25–30%." },
    { q: "Can we retain the 5 AI specialists and the founder?", d: "Agree retention terms and decision rights for the brand." },
    { q: "What counts as 'functional / better-for-you'?", d: "If sparkling water counts, the 12% target is already met. Agree the definition with the board." },
    { q: "How do Vital and Brightwater fit together?", d: "Avoid cannibalisation; consider migrating Vital into the Brightwater brand." }
  ],

  risks: [
    { r: "Third acquisition underperforms", m: "Ring-fenced unit, separate P&L, integration office, earn-out aligns the sellers" },
    { r: "Brand identity diluted", m: "Founder-led brand council with veto on packaging, flavours and positioning" },
    { r: "Velocity does not improve in conventional grocery", m: "Staged rollout gates; earn-out not paid; expand convenience before grocery" },
    { r: "Leverage above 2.5x", m: "$100M deferred and contingent; $50M rollover; deleverage from EBITDA growth" },
    { r: "AI talent leaves", m: "Retention packages; build an internal team alongside" },
    { r: "PE investor sells to a rival during talks", m: "Exclusivity period; distribution test signed as an early commitment" }
  ],

  kpis: [
    { t: "Functional revenue share", d: "≥12% of revenue by FY29" },
    { t: "Conventional velocity index", d: "From 0.8x to ≥1.0x by FY27" },
    { t: "Concept-to-shelf time", d: "Alderbrook brands from 14 to <6 months" },
    { t: "Share of volume on promotion", d: "Vital from 60% to <35%" },
    { t: "Brightwater gross margin", d: "From 44% to ~50% after in-housing" },
    { t: "Net debt / EBITDA", d: "≤2.5x at close; ≤2.0x by FY28" },
    { t: "Repeat purchase rate", d: "Hold ≥46% within 12 months" },
    { t: "Revenue growth", d: "5–6% a year by FY29" }
  ],

  /* ---------- Q5 ---------- */
  useCases: [
    { t: "Trend sensing to concept", tag: "Speed",
      d: "Scale Brightwater's tools for social, review-site and retailer-data trend tracking across Alderbrook's portfolio, replacing annual consumer panels.",
      m: "Concept-to-shelf from 14 months to under 6" },
    { t: "Outlet-level launch targeting", tag: "Velocity",
      d: "Use weekly sales data from 110,000 outlets to find conventional and convenience outlets that resemble Brightwater's strong natural-channel stores, and launch there first.",
      m: "Lift conventional velocity from 0.8x to 1.0x or better" },
    { t: "Promotion and price optimisation", tag: "Margin",
      d: "Run test-and-learn pricing with outlet data to cut promotion dependence on Vital and new launches.",
      m: "Promoted share of volume from 60% to under 35%" },
    { t: "Demand forecasting for DSD and plants", tag: "Cost",
      d: "Forecast SKU demand by outlet to plan the move to Alderbrook can lines and DSD replenishment, reducing out-of-stocks and waste.",
      m: "Fewer out-of-stocks; higher plant utilisation (68% today)" }
  ],

  capabilities: [
    { t: "Acquire (with Brightwater)", items: ["5 AI and trend specialists and their tool stack", "90-day launch process and seasonal flavour playbook", "Founder-led brand marketing"] },
    { t: "Build (inside Alderbrook)", items: ["Commercial data-science team (team assumption: 8–10 people)", "A data platform joining outlet sales, retailer and social data", "Governance: human sign-off on launches, data quality, no consumer personal data"] },
    { t: "Partner", items: ["Syndicated retail scan data for benchmarking", "Cloud analytics platform rather than building in-house", "Agency support for social listening at scale"] }
  ],

  /* ---------- Appendix ---------- */
  assumptions: [
    ["Alderbrook FY25 revenue $1.8B, +2%, EBITDA $270M, net debt $324M", "fact"],
    ["Board limit 2.5x net debt / EBITDA; covenant 3.5x", "fact"],
    ["FY29 ambition: 5–6% growth, ≥12% functional revenue, ≥11% operating margin", "fact"],
    ["Brightwater: $95M revenue, 44% GM, −2% EBITDA, $450M price + $12M + $30M", "fact"],
    ["Brightwater velocity: 2.1x natural, 0.8x conventional; 18% co-pack premium", "fact"],
    ["Marrow Lane: $48M revenue, 13% EBITDA, $170M price + $6M", "fact"],
    ["FY29 revenue gap $240–324M; functional gap ~$240–250M", "calc"],
    ["Functional revenue = Vital only (sparkling water excluded)", "assume"],
    ["Marrow Lane integration cost $10M (not given in case)", "assume"],
    ["Deal structure: $300M upfront, $50M rollover, up to $100M earn-out", "assume"],
    ["Value = FY29 run-rate EBITDA × exit multiple, discounted 4 years; interim cash flows ignored", "assume"],
    ["Exit multiples 12–16x and 9% discount rate: illustrative", "assume"],
    ["Integration spend counted at close in the leverage test (conservative)", "assume"],
    ["Partnership: $10M set-up, 8% net margin on routed revenue", "assume"]
  ],

  aiNote: "We used Claude (Anthropic) to structure the issue tree, check the case arithmetic, build and stress-test the financial model, challenge our option scoring and scaffold this dashboard's code. Every figure was checked against the case exhibit. Assumptions are labelled as such and were reviewed and set by the team. The choice of option, the deal structure, the scoring weights and the final recommendation are our team's own judgment.",

  /* ---------- Team ---------- */
  team: [
    { name: "Kumar Ashwini", roll: "PGP41426", college: "IIM Lucknow", course: "PGP (MBA)", role: "Team Member",
      cv: "assets/cv/Kumar_Ashwini_PGP41426_CV.pdf" },
    { name: "Pankaj Goswami", roll: "PGP41434", college: "IIM Lucknow", course: "PGP (MBA)", role: "Team Member",
      cv: "assets/cv/Pankaj_Goswami_PGP41434_CV.pdf" }
  ]
};
