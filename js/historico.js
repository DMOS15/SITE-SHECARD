document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('history-list');
  const search = document.getElementById('history-search');
  const count = document.getElementById('selection-count');
  const generate = document.getElementById('generate-pdf');
  const selectAll = document.getElementById('select-all');
  const deleteSelected = document.getElementById('delete-selected');
  const exportHistory = document.getElementById('export-history');
  const refreshHistory = document.getElementById('refresh-history');
  const previousPage = document.getElementById('history-previous');
  const nextPage = document.getElementById('history-next');
  const pageLabel = document.getElementById('history-page');
  const pageSize = 50;
  let page = 1;
  let visible = [];
  const selected = new Set();
  const selectedIds = () => [...selected];
  const selectedPanel = document.getElementById('selected-panel');
  const selectedList = document.getElementById('selected-list');
  const selectedTotal = document.getElementById('selected-total');
  const syncStatus = document.getElementById('history-sync-status');
  function renderSelected() {
    const records = selectedIds().map((id) => getBadges().find((badge) => badge.id === id)).filter(Boolean);
    selectedPanel.classList.toggle('hidden', records.length === 0);
    selectedTotal.textContent = records.length;
    selectedList.innerHTML = records.map((badge) => `<span class="selected-person">✓ ${badge.name}</span>`).join('');
  }
  async function generateSelected(print = false) {
    const selectedBadges = selectedIds().map((id) => getBadges().find((badge) => badge.id === id)).filter(Boolean);
    if (!selectedBadges.length) return;
    const cards = selectedBadges.map((badge) => createBadgeElement(badge, badge.layoutTemplate ? layoutToSettings({ template: badge.layoutTemplate }) : getBadgeSettings()));
    if (print) {
      const stage = document.getElementById('pdf-export-container'); stage.replaceChildren(...cards); window.print();
    } else await generateBadgePDF(cards, document.getElementById('pdf-export-container'));
  }
  function updateSelection() {
    const ids = selectedIds();
    const allVisibleSelected = visible.length > 0 && visible.every((badge) => selected.has(badge.id));
    count.textContent = `${ids.length} selecionado(s)`;
    selectAll.textContent = allVisibleSelected ? 'Desmarcar todos' : 'Selecionar todos';
    generate.disabled = ids.length === 0;
    deleteSelected.disabled = ids.length === 0;
    generate.onclick = async () => {
      generate.disabled = true;
      try {
        const selectedBadges = ids.map((id) => getBadges().find((badge) => badge.id === id)).filter(Boolean);
        console.log('Iniciando geração em lote');
        console.log('Quantidade selecionada:', selectedBadges.length);
        const cards = selectedBadges.map((badge) => {
          console.log('Processando crachá:', badge.id);
          console.log('Layout:', badge.layoutName || badge.layout || 'Layout padrão');
          console.log('Foto:', badge.photoData || badge.photo || 'Sem foto');
          console.log('QR:', badge.url || badge.qrUrl || 'Sem QR');
          const settings = badge.layoutTemplate ? layoutToSettings({ template: badge.layoutTemplate }) : getBadgeSettings();
          return createBadgeElement(badge, settings);
        });
        await generateBadgePDF(cards, document.getElementById('pdf-export-container'));
      } catch (error) { console.error('Erro ao gerar PDF em lote:', error); alert('Erro ao gerar PDF. Verifique o console.'); }
      finally { generate.disabled = false; }
    };
  }
  async function removeBadges(ids) {
    if (!ids.length || !confirm(`Excluir ${ids.length} crachá(s) selecionado(s)?`)) return;
    try { await deleteBadges(ids); ids.forEach((id) => selected.delete(id)); render(); } catch (error) { alert(error.message); }
  }
  function render() {
    const term = search.value.trim().toLowerCase();
    visible = getBadges().filter((badge) => `${badge.name} ${badge.company || ''} ${badge.fileName}`.toLowerCase().includes(term));
    const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    page = Math.min(page, totalPages);
    const pageBadges = visible.slice((page - 1) * pageSize, page * pageSize);
    list.innerHTML = '';
    document.getElementById('history-empty').classList.toggle('hidden', visible.length > 0);
    pageBadges.forEach((badge) => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `<input class="check" type="checkbox" data-id="${badge.id}" ${selected.has(badge.id) ? 'checked' : ''}><div class="history-main"><strong></strong><small></small><em class="history-layout"></em></div><time class="history-date"></time><div class="history-actions"><button class="button button-light use-button">Usar</button><button class="button button-light delete-button">Excluir</button></div>`;
      row.querySelector('strong').textContent = badge.name;
      row.querySelector('small').textContent = `${badge.company || 'Empresa não informada'} · ${badge.fileName}.html`;
      row.querySelector('.history-layout').textContent = `Layout: ${badge.layoutName || 'Layout padrão'}`;
      row.querySelector('time').textContent = new Date(badge.createdAt).toLocaleString('pt-BR');
      row.querySelector('.use-button').onclick = () => { activateBadgeLayout(badge); location.href = `index.html?badge=${encodeURIComponent(badge.id)}`; };
      row.querySelector('.delete-button').onclick = () => removeBadges([badge.id]);
      row.querySelector('.check').onchange = (event) => { if (event.target.checked) selected.add(badge.id); else selected.delete(badge.id); updateSelection(); };
      list.appendChild(row);
    });
    pageLabel.textContent = `Página ${page} de ${totalPages}`;
    previousPage.disabled = page <= 1;
    nextPage.disabled = page >= totalPages;
    updateSelection();
    renderSelected();
  }
  selectAll.onclick = () => { const shouldSelect = visible.some((badge) => !selected.has(badge.id)); visible.forEach((badge) => shouldSelect ? selected.add(badge.id) : selected.delete(badge.id)); render(); };
  deleteSelected.onclick = () => removeBadges(selectedIds());
  document.getElementById('clear-selection').onclick = () => { selected.clear(); render(); };
  document.getElementById('selected-generate-pdf').onclick = () => generateSelected();
  document.getElementById('selected-print').onclick = () => generateSelected(true);
  exportHistory.onclick = () => {
    const rows = [['Nome', 'Empresa', 'Nome_Arquivo', 'Layout', 'URL', 'Data']].concat(getBadges().map((badge) => [badge.name, badge.company || '', badge.fileName, badge.layoutName || 'Layout padrão', badge.url, new Date(badge.createdAt).toLocaleString('pt-BR')]));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = `historico-shecard-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  search.addEventListener('input', () => { page = 1; render(); });
  previousPage.onclick = () => { if (page > 1) { page -= 1; render(); } };
  nextPage.onclick = () => { if (page < Math.ceil(visible.length / pageSize)) { page += 1; render(); } };
  refreshHistory.onclick = async () => { refreshHistory.disabled = true; syncStatus.textContent = 'Sincronizando com a equipe...'; try { await refreshSharedData(); render(); } catch (error) { syncStatus.textContent = `Cache local mantido. ${error.message}`; } finally { refreshHistory.disabled = false; } };
  window.addEventListener('shecard:data-updated', render);
  render();
  if (getLastSharedSync()) syncStatus.textContent = `Última sincronização: ${new Date(getLastSharedSync()).toLocaleString('pt-BR')}`;
  Promise.all([loadBadges(), loadLayouts()]).then(() => { syncStatus.textContent = getLastSharedSync() ? `Última sincronização: ${new Date(getLastSharedSync()).toLocaleString('pt-BR')}` : 'Sincronizado agora'; render(); }).catch((error) => { syncStatus.textContent = `Cache local mantido. ${error.message}`; render(); });
});
