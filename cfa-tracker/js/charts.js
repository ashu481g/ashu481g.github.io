renderSubjectHoursChart();

renderModuleStatusChart();

renderSessionTypeChart();

renderTopModulesChart();

function renderSubjectHoursChart() {

    const data =
        getSubjectHours();

    new Chart(

        document.getElementById(
            "subjectHoursChart"
        ),

        {

            type: "bar",

            data: {

                labels:
                    Object.keys(data),

                datasets: [{

                    label:
                        "Hours",

                    data:
                        Object.values(data)
                        .map(v => (v/60).toFixed(1))

                }]

            }

        }

    );

}

function renderModuleStatusChart() {

    const data =
        getModuleStatusDistribution();

    new Chart(

        document.getElementById(
            "moduleStatusChart"
        ),

        {

            type: "doughnut",

            data: {

                labels: [

                    "Completed",
                    "In Progress",
                    "Not Started"

                ],

                datasets: [{

                    data: [

                        data.completed,
                        data.inProgress,
                        data.notStarted

                    ]

                }]

            }

        }

    );

}

function renderSessionTypeChart() {

    const data =
        getSessionTypeDistribution();

    new Chart(

        document.getElementById(
            "sessionTypeChart"
        ),

        {

            type: "pie",

            data: {

                labels:
                    Object.keys(data),

                datasets: [{

                    data:
                        Object.values(data)
                        .map(v => (v/60).toFixed(1))

                }]

            }

        }

    );

}

function renderTopModulesChart() {

    const data =
        getTopModules();

    new Chart(

        document.getElementById(
            "difficultModulesChart"
        ),

        {

            type: "bar",

            data: {

                labels:
                    data.map(x => x[0]),

                datasets: [{

                    label:
                        "Hours",

                    data:
                        data.map(x =>
                            (x[1]/60).toFixed(1)
                        )

                }]

            },

            options: {

                indexAxis: 'y'

            }

        }

    );

}
