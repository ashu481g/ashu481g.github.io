function getSessions() {

    return getData(STORAGE_KEYS.sessions);

}

function getSubjectHours() {

    const sessions = getSessions();

    const subjectHours = {};

    sessions.forEach(session => {

        if (!subjectHours[session.subject]) {

            subjectHours[session.subject] = 0;

        }

        subjectHours[session.subject] +=
            session.durationMinutes || 0;

    });

    return subjectHours;

}

function getModuleStatusDistribution() {

    const sessions = getSessions();

    let completed = 0;
    let inProgress = 0;

    const studiedModules = new Set();

    sessions.forEach(session => {

        const key = session.module;

        studiedModules.add(key);

        if (session.completed)
            completed++;

        else
            inProgress++;

    });

    let totalModules = 0;

    Object.keys(syllabus).forEach(subject => {

        totalModules +=
            syllabus[subject].length;

    });

    const notStarted =
        totalModules - studiedModules.size;

    return {

        completed,
        inProgress,
        notStarted

    };

}

function getTopModules() {

    const sessions = getSessions();

    const moduleHours = {};

    sessions.forEach(session => {

        const key = session.module;

        if (!moduleHours[key]) {

            moduleHours[key] = 0;

        }

        moduleHours[key] +=
            session.durationMinutes || 0;

    });

    return Object.entries(moduleHours)

        .sort((a,b) => b[1] - a[1])

        .slice(0, 10);

}
