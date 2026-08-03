/* ==========================================================================
   doa4u — Light / Dark Theme Controller
   Persistent LocalStorage state, HTML attribute toggle & icon updates
   ========================================================================== */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'doa4u_theme';
    this.themeToggleBtn = null;
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.setTheme(savedTheme);

    document.addEventListener('DOMContentLoaded', () => {
      this.themeToggleBtn = document.getElementById('theme-toggle');
      if (this.themeToggleBtn) {
        this.updateButtonIcon(savedTheme);
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
      }
    });
  }

  setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateButtonIcon(theme);
  }

  toggleTheme() {
    const currentTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  updateButtonIcon(theme) {
    if (!this.themeToggleBtn) return;
    const icon = this.themeToggleBtn.querySelector('i');
    if (!icon) return;

    if (theme === 'light') {
      icon.className = 'fa-solid fa-sun';
      this.themeToggleBtn.setAttribute('aria-label', 'Tukar ke tema malam');
    } else {
      icon.className = 'fa-solid fa-moon';
      this.themeToggleBtn.setAttribute('aria-label', 'Tukar ke tema siang');
    }
  }
}

// Instantiate globally
window.ThemeManagerInstance = new ThemeManager();
