let activeSession = null;

let timerInterval = null;

initializeSessionEngine();

function initializeSessionEngine() {

    populateSubjects();

}

function populateSubjects() {

    const subjectSelect =
        document.getElementById(
            "subjectSelect"
        );

    subjectSelect.innerHTML = "";

    Object.keys(syllabus)
        .forEach(subject => {

            const option =
                document.createElement("option");

            option.value = subject;

            option.innerText = subject;

            subjectSelect.appendChild(option);

        });

    populateModules();

    subjectSelect.addEventListener(
        "change",
        populateModules
    );

}

function populateModules() {

    const subject =
        document.getElementById(
            "subjectSelect"
        ).value;

    const moduleSelect =
        document.getElementById(
            "moduleSelect"
        );

    moduleSelect.innerHTML = "";

    syllabus[subject]
        .forEach(module => {

            const option =
                document.createElement("option");

            option.value = module;

            option.innerText = module;

            moduleSelect.appendChild(option);

        });

}

function startSession() {

    if (activeSession) {

        alert(
            "A session is already active."
        );

        return;

    }

    activeSession = {

        subject:
            document.getElementById(
                "subjectSelect"
            ).value,

        module:
            document.getElementById(
                "moduleSelect"
            ).value,

        sessionType:
            document.getElementById(
                "sessionType"
            ).value,

        notes:
            document.getElementById(
                "sessionNotes"
            ).value,

        startTime:
            new Date()

    };

    timerInterval =
        setInterval(updateTimer, 1000);

}

function updateTimer() {

    if (!activeSession) return;

    const now =
        new Date();

    const diff =
        now - activeSession.startTime;

    const hours =
        Math.floor(diff / 3600000);

    const minutes =
        Math.floor(
            (diff % 3600000) / 60000
        );

    const seconds =
        Math.floor(
            (diff % 60000) / 1000
        );

    document.getElementById(
        "liveTimer"
    ).innerText =

        `${pad(hours)}:` +
        `${pad(minutes)}:` +
        `${pad(seconds)}`;

}

function endSession() {

    if (!activeSession) {

        alert("No active session.");

        return;

    }

    activeSession.endTime =
        new Date();

    const durationMs =
        activeSession.endTime -
        activeSession.startTime;

    activeSession.durationMinutes =
        Math.round(durationMs / 60000);

    activeSession.completed =
        confirm(
            "Mark module completed?"
        );

    saveSession(activeSession);

    clearInterval(timerInterval);

    activeSession = null;

    document.getElementById(
        "liveTimer"
    ).innerText = "00:00:00";

    alert("Session saved.");

    location.reload();

}

function saveSession(session) {

    const sessions =
        getData(STORAGE_KEYS.sessions);

    sessions.push(session);

    saveData(
        STORAGE_KEYS.sessions,
        sessions
    );

}

function pad(num) {

    return num.toString()
              .padStart(2, "0");

}
