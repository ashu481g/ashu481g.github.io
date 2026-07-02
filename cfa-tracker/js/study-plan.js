initializeStudyPlan();

function initializeStudyPlan() {

    renderStudyPlan();

}

function renderStudyPlan() {

    const container =
        document.getElementById(
            "studyPlanContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    let weekCounter = 1;

    Object.entries(syllabus)
        .forEach(([subject, modules]) => {

            const phaseDiv =
                document.createElement("div");

            phaseDiv.className =
                "planner-phase";

            phaseDiv.innerHTML = `

                <h2>${subject}</h2>

            `;

            modules.forEach(module => {

                const weekDiv =
                    document.createElement("div");

                weekDiv.className =
                    "planner-week";

                weekDiv.innerHTML = `

                    <h3>
                        Week ${weekCounter}
                    </h3>

                    <p>
                        Target Hours: 20
                    </p>

                    <ul>

                        <li>${module}</li>

                    </ul>

                `;

                phaseDiv.appendChild(weekDiv);

                weekCounter++;

            });

            container.appendChild(phaseDiv);

        });

}