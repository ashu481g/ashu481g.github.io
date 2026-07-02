function exportBackup() {

    const backup = {

        version: "1.0",

        exportedAt:
            new Date().toISOString(),

        sessions:
            getData(STORAGE_KEYS.sessions),

        weeklyPlans:
            getData(STORAGE_KEYS.weeklyPlans),

        errorLogs:
            getData(STORAGE_KEYS.errorLogs)

    };

    const blob =
        new Blob(

            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],

            {
                type: "application/json"
            }

        );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "cfa-backup.json";

    link.click();

}

/* =========================
   IMPORT BACKUP
========================= */

function importBackup() {

    const fileInput =
        document.getElementById(
            "backupFile"
        );

    const file =
        fileInput.files[0];

    if (!file) {

        alert(
            "Please select a backup file."
        );

        return;
    }

    const reader =
        new FileReader();

    reader.onload =
        function(event) {

            try {

                const backup =
                    JSON.parse(
                        event.target.result
                    );

                /* Restore Sessions */

                if (backup.sessions) {

                    saveData(
                        STORAGE_KEYS.sessions,
                        backup.sessions
                    );

                }

                /* Restore Weekly Plans */

                if (backup.weeklyPlans) {

                    saveData(
                        STORAGE_KEYS.weeklyPlans,
                        backup.weeklyPlans
                    );

                }

                /* Restore Error Logs */

                if (backup.errorLogs) {

                    saveData(
                        STORAGE_KEYS.errorLogs,
                        backup.errorLogs
                    );

                }

                alert(
                    "Backup imported successfully."
                );

                location.reload();

            }

            catch (error) {

                console.error(error);

                alert(
                    "Invalid backup file."
                );

            }

        };

    reader.readAsText(file);

}