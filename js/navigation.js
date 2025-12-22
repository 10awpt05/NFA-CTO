const sidebarItems = document.querySelectorAll('.sidebar-item');

sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {

        // 🚫 Skip logout button
        if (item.classList.contains('logout')) return;

        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Navigate to the page specified in data-page
        const page = item.getAttribute('data-page');
        if (page) window.location.href = page;
    });
});


const settingsItem = document.getElementById("settingsItem");

settingsItem.addEventListener("click", () => {
    settingsItem.classList.toggle("open");
});
