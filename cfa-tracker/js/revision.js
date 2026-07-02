const REVISION_GAPS = [

    1,
    3,
    7,
    14,
    30

];

initializeRevisionEngine();

function initializeRevisionEngine() {

    renderRevisionQueue();

}

function getRevisionData() {

    return getData("revisionData");

}

function saveRevisionData(data) {

    saveData("revisionData", data);

}

function buildRevisionModel() {

    const sessions =
        getData(STORAGE_KEYS.sessions);

    const revisions =
        getRevisionData();

    sessions.forEach(session => {

        const key = session.module;

        if (!revisions[key]) {

            revisions[key] = {

                module:
                    session.module,

                confidence: 1,

                revisionCount: 0,

                nextRevision:
                    calculateNextRevision(0)

            };

        }

    });

    saveRevisionData(revisions);

}

function calculateNextRevision(count) {

    const gap =
        REVISION_GAPS[
            Math.min(
                count,
                REVISION_GAPS.length - 1
            )
        ];

    const next =
        new Date();

    next.setDate(
        next.getDate() + gap
    );

    return next;

}

function renderRevisionQueue() {

    buildRevisionModel();

    const revisions =
        getRevisionData();

    const body =
        document.getElementById(
            "revisionBody"
        );

    body.innerHTML = "";

    Object.values(revisions)

        .forEach(item => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${item.module}</td>

                <td>
                    ${item.confidence}/5
                </td>

                <td>
                    ${item.revisionCount}
                </td>

                <td>
                    ${new Date(
                        item.nextRevision
                    ).toLocaleDateString()}
                </td>

                <td>

                    <button
                        onclick="completeRevision('${item.module}')">

                        Revise

                    </button>

                </td>

            `;

            body.appendChild(row);

        });

}

function completeRevision(module) {

    const revisions =
        getRevisionData();

    revisions[module].revisionCount++;

    saveRevisionData(revisions);

    renderRevisionQueue();

}
