// ========================================
// NAVIGATION - Bottom Tab Navigation
// ========================================

// Inisialisasi tab navigation
export function initNavigation(onTabChange) {
    const navItems = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.dataset.tab;

            navItems.forEach(nav => nav.classList.remove('active'));
            tabs.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const activeTab = document.getElementById(`${tabName}Tab`);
            if (activeTab) activeTab.classList.add('active');

            if (onTabChange) onTabChange(tabName);
        });
    });
}

// Switch ke tab tertentu secara programatis
export function switchToTab(tabName) {
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (targetNav) targetNav.click();
}