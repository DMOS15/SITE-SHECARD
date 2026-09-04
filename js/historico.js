document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('history-list');
  const search = document.getElementById('history-search');
  const count = document.getElementById('selection-count');
  const generate = document.getElementById('generate-pdf');
  const selectAll = document.getElementById('select-all');
  const deleteSelected = document.getElementById('delete-selected');
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
  function removeBadges(ids) {
    if (!ids.length || !confirm(`Excluir ${ids.length} crachá(s) selecionado(s)?`)) return;
    saveBadges(getBadges().filter((badge) => !ids.includes(badge.id)));
    render();
  }
  function render() {
    const term = search.value.trim().toLowerCase();
    visible = getBadges().filter((badge) => `${badge.name} ${badge.fileName}`.toLowerCase().includes(term));
    list.innerHTML = '';
    document.getElementById('history-empty').classList.toggle('hidden', visible.length > 0);
    visible.forEach((badge) => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `<input class="check" type="checkbox" data-id="${badge.id}"><div class="history-main"><strong></strong><small></small></div><time class="history-date"></time><div class="history-actions"><button class="button button-light use-button">Usar</button><button class="button button-light delete-button">Excluir</button></div>`;
      row.querySelector('strong').textContent = badge.name;
      row.querySelector('small').textContent = `${badge.fileName}.html`;
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
  search.addEventListener('input', render);
  render();
});
