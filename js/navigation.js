const sidebarItems = document.querySelectorAll('.sidebar-item');

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Navigate to the page specified in data-page
        const page = item.getAttribute('data-page');
        window.location.href = page;
    });
});
