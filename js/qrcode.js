const BADGE_DEFAULTS = {
  companyName: "JDE PEET'S", showCompany: true, showName: true, showLogo: false, showFileName: false, showPhoto: false, showAso: false,
  primaryColor: '#66783e', secondaryColor: '#dfe8cf', backgroundColor: '#ffffff', textColor: '#17221c',
  alignment: 'center', borderWidth: 1, borderColor: '#dfe4d7', radius: 16, spacing: 0,
  companySize: 22, nameSize: 22, qrSize: 220, layoutPreset: 'corporate', photoSize: 92, asoSize: 16, logoWidth: 105, logoHeight: 32, logoOpacity: 100,
  positions: { company: { x: 50, y: 34 }, photo: { x: 50, y: 88 }, qr: { x: 50, y: 192 }, name: { x: 50, y: 388 }, aso: { x: 50, y: 430 }, logo: { x: 18, y: 438 } },
  zIndexes: { company: 1, photo: 2, qr: 3, name: 4, aso: 5, logo: 6 }
};
function getBadgeSettings() { const saved = window.SHECARD_ACTIVE_LAYOUT || {}; return { ...BADGE_DEFAULTS, ...saved, positions: { ...BADGE_DEFAULTS.positions, ...(saved.positions || {}) }, zIndexes: { ...BADGE_DEFAULTS.zIndexes, ...(saved.zIndexes || {}) } }; }
function renderQr(container, url, size, colorDark = '#000000', colorLight = '#FFFFFF') {
  const qrUrl = url || '';
  if (!container || !qrUrl) return;
  const cache = window.SHECARD_QR_CACHE || (window.SHECARD_QR_CACHE = new Map());
  const cacheKey = `${qrUrl}|${size}|${colorDark}|${colorLight}`;
  if (container.dataset.qrKey === cacheKey && container.childElementCount) return;
  const render = () => {
    const started = performance.now();
    if (cache.has(cacheKey)) { container.replaceChildren(...cache.get(cacheKey).map((node) => node.cloneNode(true))); container.dataset.qrKey = cacheKey; return; }
    container.replaceChildren();
    new QRCode(container, { text: qrUrl, width: size, height: size, colorDark, colorLight, correctLevel: QRCode.CorrectLevel.H });
    const canvas = container.querySelector('canvas');
    const image = container.querySelector('img');
    if (image) { image.style.setProperty('display', 'block', 'important'); image.width = size; image.height = size; image.style.width = `${size}px`; image.style.height = `${size}px`; image.alt = 'QR Code'; if (canvas) canvas.remove(); }
    else if (canvas) { canvas.style.setProperty('display', 'block', 'important'); canvas.width = size; canvas.height = size; canvas.style.width = `${size}px`; canvas.style.height = `${size}px`; }
    cache.set(cacheKey, [...container.childNodes].map((node) => node.cloneNode(true)));
    container.dataset.qrKey = cacheKey;
    console.log(`QR gerado em ${((performance.now() - started) / 1000).toFixed(3)}s`);
  };
  let attempts = 0;
  const renderWhenReady = () => {
    if (container.isConnected && window.QRCode) {
      try { render(); } catch (error) { console.error('Falha ao gerar QR Code:', error); if (attempts++ < 120) requestAnimationFrame(renderWhenReady); }
    } else if (attempts++ < 120) requestAnimationFrame(renderWhenReady);
    else console.error('QR Code indisponível após aguardar a biblioteca:', qrUrl);
  };
  renderWhenReady();
}
function formatValidityDate(value) { if (!value) return ''; const text = String(value).trim(); if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) { const [year, month, day] = text.slice(0, 10).split('-'); return `${day}/${month}/${year}`; } if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text; const date = value instanceof Date || /^(?:\w{3} )?\w{3} \d{1,2} \d{4}/.test(text) ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` : text; }
function applyLayerStyle(element, key, settings) { const position = settings.positions[key] || BADGE_DEFAULTS.positions[key]; const parent = element.offsetParent || element.parentElement; const parentWidth = parent?.clientWidth || 340; const parentHeight = parent?.clientHeight || 480; const fallbackWidth = key === 'photo' ? Number(settings.photoSize) || 92 : key === 'qr' ? Math.max(100, Math.min(300, Number(settings.qrSize) || 220)) + 20 : key === 'logo' ? Number(settings.logoWidth) || 105 : 284; const centerOffset = (element.offsetWidth || fallbackWidth) / 2; const left = (Number(position.x) || 0) / 100 * parentWidth - centerOffset; const top = Math.max(0, Number(position.y) || 0) / 480 * parentHeight; element.style.setProperty('left', `${left}px`, 'important'); element.style.setProperty('top', `${top}px`, 'important'); element.style.setProperty('z-index', `${Number(settings.zIndexes[key]) || 1}`, 'important'); }
function createBadgeElement(badge, overrideSettings = null) {
  const source = overrideSettings || getBadgeSettings(); const settings = { ...BADGE_DEFAULTS, ...source, positions: { ...BADGE_DEFAULTS.positions, ...(source.positions || {}) }, zIndexes: { ...BADGE_DEFAULTS.zIndexes, ...(source.zIndexes || {}) } }; const card = document.createElement('article'); card.className = 'badge-card layered-badge'; card.dataset.badgeId = badge.id;
  card.style.setProperty('--badge-primary', settings.primaryColor); card.style.setProperty('--badge-secondary', settings.secondaryColor); card.style.setProperty('--badge-bg', settings.backgroundColor); card.style.setProperty('--badge-text', settings.textColor); card.style.setProperty('--badge-radius', `${settings.radius}px`); card.style.setProperty('--badge-border-width', `${settings.borderWidth}px`); card.style.setProperty('--badge-border-color', settings.borderColor); card.innerHTML = '<div class="badge-content"><div class="badge-company" data-layout-element="company"></div><div class="badge-photo" data-layout-element="photo"></div><div class="badge-qr" data-layout-element="qr"></div><div class="badge-person" data-layout-element="name"></div><div class="badge-aso" data-layout-element="aso"></div></div>';
  const company = card.querySelector('.badge-company'); const photo = card.querySelector('.badge-photo'); const qr = card.querySelector('.badge-qr'); const person = card.querySelector('.badge-person'); const aso = card.querySelector('.badge-aso'); const elements = { company, photo, qr, name: person, aso };
  company.textContent = settings.companyName; person.textContent = badge.name; company.style.fontSize = `${settings.companySize}px`; person.style.fontSize = `${settings.nameSize}px`; company.style.color = settings.primaryColor; person.style.color = settings.textColor; if (!settings.showCompany) company.remove(); if (!settings.showName) person.remove();
  if (settings.showPhoto && (badge.photoData || badge.photoPlaceholder)) { if (badge.photoData) { const image = document.createElement('img'); image.src = badge.photoData; image.alt = `Foto de ${badge.name}`; photo.appendChild(image); } else { photo.textContent = 'FOTO'; photo.classList.add('badge-photo-placeholder'); } photo.style.width = `${settings.photoSize}px`; photo.style.height = `${settings.photoSize}px`; photo.style.setProperty('border-radius', `${settings.photoShape === 'square' ? 0 : settings.photoShape === 'rounded' ? 12 : 50}%`, 'important'); } else photo.remove();
  if (settings.showAso && badge.asoValidUntil) { aso.textContent = `VALIDADE: ${formatValidityDate(badge.asoValidUntil)}`; aso.style.fontSize = `${settings.asoSize}px`; aso.style.color = settings.textColor; } else aso.remove();
  const size = Math.max(100, Math.min(300, Number(settings.qrSize) || 220)); qr.style.width = `${size}px`; qr.style.height = `${size}px`; qr.style.setProperty('--badge-qr-size', `${size}px`); qr.dataset.qrUrl = badge.url || ''; qr.dataset.qrSize = `${size}`; renderQr(qr, badge.url, size);
  Object.entries(elements).forEach(([key, element]) => { if (element.parentNode) applyLayerStyle(element, key, settings); });
  if (settings.showLogo) { const logo = document.createElement('img'); logo.className = 'badge-logo'; logo.src = settings.logoData || 'assets/logo.png'; logo.alt = 'Logo'; logo.style.setProperty('width', `${settings.logoWidth || 105}px`, 'important'); logo.style.setProperty('height', `${settings.logoHeight || 32}px`, 'important'); logo.style.setProperty('opacity', `${Math.max(0, Math.min(100, Number(settings.logoOpacity ?? window.SHECARD_LOGO_OPACITY ?? 100))) / 100}`, 'important'); applyLayerStyle(logo, 'logo', settings); card.appendChild(logo); }
  if (settings.showFileName) { const file = document.createElement('small'); file.className = 'badge-file-name'; file.textContent = badge.fileName; card.appendChild(file); } return card;
}
