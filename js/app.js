document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('badge-form');
  if (!form) return;
  const nameInput = document.getElementById('name');
  const fileInput = document.getElementById('file-name');
  const urlPreview = document.getElementById('url-preview');
  const previewArea = document.getElementById('preview-area');
  const previewActions = document.getElementById('preview-actions');
  const dialog = document.getElementById('bulk-dialog');
  const rowsBody = document.getElementById('bulk-rows');
  const bulkCount = document.getElementById('bulk-count');
  let current = null;

  function formatAsoDate(value) { if (!value) return ''; const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : value; }
  function readFile(file) { return file ? new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 360 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', 0.78)); }; image.onerror = reject; image.src = reader.result; }; reader.onerror = reject; reader.readAsDataURL(file); }) : Promise.resolve(''); }
  function updateActiveLayout() { const active = getActiveLayoutRecord(); document.getElementById('active-layout').textContent = `Layout ativo: ${active?.nome || 'Layout padrão'}`; }
  function historyFields(extra = {}) { const active = getActiveLayoutRecord(); return { layoutId: active?.id || '', layoutName: active?.nome || 'Layout padrão', layoutTemplate: JSON.stringify(getBadgeSettings()), ...extra }; }
  function updateUrl() { urlPreview.textContent = badgeUrl(fileInput.value.trim() || '[NOME_ARQUIVO]'); }
  function showBadge(badge) { current = badge; previewArea.innerHTML = ''; previewArea.appendChild(createBadgeElement(badge)); previewActions.classList.remove('hidden'); }
  function updateBulkCount() { const rows = [...rowsBody.querySelectorAll('tr')]; const filled = rows.filter((row) => row.querySelector('.bulk-file').value.trim() || row.querySelector('.bulk-name').value.trim()).length; bulkCount.textContent = `${filled} linha(s) preenchida(s)`; }
  function addBulkRow(name = '', fileName = '', asoValidUntil = '') {
    const row = document.createElement('tr');
    row.innerHTML = `<td class="row-number"></td><td><input class="bulk-name" placeholder="ANA MARTINS" autocomplete="off"></td><td><input class="bulk-file" placeholder="12345" autocomplete="off"></td><td><input class="bulk-aso" placeholder="10/09/2027" autocomplete="off"></td><td class="row-action"><button class="remove-row" type="button" aria-label="Remover linha">×</button></td>`;
    row.querySelector('.bulk-file').value = fileName; row.querySelector('.bulk-name').value = name; row.querySelector('.bulk-aso').value = asoValidUntil;
    row.querySelectorAll('input').forEach((input) => { input.addEventListener('input', updateBulkCount); input.addEventListener('keydown', (event) => { if (event.key === 'Enter' || (event.key === 'Tab' && input === row.querySelector('.bulk-name'))) { event.preventDefault(); addBulkRow(); row.nextElementSibling.querySelector('.bulk-file').focus(); } }); });
    row.querySelector('.bulk-name').addEventListener('paste', (event) => { const text = event.clipboardData.getData('text'); if (!text.includes('\t') && !text.includes('\n')) return; event.preventDefault(); fillGridFromClipboard(text); });
    row.querySelector('.bulk-file').addEventListener('paste', (event) => { const text = event.clipboardData.getData('text'); if (!text.includes('\t') && !text.includes('\n')) return; event.preventDefault(); fillGridFromClipboard(text); });
    row.querySelector('.remove-row').onclick = () => { if (rowsBody.children.length > 1) row.remove(); else row.querySelectorAll('input').forEach((input) => { input.value = ''; }); renumberRows(); updateBulkCount(); };
    rowsBody.appendChild(row); renumberRows(); updateBulkCount();
  }
  function fillGridFromClipboard(text) {
    const pastedRows = text.split(/\r?\n/).map((line) => line.split('\t')).filter((columns) => columns.some((value) => value.trim()));
    if (!pastedRows.length) return;
    const dataRows = pastedRows.filter((columns) => !['nome', 'nomecolaborador', 'nome_arquivo', 'nomearquivo'].includes((columns[0] || '').trim().toLowerCase()));
    rowsBody.innerHTML = '';
    dataRows.forEach((columns) => {
      const first = (columns[0] || '').trim();
      const second = (columns[1] || '').trim();
      const firstLooksLikeFile = !/\s/.test(first) && (/\d/.test(first) || first.includes('_'));
      const secondLooksLikeFile = !/\s/.test(second) && (/\d/.test(second) || second.includes('_'));
      const fileIsFirst = firstLooksLikeFile && !secondLooksLikeFile;
      addBulkRow(fileIsFirst ? second : first, fileIsFirst ? first : second, (columns[2] || '').trim());
    });
    addBulkRow();
    rowsBody.querySelector('.bulk-file').focus();
  }
  function renumberRows() { [...rowsBody.children].forEach((row, index) => { row.querySelector('.row-number').textContent = index + 1; }); }
  function openBulk() { rowsBody.innerHTML = ''; document.getElementById('bulk-result').textContent = ''; addBulkRow(); addBulkRow(); dialog.showModal(); rowsBody.querySelector('.bulk-name').focus(); }
  async function importBulk() {
    const records = [...rowsBody.querySelectorAll('tr')].map((row) => ({ fileName: row.querySelector('.bulk-file').value.trim(), name: row.querySelector('.bulk-name').value.trim(), asoValidUntil: row.querySelector('.bulk-aso').value.trim() })).filter((record) => record.fileName || record.name || record.asoValidUntil);
    if (!records.length) { alert('Preencha pelo menos uma linha.'); return; }
    let badges = getBadges(); let count = 0; let invalid = 0; let skipped = 0;
    for (const record of records) {
      if (!record.fileName || !record.name || record.fileName.toLowerCase() === 'nome_arquivo' || record.name.toLowerCase() === 'nome') { invalid += 1; continue; }
      const old = badges.find((item) => item.fileName.toLowerCase() === record.fileName.toLowerCase());
      if (old && !window.confirm(`Este crachá já existe: ${record.fileName}. Deseja substituir?`)) { skipped += 1; continue; }
      badges = badges.filter((item) => item.fileName.toLowerCase() !== record.fileName.toLowerCase());
      badges.unshift({ id: old?.id || crypto.randomUUID(), name: record.name, company: getBadgeSettings().companyName, fileName: record.fileName, url: badgeUrl(record.fileName), createdAt: old?.createdAt || new Date().toISOString(), ...historyFields({ asoValidUntil: record.asoValidUntil }) }); count += 1;
    }
    try { await saveBadges(badges); dialog.close(); rowsBody.innerHTML = ''; renderRecent(); alert(`✓ ${count} colaborador(es) importado(s)\n⚠ ${invalid} linha(s) inválida(s) ignorada(s)${skipped ? `\n↷ ${skipped} duplicado(s) mantido(s)` : ''}`); } catch (error) { alert(error.message); }
  }

  fileInput.addEventListener('input', updateUrl); updateUrl();
  form.addEventListener('submit', async (event) => { event.preventDefault(); const name = nameInput.value.trim(); const fileName = fileInput.value.trim(); if (!name || !fileName) return; const existing = findBadge(fileName); if (existing && !window.confirm('Este crachá já existe. Deseja substituir?')) return; const photoData = await readFile(document.getElementById('photo-upload').files[0]); const badge = { id: existing ? existing.id : crypto.randomUUID(), name, company: getBadgeSettings().companyName, fileName, url: badgeUrl(fileName), createdAt: existing ? existing.createdAt : new Date().toISOString(), ...historyFields({ photoData, asoValidUntil: formatAsoDate(document.getElementById('aso-valid-until').value) }) }; try { await saveBadges([badge, ...getBadges().filter((item) => item.fileName.toLowerCase() !== fileName.toLowerCase())]); form.reset(); updateUrl(); showBadge(badge); renderRecent(); } catch (error) { alert(error.message); } });
  document.getElementById('print-button').addEventListener('click', () => { if (!current) return; document.body.classList.add('print-mode'); setTimeout(() => { window.print(); document.body.classList.remove('print-mode'); }, 100); });
  document.getElementById('single-pdf').addEventListener('click', () => { const card = previewArea.querySelector('.badge-card'); if (current && card) generatePdf([current], document.getElementById('export-stage'), card); });
  document.getElementById('open-bulk').addEventListener('click', openBulk); document.getElementById('close-bulk').addEventListener('click', () => dialog.close()); document.getElementById('cancel-bulk').addEventListener('click', () => dialog.close()); document.getElementById('clear-bulk').addEventListener('click', () => { rowsBody.innerHTML = ''; addBulkRow(); }); document.getElementById('process-bulk').addEventListener('click', importBulk);
  function renderRecent() { const list = document.getElementById('recent-list'); const badges = getBadges().slice(0, 3); list.innerHTML = badges.length ? badges.map((badge) => `<a class="recent-item" href="index.html?badge=${encodeURIComponent(badge.id)}"><span class="recent-avatar">${badge.name[0]}</span><span><strong>${badge.name}</strong><small>${badge.fileName} · ${new Date(badge.createdAt).toLocaleDateString('pt-BR')}</small></span></a>`).join('') : '<div class="empty-history"><strong>Nenhum crachá gerado ainda.</strong><span>Adicione o primeiro colaborador acima.</span></div>'; }
  Promise.all([loadBadges(), loadLayouts()]).then(() => { const params = new URLSearchParams(location.search); const requestedLayout = params.get('layout'); const requested = params.get('badge'); if (requestedLayout) { const layout = getLayouts().find((item) => item.id === requestedLayout); if (layout) activateLayout(layout); } if (requested) { const found = getBadges().find((badge) => badge.id === requested); if (found) { activateBadgeLayout(found); showBadge(found); } } updateActiveLayout(); renderRecent(); }).catch((error) => { alert(error.message); });
});
