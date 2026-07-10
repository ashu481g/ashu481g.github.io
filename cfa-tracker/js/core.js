const STORAGE_KEYS = {

    sessions: "cfa_sessions",

    weeklyPlans: "cfa_weekly_plans",

    errorLogs: "cfa_error_logs"

};

initializeDashboard();

function initializeDashboard() {

    initializeStorage();

    renderKPIs();

}

function initializeStorage() {

    Object.values(STORAGE_KEYS)
        .forEach(key => {

            if (!localStorage.getItem(key)) {

                localStorage.setItem(
                    key,
                    JSON.stringify([])
                );

            }

        });

}

function getData(key) {

    return JSON.parse(

        localStorage.getItem(key)

    ) || [];

}

function saveData(key, data) {

    localStorage.setItem(

        key,

        JSON.stringify(data)

    );

}

function renderKPIs() {

    const sessions =
        getData(STORAGE_KEYS.sessions);

    const totalMinutes =
        sessions.reduce(

            (sum, session) =>

                sum +
                (session.durationMinutes || 0),

            0

        );

    const completedModules =
        sessions.filter(
            session => session.completed
        ).length;

    document.getElementById(
        "totalHours"
    ).innerText =

        (totalMinutes / 60).toFixed(1);

    document.getElementById(
        "totalSessions"
    ).innerText =

        sessions.length;

    document.getElementById(
        "modulesCompleted"
    ).innerText =

        completedModules;

    const examDate =
        new Date("2026-08-18");

    const today =
        new Date();

    const diff =
        Math.ceil(

            (examDate - today) /

            (1000 * 60 * 60 * 24)

        );

    document.getElementById(
        "daysRemaining"
    ).innerText = diff;

}

function resetAllData() {

    const confirmReset = confirm(
        "Delete all CFA study data?"
    );

    if (!confirmReset) return;

    localStorage.removeItem("cfa_sessions");

    localStorage.removeItem("cfa_weekly_plans");

    localStorage.removeItem("cfa_error_logs");

    alert("Study data reset successfully.");

    location.reload();
}

function openResetModal() {

    document.getElementById(
        "resetModal"
    ).style.display = "flex";

}

function closeResetModal() {

    document.getElementById(
        "resetModal"
    ).style.display = "none";

}

function confirmResetData() {

    if (
        document.getElementById(
            "resetSessions"
        ).checked
    ) {

        localStorage.removeItem(
            STORAGE_KEYS.sessions
        );

    }

    if (
        document.getElementById(
            "resetPlans"
        ).checked
    ) {

        localStorage.removeItem(
            STORAGE_KEYS.weeklyPlans
        );

    }

    if (
        document.getElementById(
            "resetErrors"
        ).checked
    ) {

        localStorage.removeItem(
            STORAGE_KEYS.errorLogs
        );

    }

    alert("Selected data deleted.");

    closeResetModal();

    location.reload();

}