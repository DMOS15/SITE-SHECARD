document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('history-list');
  const search = document.getElementById('history-search');
  const count = document.getElementById('selection-count');
  const generate = document.getElementById('generate-pdf');
  const selectAll = document.getElementById('select-all');
  const deleteSelected = document.getElementById('delete-selected');
  const exportHistory = document.getElementById('export-history');
  let visible = [];
  const selectedIds = () => [...document.querySelectorAll('.check:checked')].map((input) => input.dataset.id);
  function updateSelection() {
    const ids = selectedIds();
    const allVisibleSelected = visible.length > 0 && visible.every((badge) => ids.includes(badge.id));
    count.textContent = `${ids.length} selecionado(s)`;
    selectAll.textContent = allVisibleSelected ? 'Desmarcar todos' : 'Selecionar todos';
    generate.disabled = ids.length === 0;
    deleteSelected.disabled = ids.length === 0;
    generate.onclick = () => generatePdf(ids.map((id) => getBadges().find((badge) => badge.id === id)).filter(Boolean));
  }
  async function removeBadges(ids) {
    if (!ids.length || !confirm(`Excluir ${ids.length} crachá(s) selecionado(s)?`)) return;
    try { await deleteBadges(ids); render(); } catch (error) { alert(error.message); }
  }
  function render() {
    const term = search.value.trim().toLowerCase();
    visible = getBadges().filter((badge) => `${badge.name} ${badge.company || ''} ${badge.fileName}`.toLowerCase().includes(term));
    list.innerHTML = '';
    document.getElementById('history-empty').classList.toggle('hidden', visible.length > 0);
    visible.forEach((badge) => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `<input class="check" type="checkbox" data-id="${badge.id}"><div class="history-main"><strong></strong><small></small></div><time class="history-date"></time><div class="history-actions"><button class="button button-light use-button">Usar</button><button class="button button-light delete-button">Excluir</button></div>`;
      row.querySelector('strong').textContent = badge.name;
      row.querySelector('small').textContent = `${badge.company || 'Empresa não informada'} · ${badge.fileName}.html`;
      row.querySelector('time').textContent = new Date(badge.createdAt).toLocaleString('pt-BR');
      row.querySelector('.use-button').onclick = () => { location.href = `index.html?badge=${encodeURIComponent(badge.id)}`; };
      row.querySelector('.delete-button').onclick = () => removeBadges([badge.id]);
      row.querySelector('.check').onchange = updateSelection;
      list.appendChild(row);
    });
    updateSelection();
  }
  selectAll.onclick = () => { const checkboxes = [...document.querySelectorAll('.check')]; const shouldSelect = checkboxes.some((checkbox) => !checkbox.checked); checkboxes.forEach((checkbox) => { checkbox.checked = shouldSelect; }); updateSelection(); };
  deleteSelected.onclick = () => removeBadges(selectedIds());
  exportHistory.onclick = () => {
    const rows = [['Nome', 'Empresa', 'Nome_Arquivo', 'URL', 'Data']].concat(getBadges().map((badge) => [badge.name, badge.company || '', badge.fileName, badge.url, new Date(badge.createdAt).toLocaleString('pt-BR')]));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = `historico-shecard-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  search.addEventListener('input', render);
  loadBadges().then(render).catch((error) => { list.innerHTML = `<div class="empty-history"><strong>Não foi possível carregar o histórico compartilhado.</strong><span>${error.message}</span></div>`; });
});
