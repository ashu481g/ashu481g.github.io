renderInsights();

function renderInsights() {

    const container =
        document.getElementById(
            "insightsContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    renderNeglectedModules(container);

    renderWeakModules(container);

}

function addInsight(

    container,
    title,
    text,
    type = ""

) {

    const div =
        document.createElement("div");

    div.className =
        `insight-card ${type}`;

    div.innerHTML = `

        <h4>${title}</h4>

        <p>${text}</p>

    `;

    container.appendChild(div);

}

function renderNeglectedModules(container) {

    const neglected =
        getNeglectedModules();

    neglected
        .slice(0,5)
        .forEach(module => {

            addInsight(

                container,

                "Neglected Module",

                `${module.module}
                 not studied for
                 ${module.days} days.`,

                "warning"

            );

        });

}

function renderWeakModules(container) {

    const weak =
        getWeakModules();

    weak
        .slice(0,5)
        .forEach(module => {

            addInsight(

                container,

                "Weak Module Detected",

                `${module.module}
                 has consumed
                 ${module.hours} hours
                 but remains incomplete.`,

                "warning"

            );

        });

}
