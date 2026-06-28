// ========================================
// THEME - Dark mode management
// ========================================

// Inisialisasi dark mode dari localStorage
export function initTheme() {
    const savedDarkMode = localStorage.getItem('kantongin_darkmode') === 'true';
    const darkModeToggle = document.getElementById('darkModeToggle');

    if (savedDarkMode) {
        document.body.setAttribute('data-theme', 'dark');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('kantongin_darkmode', 'true');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('kantongin_darkmode', 'false');
            }
        });
    }
}

// Toggle dark mode manual
export function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('kantongin_darkmode', 'false');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('kantongin_darkmode', 'true');
    }

    // Update toggle switch jika ada
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = !isDark;
}