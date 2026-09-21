(() => {

  window.addEventListener("error", event => {
    const target = event.target;
    if (target && target.tagName === "SCRIPT") {
      console.error("Math Practice asset failed to load:", target.src);
    }
  }, true);

  "use strict";

  const DEFAULT_CONFIG = {
    digitOptions: [1, 2, 3, 4, 5],
    questionOptions: [5, 10, 20, 30],
    multiplicationTableMax: 10,
    operations: {
      addition: { label: "ADDITION", icon: "➕", upperDigits: [1,2,3,4,5], lowerDigits: [1,2,3,4,5] },
      subtraction: { label: "SUBTRACTION", icon: "➖", upperDigits: [1,2,3,4,5], lowerDigits: [1,2,3,4,5] },
      multiplication: { label: "MULTIPLICATION", icon: "✖️", upperDigits: [1,2,3,4], lowerDigits: [1,2,3] },
      division: { label: "DIVISION", icon: "➗", upperDigits: [1,2,3,4,5], lowerDigits: [1,2,3] }
    }
  };

  let config = DEFAULT_CONFIG;
  let selectedOperation = "addition";
  let settings = { upperDigits: 2, lowerDigits: 2, totalQuestions: 10 };
  let currentProblem = null;
  let answered = false;
  let sessionStart = null;
  let session = createEmptySession();

  const $ = (id) => document.getElementById(id);
  const screens = ["welcomeScreen", "configurationScreen", "practiceScreen", "summaryScreen"];

  function createEmptySession() {
    return {
      totalQuestions: 10,
      currentQuestion: 0,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      operationStats: {
        addition: { attempted: 0, correct: 0, incorrect: 0 },
        subtraction: { attempted: 0, correct: 0, incorrect: 0 },
        multiplication: { attempted: 0, correct: 0, incorrect: 0 },
        division: { attempted: 0, correct: 0, incorrect: 0 }
      }
    };
  }

  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function digitRange(digits) {
    const min = digits === 1 ? 1 : 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return [min, max];
  }

  function generateNumberByDigits(digits) {
    const [min, max] = digitRange(digits);
    return randomInteger(min, max);
  }

  function generateAdditionProblem() {
    const upperNumber = generateNumberByDigits(settings.upperDigits);
    const lowerNumber = generateNumberByDigits(settings.lowerDigits);
    return makeProblem("addition", upperNumber, lowerNumber, upperNumber + lowerNumber);
  }

  function generateSubtractionProblem() {
    const [upperMin, upperMax] = digitRange(settings.upperDigits);
    const [lowerMin, lowerMax] = digitRange(settings.lowerDigits);

    // Generate directly within the selected digit ranges while guaranteeing a non-negative result.
    let upperNumber, lowerNumber;
    if (upperMax < lowerMin) {
      upperNumber = randomInteger(upperMin, upperMax);
      lowerNumber = randomInteger(lowerMin, lowerMax);
      // This combination cannot satisfy upper >= lower.
      throw new Error("Subtraction settings cannot produce a non-negative problem.");
    }
    upperNumber = randomInteger(Math.max(upperMin, lowerMin), upperMax);
    lowerNumber = randomInteger(lowerMin, Math.min(lowerMax, upperNumber));
    return makeProblem("subtraction", upperNumber, lowerNumber, upperNumber - lowerNumber);
  }

  function generateMultiplicationProblem() {
    const upperNumber = generateNumberByDigits(settings.upperDigits);
    const lowerNumber = generateNumberByDigits(settings.lowerDigits);
    return makeProblem("multiplication", upperNumber, lowerNumber, upperNumber * lowerNumber);
  }

  function generateDivisionProblem() {
    const [dividendMin, dividendMax] = digitRange(settings.upperDigits);
    const [divisorMin, divisorMax] = digitRange(settings.lowerDigits);

    // Construct dividend = divisor * quotient, then verify dividend digit count.
    for (let attempt = 0; attempt < 300; attempt++) {
      const divisor = randomInteger(divisorMin, divisorMax);
      const quotientMin = Math.max(1, Math.ceil(dividendMin / divisor));
      const quotientMax = Math.floor(dividendMax / divisor);
      if (quotientMin <= quotientMax) {
        const quotient = randomInteger(quotientMin, quotientMax);
        const dividend = divisor * quotient;
        if (String(dividend).length === settings.upperDigits) {
          return makeProblem("division", dividend, divisor, quotient);
        }
      }
    }
    throw new Error("We couldn't create a problem with those settings. Please try a different digit combination.");
  }

  function makeProblem(operation, upperNumber, lowerNumber, correctAnswer) {
    return { operation, upperNumber, lowerNumber, correctAnswer };
  }

  function generateProblem() {
    switch (selectedOperation) {
      case "addition": return generateAdditionProblem();
      case "subtraction": return generateSubtractionProblem();
      case "multiplication": return generateMultiplicationProblem();
      case "division": return generateDivisionProblem();
      default: throw new Error("Unknown operation.");
    }
  }

  function generateMultiplicationTable(number) {
    const max = Number(config.multiplicationTableMax) || 10;
    return Array.from({ length: max }, (_, i) => `${number} × ${i + 1} = ${(number * (i + 1))}`);
  }

  function calculateAccuracy() {
    return session.attempted === 0 ? 0 : Math.round((session.correct / session.attempted) * 100);
  }

  function showScreen(id) {
    activateMainTab("mathTab", false);
    screens.forEach(screenId => $(screenId).classList.toggle("active", screenId === id));
    const inPractice = id === "practiceScreen";
    $("headerEndBtn").classList.toggle("hidden", !inPractice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderOperationCards() {
    $("operationCards").innerHTML = "";
    Object.entries(config.operations).forEach(([key, op]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "operation-card";
      button.innerHTML = `<span class="operation-icon" aria-hidden="true">${op.icon}</span>
        <span class="operation-name">${op.label}</span>`;
      button.setAttribute("aria-label", `Practice ${op.label.toLowerCase()}`);
      button.addEventListener("click", () => openConfiguration(key));
      $("operationCards").appendChild(button);
    });
    const saved = safeStorageGet("mathPracticePrefs");
    $("savedNote").textContent = saved ? "Your last practice settings are ready to reuse." : "";
  }

  function openConfiguration(operation) {
    selectedOperation = operation;
    const op = config.operations[operation];
    $("configIcon").textContent = op.icon;
    $("configTitle").textContent = titleCase(op.label);
    populateDigitSelectors();
    loadSavedPrefs();
    renderQuestionOptions();
    clearConfigMessage();
    showScreen("configurationScreen");
  }

  function titleCase(s) {
    return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function populateDigitSelectors() {
    const op = config.operations[selectedOperation];
    populateSelect($("upperDigits"), op.upperDigits, settings.upperDigits);
    populateSelect($("lowerDigits"), op.lowerDigits, settings.lowerDigits);
    ensureValidDefaults();
  }

  function populateSelect(select, options, preferred) {
    select.innerHTML = "";
    options.forEach(d => {
      const option = document.createElement("option");
      option.value = d;
      option.textContent = `${d} digit${d === 1 ? "" : "s"}`;
      option.selected = Number(preferred) === d;
      select.appendChild(option);
    });
  }

  function ensureValidDefaults() {
    const upperOptions = [...$("upperDigits").options].map(o => Number(o.value));
    const lowerOptions = [...$("lowerDigits").options].map(o => Number(o.value));
    if (!upperOptions.includes(Number(settings.upperDigits))) settings.upperDigits = upperOptions.includes(2) ? 2 : upperOptions[0];
    if (!lowerOptions.includes(Number(settings.lowerDigits))) settings.lowerDigits = lowerOptions.includes(2) ? 2 : lowerOptions[0];
    $("upperDigits").value = settings.upperDigits;
    $("lowerDigits").value = settings.lowerDigits;
  }

  function renderQuestionOptions() {
    const container = $("questionOptions");
    container.innerHTML = "";
    const options = [...config.questionOptions, "untilStop"];
    options.forEach(value => {
      const id = `questions-${String(value).replace(/\W/g, "")}`;
      const wrapper = document.createElement("div");
      wrapper.className = "question-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "questionCount";
      input.id = id;
      input.value = value;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = value === "untilStop" ? "Practice Until I Stop" : value;
      wrapper.append(input, label);
      container.appendChild(wrapper);
    });
    const selected = String(settings.totalQuestions) === "untilStop" ? "untilStop" : String(settings.totalQuestions);
    const target = container.querySelector(`input[value="${selected}"]`) || container.querySelector('input[value="10"]');
    if (target) target.checked = true;
  }

  function readConfiguration() {
    settings.upperDigits = Number($("upperDigits").value);
    settings.lowerDigits = Number($("lowerDigits").value);
    const selected = document.querySelector('input[name="questionCount"]:checked');
    settings.totalQuestions = selected ? (selected.value === "untilStop" ? "untilStop" : Number(selected.value)) : 10;
  }

  function validateConfiguration() {
    const upper = settings.upperDigits;
    const lower = settings.lowerDigits;

    if (selectedOperation === "subtraction" && upper < lower) {
      return "For subtraction, the Upper Number must have at least as many digits as the Lower Number.";
    }

    if (selectedOperation === "division") {
      let possible = false;
      const [dMin, dMax] = digitRange(upper);
      const [vMin, vMax] = digitRange(lower);
      for (let divisor = vMin; divisor <= Math.min(vMax, vMin + 5000) && !possible; divisor++) {
        const qMin = Math.max(1, Math.ceil(dMin / divisor));
        const qMax = Math.floor(dMax / divisor);
        if (qMin <= qMax) possible = true;
      }
      if (!possible) return "We couldn't create a whole-number division problem with those settings. Please try a different digit combination.";
    }
    return "";
  }

  function startSession() {
    readConfiguration();
    const error = validateConfiguration();
    if (error) {
      showConfigMessage(error);
      return;
    }

    session = createEmptySession();
    session.totalQuestions = settings.totalQuestions;
    sessionStart = Date.now();
    savePrefs();
    showScreen("practiceScreen");
    startNextQuestion();
  }

  function startNextQuestion() {
    answered = false;
    $("feedbackPanel").className = "feedback-panel hidden";
    $("feedbackPanel").innerHTML = "";
    $("helpPanel").classList.add("hidden");
    $("helpPanel").innerHTML = "";
    $("practiceNextActions").classList.add("hidden");
    $("practiceNextActions").innerHTML = "";
    $("submitAnswerBtn").disabled = false;
    $("answerInput").disabled = false;
    $("answerInput").value = "";
    $("answerInput").focus();

    try {
      currentProblem = generateProblem();
    } catch (error) {
      showPracticeGenerationError(error.message);
      return;
    }

    session.currentQuestion = session.attempted + 1;
    renderProblem();
  }

  function renderProblem() {
    const p = currentProblem;
    const opSymbol = { addition: "+", subtraction: "−", multiplication: "×", division: "÷" }[p.operation];
    $("practiceTitle").textContent = config.operations[p.operation].label;
    $("questionProgress").textContent = session.totalQuestions === "untilStop"
      ? `Question ${session.currentQuestion}`
      : `Question ${session.currentQuestion} of ${session.totalQuestions}`;

    $("problemDisplay").innerHTML = `
      <div class="problem-row">${p.upperNumber}</div>
      <div class="problem-row operator-row">${opSymbol} ${p.lowerNumber}</div>`;
    $("helpBtn").classList.toggle("hidden", !["multiplication", "division"].includes(p.operation));
  }

  function submitAnswer() {
    if (answered) return;
    const raw = $("answerInput").value.trim();
    if (!raw) {
      showFeedbackMessage("Please enter your answer.", "incorrect", true);
      $("answerInput").focus();
      return;
    }
    if (!/^-?\d+$/.test(raw)) {
      showFeedbackMessage("Please enter a valid whole number.", "incorrect", true);
      $("answerInput").focus();
      return;
    }

    const childAnswer = Number(raw);
    if (!Number.isSafeInteger(childAnswer)) {
      showFeedbackMessage("Please enter a valid whole number.", "incorrect", true);
      return;
    }

    answered = true;
    $("submitAnswerBtn").disabled = true;
    $("answerInput").disabled = true;
    recordAnswer(childAnswer === currentProblem.correctAnswer);
    renderFeedback(childAnswer);
    renderNextActions();
  }

  function recordAnswer(isCorrect) {
    session.attempted += 1;
    if (isCorrect) session.correct += 1;
    else session.incorrect += 1;
    const stat = session.operationStats[selectedOperation];
    stat.attempted += 1;
    if (isCorrect) stat.correct += 1;
    else stat.incorrect += 1;
  }

  function renderFeedback(childAnswer) {
    const correct = childAnswer === currentProblem.correctAnswer;
    const panel = $("feedbackPanel");
    panel.className = `feedback-panel ${correct ? "correct" : "incorrect"}`;
    panel.innerHTML = correct
      ? `<div class="feedback-title">🎉 Excellent!</div>
         <p class="feedback-detail">You got it right.</p>
         <p class="feedback-detail"><strong>${formatProblem(currentProblem)} = ${currentProblem.correctAnswer}</strong></p>`
      : `<div class="feedback-title">Good try!</div>
         <p class="feedback-detail">Your answer: <strong>${childAnswer}</strong></p>
         <p class="feedback-detail">Correct answer: <strong>${currentProblem.correctAnswer}</strong></p>
         <p class="feedback-detail">Let's try another one.</p>`;
    panel.classList.remove("hidden");
  }

  function formatProblem(p) {
    const symbols = { addition: "+", subtraction: "−", multiplication: "×", division: "÷" };
    return `${p.upperNumber} ${symbols[p.operation]} ${p.lowerNumber}`;
  }

  function renderNextActions() {
    const box = $("practiceNextActions");
    box.innerHTML = "";
    box.classList.remove("hidden");

    if (session.totalQuestions !== "untilStop" && session.attempted >= session.totalQuestions) {
      box.appendChild(makeButton("VIEW RESULTS", "primary-button", finishSession));
      return;
    }

    box.appendChild(makeButton("NEXT QUESTION", "primary-button", startNextQuestion));
    if (session.totalQuestions === "untilStop") {
      box.appendChild(makeButton("CHANGE PROBLEM TYPE", "secondary-button", () => {
        closeHelp();
        showScreen("welcomeScreen");
      }));
    }
  }

  function makeButton(text, className, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener("click", handler);
    return btn;
  }

  function toggleHelp() {
    const panel = $("helpPanel");
    if (!panel.classList.contains("hidden")) {
      closeHelp();
      return;
    }
    const multiplier = currentProblem.lowerNumber;

    // For multiplication, show the table for every individual digit in the
    // lower number. For example, 27 × 6 shows the 6 table, while 27 × 26
    // shows both the 2 and 6 tables. Duplicate digits are shown only once.
    const tableNumbers = currentProblem.operation === "multiplication"
      ? [...new Set(String(multiplier).split("").map(Number))]
      : [multiplier];

    const tablesHtml = tableNumbers.map(number => {
      const table = generateMultiplicationTable(number);
      return `<div class="help-table-group">
        <div class="help-table-heading">${number} Times Table</div>
        <div class="table-list">${table.map(line => `<div>${line}</div>`).join("")}</div>
      </div>`;
    }).join("");

    const relationshipText = currentProblem.operation === "division"
      ? `For division, think: ${multiplier} × ? = ${currentProblem.upperNumber}`
      : `Use the table(s) above to work out ${currentProblem.upperNumber} × ${multiplier}.`;

    panel.innerHTML = `<div class="help-title">💡 Helpful Table${tableNumbers.length > 1 ? "s" : ""}</div>
      ${tablesHtml}
      <p style="margin:12px 0 0;color:#657089;font-size:.92rem;">${relationshipText}</p>`;
    panel.classList.remove("hidden");
  }

  function closeHelp() {
    $("helpPanel").classList.add("hidden");
    $("helpPanel").innerHTML = "";
  }

  function finishSession() {
    closeHelp();
    renderSummary();
    showScreen("summaryScreen");
  }

  function renderSummary() {
    const accuracy = calculateAccuracy();
    $("summaryMessage").textContent = accuracy >= 90 ? "Fantastic work! 🌟" : accuracy >= 70 ? "Great effort! 🎉" : "Keep practicing — every question helps you learn!";
    $("summaryStats").innerHTML = `
      ${statCard(session.attempted, "Questions Attempted")}
      ${statCard(session.correct, "Correct Answers")}
      ${statCard(session.incorrect, "Incorrect Answers")}
      ${statCard(`${accuracy}%`, "Accuracy")}`;
    const elapsed = sessionStart ? Math.max(0, Math.round((Date.now() - sessionStart) / 1000)) : 0;
    const duration = elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`;

    const labels = { addition: "Addition", subtraction: "Subtraction", multiplication: "Multiplication", division: "Division" };
    $("operationStats").innerHTML = Object.entries(session.operationStats)
      .filter(([, s]) => s.attempted > 0)
      .map(([key, s]) => {
        const acc = s.attempted ? Math.round((s.correct / s.attempted) * 100) : 0;
        return `<div class="operation-stat">
          <div class="operation-stat-title">${config.operations[key].icon} ${labels[key]}</div>
          <div class="operation-stat-detail">Questions: ${s.attempted} · Correct: ${s.correct} · Incorrect: ${s.incorrect} · Accuracy: ${acc}%</div>
        </div>`;
      }).join("") + `<div class="operation-stat">
        <div class="operation-stat-title">⏱️ Session Duration</div>
        <div class="operation-stat-detail">${duration}</div>
      </div>`;
  }

  function statCard(value, label) {
    return `<div class="stat-card"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>`;
  }

  function requestEndSession() {
    $("confirmModal").classList.remove("hidden");
    $("confirmEndBtn").focus();
  }

  function closeEndModal() {
    $("confirmModal").classList.add("hidden");
  }

  function confirmEnd() {
    closeEndModal();
    finishSession();
  }

  function showConfigMessage(message) {
    $("configMessage").textContent = message;
    $("configMessage").classList.remove("hidden");
  }
  function clearConfigMessage() {
    $("configMessage").classList.add("hidden");
    $("configMessage").textContent = "";
  }
  function showFeedbackMessage(message, type, temporary = false) {
    const panel = $("feedbackPanel");
    panel.className = `feedback-panel ${type}`;
    panel.innerHTML = `<div class="feedback-title">${message}</div>`;
    panel.classList.remove("hidden");
    if (temporary) {
      setTimeout(() => {
        if (!answered) panel.classList.add("hidden");
      }, 2200);
    }
  }
  function showPracticeGenerationError(message) {
    $("feedbackPanel").className = "feedback-panel incorrect";
    $("feedbackPanel").innerHTML = `<div class="feedback-title">Let's adjust the settings.</div><p>${message}</p>
      <button type="button" class="secondary-button" id="practiceConfigBtn">CHANGE SETTINGS</button>`;
    $("feedbackPanel").classList.remove("hidden");
    $("practiceConfigBtn").addEventListener("click", () => openConfiguration(selectedOperation));
  }

  function savePrefs() {
    safeStorageSet("mathPracticePrefs", JSON.stringify({
      operation: selectedOperation,
      upperDigits: settings.upperDigits,
      lowerDigits: settings.lowerDigits,
      totalQuestions: settings.totalQuestions
    }));
  }

  function loadSavedPrefs() {
    const saved = safeStorageGet("mathPracticePrefs");
    if (!saved) {
      settings = { upperDigits: 2, lowerDigits: 2, totalQuestions: 10 };
      return;
    }
    try {
      const prefs = JSON.parse(saved);
      if (prefs.operation === selectedOperation) {
        settings.upperDigits = Number(prefs.upperDigits) || settings.upperDigits;
        settings.lowerDigits = Number(prefs.lowerDigits) || settings.lowerDigits;
        settings.totalQuestions = prefs.totalQuestions ?? 10;
      } else {
        settings = { upperDigits: 2, lowerDigits: 2, totalQuestions: 10 };
      }
    } catch {
      settings = { upperDigits: 2, lowerDigits: 2, totalQuestions: 10 };
    }
  }

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* optional only */ }
  }

  async function loadConfig() {
    try {
      const response = await fetch("data/config.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Config fetch failed");
      const external = await response.json();
      config = mergeConfig(DEFAULT_CONFIG, external);
    } catch {
      config = DEFAULT_CONFIG;
    }
    renderOperationCards();
  }

  function mergeConfig(base, external) {
    return {
      ...base,
      ...external,
      digitOptions: external.digitOptions || base.digitOptions,
      questionOptions: external.questionOptions || base.questionOptions,
      multiplicationTableMax: external.multiplicationTableMax || base.multiplicationTableMax,
      operations: { ...base.operations, ...(external.operations || {}) }
    };
  }


  // ---------------------------------------------------------------------------
  // Online Daily Super Car
  // Source: Wikimedia Commons public/Creative Commons media.
  // A fresh Commons search is made whenever the page opens / car tab is opened.
  // ---------------------------------------------------------------------------
  const carSearchTerms = [
    "Ferrari supercar", "Lamborghini supercar", "McLaren supercar",
    "Bugatti supercar", "Koenigsegg supercar", "Aston Martin supercar",
    "Porsche supercar", "Pagani supercar", "Mercedes AMG supercar"
  ];

  let onlineCars = [];
  let selectedOnlineCar = 0;

  // Local file:// pages cannot reliably use fetch() for cross-origin APIs.
  // GitHub and MediaWiki both support JSONP GET requests, so use JSONP only
  // for local-file testing; normal GitHub Pages HTTPS uses fetch/CORS.
  function jsonpRequest(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const callbackName = `__mathPracticeJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";
      let settled = false;

      const cleanup = () => {
        delete window[callbackName];
        script.remove();
        clearTimeout(timer);
      };

      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn(value);
      };

      window[callbackName] = payload => finish(resolve, payload);
      script.onerror = () => finish(reject, new Error("Online request failed."));
      script.src = `${url}${separator}callback=${encodeURIComponent(callbackName)}`;
      document.head.appendChild(script);

      const timer = setTimeout(() => {
        finish(reject, new Error("Online request timed out."));
      }, timeoutMs);
    });
  }

  function isLocalFile() {
    return window.location.protocol === "file:";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
  }

  function dailySeed() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  function hashString(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async function fetchCommonsCars() {
    const seed = dailySeed();
    const term = carSearchTerms[hashString(seed) % carSearchTerms.length];
    const endpoint = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: term,
      gsrnamespace: "6",
      gsrlimit: "12",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "1100",
      format: "json",
      origin: "*"
    });

    let data;
    if (isLocalFile()) {
      data = await jsonpRequest(endpoint);
    } else {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("Wikimedia Commons request failed.");
      data = await response.json();
    }

    const pages = Object.values(data.query?.pages || {});
    const cars = pages.map(page => {
      const info = page.imageinfo?.[0];
      const meta = info?.extmetadata || {};
      const description = String(meta.ImageDescription?.value || "").replace(/<[^>]*>/g, "");
      const artist = String(meta.Artist?.value || "").replace(/<[^>]*>/g, "");
      const license = String(meta.LicenseShortName?.value || meta.License?.value || "See Wikimedia Commons");
      return {
        title: page.title?.replace(/^File:/, "") || "Supercar",
        image: info?.thumburl || info?.url,
        pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || "")}`,
        description: description.slice(0, 500),
        artist: artist.slice(0, 250),
        license: license.slice(0, 120)
      };
    }).filter(car => car.image);

    if (!cars.length) throw new Error("No suitable car images were returned.");
    onlineCars = cars;
    selectedOnlineCar = hashString(`${dailySeed()}-${term}`) % onlineCars.length;
    renderOnlineCar();
  }

  function renderOnlineCar() {
    if (!onlineCars.length) {
      $("carViewer").innerHTML = `
        <div class="online-status">
          <strong>Loading today's supercar…</strong>
          <p>Getting a fresh car picture from Wikimedia Commons.</p>
        </div>`;
      return;
    }

    const car = onlineCars[selectedOnlineCar];
    $("carDateText").textContent =
      `Today's online supercar • ${dailySeed()} • refreshed from Wikimedia Commons`;
    $("carViewer").innerHTML = `
      <div class="online-car-poster">
        <img class="online-car-image"
             src="${escapeHtml(car.image)}"
             alt="${escapeHtml(car.title)}"
             referrerpolicy="no-referrer"
             loading="eager">
        <div class="car-name">${escapeHtml(car.title)}</div>
        ${car.description ? `<p class="car-fact">${escapeHtml(car.description)}</p>` : ""}
        <div class="image-credit">
          <strong>Photo / media credit:</strong> ${escapeHtml(car.artist || "Wikimedia Commons contributor")}
          <br><strong>License:</strong> ${escapeHtml(car.license)}
          <br><a href="${escapeHtml(car.pageUrl)}" target="_blank" rel="noopener noreferrer">View source on Wikimedia Commons ↗</a>
        </div>
      </div>`;
  }

  async function renderDailyCar() {
    renderOnlineCar();
    try {
      await fetchCommonsCars();
    } catch (error) {
      $("carViewer").innerHTML = `
        <div class="online-status error">
          <strong>We couldn't load an online car picture.</strong>
          <p>Please check your internet connection and open the tab again.</p>
          <button id="retryCarBtn" class="secondary-button" type="button">TRY AGAIN</button>
        </div>`;
      $("retryCarBtn")?.addEventListener("click", renderDailyCar);
    }
  }

  // ---------------------------------------------------------------------------
  // Online English / Hindi Children's Stories
  // Source: Global Pratham Books Project, which provides StoryWeaver source
  // stories in English and Hindi under open licenses.
  // A story catalogue and one story are fetched online whenever the tab opens.
  // ---------------------------------------------------------------------------
  const storyRepoBase = "https://api.github.com/repos/global-asp/pb-source/contents/";
  const storyRawBase = "https://raw.githubusercontent.com/global-asp/pb-source/master/";
  let storyLanguage = "en";
  let onlineStories = [];
  let selectedOnlineStory = null;

  async function fetchOnlineStories(language) {
    const catalogueUrl = `${storyRepoBase}${language}?per_page=100`;
    let files;
    if (isLocalFile()) {
      const payload = await jsonpRequest(catalogueUrl);
      files = payload.data;
      if (!Array.isArray(files)) throw new Error("Story catalogue returned an unexpected response.");
    } else {
      const response = await fetch(catalogueUrl, {
        cache: "no-store",
        headers: { "Accept": "application/vnd.github+json" }
      });
      if (!response.ok) throw new Error("Story catalogue request failed.");
      files = await response.json();
    }

    const candidates = files.filter(file =>
      file.type === "file" && /\.md$/i.test(file.name) && !/^readme\.md$/i.test(file.name)
    );
    if (!candidates.length) throw new Error("No online stories were found for this language.");

    // Randomize a small set for the story picker, then fetch one immediately.
    onlineStories = candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
      .map(file => ({
        name: file.name,
        url: storyRawBase + `${language}/` + encodeURIComponent(file.name)
      }));

    await loadOnlineStory(onlineStories[0]);
    renderOnlineStoryPicker();
  }

  function markdownToReadableText(markdown) {
    return markdown
      .replace(/\r/g, "")
      .replace(/^---[\s\S]*?---\s*/m, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/`{1,3}/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function extractStoryTitle(markdown, filename) {
    const heading = markdown.match(/^#\s+(.+)$/m);
    if (heading) return heading[1].trim();
    return filename.replace(/\.md$/i, "").replace(/[-_]+/g, " ");
  }

  function decodeBase64Utf8(base64) {
    const binary = atob(base64.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }

  async function loadOnlineStory(storyFile) {
    $("comicViewer").innerHTML = `
      <div class="online-status">
        <strong>Loading a fresh story…</strong>
        <p>Fetching today's reading story from the online StoryWeaver collection.</p>
      </div>`;

    let markdown;
    if (isLocalFile()) {
      const apiFileUrl =
        `${storyRepoBase}${storyLanguage}/${encodeURIComponent(storyFile.name)}?ref=master`;
      const payload = await jsonpRequest(apiFileUrl);
      const content = payload.data?.content;
      if (!content) throw new Error("Story content was not returned.");
      markdown = decodeBase64Utf8(content);
    } else {
      const response = await fetch(storyFile.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Story text request failed.");
      markdown = await response.text();
    }

    const title = extractStoryTitle(markdown, storyFile.name);
    const readable = markdownToReadableText(markdown);
    const paragraphs = readable
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)
      .slice(0, 18);

    selectedOnlineStory = {
      ...storyFile,
      title,
      paragraphs
    };
    renderOnlineStory();
  }

  function renderOnlineStoryPicker() {
    const picker = $("comicPicker");
    picker.innerHTML = "";
    onlineStories.forEach((story, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = story.name.replace(/\.md$/i, "").replace(/[-_]+/g, " ");
      button.addEventListener("click", async () => {
        try {
          await loadOnlineStory(story);
          [...picker.children].forEach((child, i) => child.classList.toggle("active", i === index));
        } catch {
          showOnlineStoryError();
        }
      });
      picker.appendChild(button);
    });
    if (picker.firstElementChild) picker.firstElementChild.classList.add("active");
  }

  function renderOnlineStory() {
    if (!selectedOnlineStory) return;
    const langName = storyLanguage === "hi" ? "हिन्दी" : "English";
    $("comicViewer").innerHTML = `
      <div class="online-story-header">
        <div class="eyebrow">ONLINE STORY • ${langName}</div>
        <div class="comic-title">${escapeHtml(selectedOnlineStory.title)}</div>
        <p class="comic-subtitle">Fetched fresh from the open Pratham Books / StoryWeaver source collection.</p>
      </div>
      <div class="online-story-body">
        ${selectedOnlineStory.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("")}
      </div>
      <div class="story-credit">
        Source: <a href="https://github.com/global-asp/pb-source" target="_blank" rel="noopener noreferrer">Global Pratham Books Project ↗</a>
        · StoryWeaver / Pratham Books content is openly licensed; individual story metadata should be checked for its specific license.
      </div>`;
  }

  function showOnlineStoryError() {
    $("comicViewer").innerHTML = `
      <div class="online-status error">
        <strong>We couldn't load the online story.</strong>
        <p>Please check your internet connection and try again.</p>
        <button id="retryStoryBtn" class="secondary-button" type="button">TRY AGAIN</button>
      </div>`;
    $("retryStoryBtn")?.addEventListener("click", () => loadOnlineContent());
  }

  async function loadOnlineContent() {
    try {
      await fetchOnlineStories(storyLanguage);
    } catch (error) {
      showOnlineStoryError();
    }
  }

  async function setComicLanguage(language) {
    storyLanguage = language;
    $("englishComicBtn").classList.toggle("active", language === "en");
    $("hindiComicBtn").classList.toggle("active", language === "hi");
    selectedOnlineStory = null;
    onlineStories = [];
    $("comicPicker").innerHTML = "";
    await loadOnlineContent();
  }

  // Load online content on tab open.
  function activateMainTab(tabId, loadContent = true) {
    document.querySelectorAll(".main-tab").forEach(button => {
      button.classList.toggle("active", button.dataset.tab === tabId);
    });
    document.querySelectorAll(".main-tab-content").forEach(content => {
      content.classList.toggle("active", content.id === tabId);
    });
    if (loadContent && tabId === "comicsTab") loadOnlineContent();
    if (loadContent && tabId === "carsTab") renderDailyCar();
  }


  // Event wiring
  document.querySelectorAll("[data-fallback-operation]").forEach(button => {
    button.addEventListener("click", () => openConfiguration(button.dataset.fallbackOperation));
  });

  $("startPracticeBtn").addEventListener("click", startSession);
  $("submitAnswerBtn").addEventListener("click", submitAnswer);
  $("answerInput").addEventListener("keydown", e => {
    if (e.key === "Enter") submitAnswer();
  });
  $("helpBtn").addEventListener("click", toggleHelp);
  $("practiceEndBtn").addEventListener("click", requestEndSession);
  $("headerEndBtn").addEventListener("click", requestEndSession);
  $("confirmEndBtn").addEventListener("click", confirmEnd);
  $("cancelEndBtn").addEventListener("click", closeEndModal);
  $("newSessionBtn").addEventListener("click", () => {
    session = createEmptySession();
    openConfiguration(selectedOperation);
  });
  $("summaryChangeBtn").addEventListener("click", () => showScreen("welcomeScreen"));
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.back));
  });
  $("upperDigits").addEventListener("change", () => { settings.upperDigits = Number($("upperDigits").value); });
  $("lowerDigits").addEventListener("change", () => { settings.lowerDigits = Number($("lowerDigits").value); });

  document.querySelectorAll(".main-tab").forEach(button => {
    button.addEventListener("click", () => activateMainTab(button.dataset.tab));
  });
  $("englishComicBtn").addEventListener("click", () => setComicLanguage("en"));
  $("hindiComicBtn").addEventListener("click", () => setComicLanguage("hi"));
  // Core Maths UI is initialized immediately. Online content is fetched
  // only when its tab is selected, so an API/network problem can never
  // prevent the Maths section from appearing.
  screens.forEach(screenId => $(screenId).classList.toggle("active", screenId === "welcomeScreen"));
  activateMainTab("mathTab", false);
  loadConfig();
})();
