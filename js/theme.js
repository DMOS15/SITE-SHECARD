(() => {
  const storageKey = 'shecard-theme';
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(storageKey);
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = initialTheme;

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    const label = toggle?.querySelector('[data-theme-label]');
    if (!toggle || !label) return;

    function applyTheme(theme, persist = true) {
      root.dataset.theme = theme;
      if (persist) localStorage.setItem(storageKey, theme);
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
      label.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
    }

    applyTheme(initialTheme, false);
    toggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  });
})();
