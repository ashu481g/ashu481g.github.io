function getNeglectedModules() {

    const sessions =
        getData(STORAGE_KEYS.sessions);

    const moduleMap = {};

    sessions.forEach(session => {

        const key = session.module;

        const date =
            new Date(session.endTime);

        if (
            !moduleMap[key] ||
            moduleMap[key] < date
        ) {

            moduleMap[key] = date;

        }

    });

    const neglected = [];

    Object.keys(moduleMap)
        .forEach(module => {

            const diffDays =
                Math.floor(

                    (
                        new Date() -
                        moduleMap[module]

                    ) /

                    (1000 * 60 * 60 * 24)

                );

            if (diffDays >= 7) {

                neglected.push({

                    module,

                    days: diffDays

                });

            }

        });

    return neglected;

}

function getWeakModules() {

    const sessions =
        getData(STORAGE_KEYS.sessions);

    const analytics = {};

    sessions.forEach(session => {

        const key = session.module;

        if (!analytics[key]) {

            analytics[key] = {

                minutes: 0,

                completed: false

            };

        }

        analytics[key].minutes +=
            session.durationMinutes;

        if (session.completed)
            analytics[key].completed = true;

    });

    const weak = [];

    Object.keys(analytics)
        .forEach(key => {

            const data =
                analytics[key];

            const hours =
                data.minutes / 60;

            if (
                hours >= 5 &&
                !data.completed
            ) {

                weak.push({

                    module: key,

                    hours:
                        hours.toFixed(1)

                });

            }

        });

    return weak;

}
