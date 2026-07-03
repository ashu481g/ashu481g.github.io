loadSidebar();

async function loadSidebar() {

    const sidebarContainer =
        document.getElementById(
            "sidebarContainer"
        );

    if (!sidebarContainer) return;

    const response =
        await fetch("components/sidebar.html");

    const html =
        await response.text();

    sidebarContainer.innerHTML = html;

}
