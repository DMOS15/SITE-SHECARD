(() => {
  function install() {
    const width = document.getElementById('logo-width');
    const form = document.getElementById('settings-form');
    if (!width || !form) return;
    const label = document.createElement('label');
    label.innerHTML = 'Logo opacidade <output id="logo-opacity-value">100%</output><input id="logo-opacity" type="range" min="0" max="100" value="100">';
    width.closest('.range-grid').appendChild(label);
    const input = label.querySelector('#logo-opacity');
    const output = label.querySelector('#logo-opacity-value');
    const updatePreview = () => {
      output.textContent = `${input.value}%`;
      window.SHECARD_LOGO_OPACITY = Number(input.value);
      const logo = document.querySelector('#editor-preview-area .badge-logo');
      if (logo) logo.style.opacity = String(Number(input.value) / 100);
    };
    input.addEventListener('input', updatePreview);
    const syncFromLayout = () => {
      const value = Number(window.SHECARD_ACTIVE_LAYOUT?.logoOpacity);
      if (Number.isFinite(value) && document.activeElement !== input) input.value = value;
      updatePreview();
    };
    const syncTimer = setInterval(syncFromLayout, 250);
    setTimeout(() => clearInterval(syncTimer), 15000);
    const showSyncTime = () => {
      const status = document.getElementById('layout-status');
      const stamp = getLastSharedSync?.();
      if (status && stamp) status.textContent = `Layouts sincronizados em ${new Date(stamp).toLocaleString('pt-BR')}`;
    };
    setTimeout(showSyncTime, 500);
    window.addEventListener('shecard:data-updated', showSyncTime);
    form.addEventListener('submit', () => {
      setTimeout(async () => {
        const active = getActiveLayoutRecord();
        if (!active) return;
        try {
          const template = JSON.parse(active.template || '{}');
          template.logoOpacity = Number(input.value);
          const saved = await saveLayout({ ...active, template: JSON.stringify(template) });
          const current = saved.find((layout) => layout.id === active.id);
          if (current) activateLayout(current);
        } catch (error) { console.warn('Não foi possível sincronizar a opacidade da logo:', error.message); }
      }, 0);
    });
    updatePreview();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
