(() => {
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

  // Event wiring
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

  loadConfig();
})();
