const SHARED_HISTORY_API = window.SHECARD_API_URL;
let sharedBadges = [];
let historyLoaded = false;
let sharedLayouts = [];

async function requestSharedHistory(payload = null) {
	if (SHARED_HISTORY_API.startsWith('COLE_')) throw new Error('A API compartilhada ainda não foi configurada.');
	const response = await fetch(SHARED_HISTORY_API, payload ? { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) } : { cache: 'no-store' });
	if (!response.ok) throw new Error(`Erro na API compartilhada (${response.status}).`);
	const result = await response.json();
	console.log('Resposta da API SHECARD:', result);
	if (!result.ok) throw new Error(result.error || 'A API compartilhada recusou a operação.');
	return result;
}

async function loadBadges() { const result = await requestSharedHistory(); sharedBadges = result.records || []; historyLoaded = true; return sharedBadges; }
function getBadges() { return sharedBadges; }
async function saveBadges(badges) { const result = await requestSharedHistory({ action: 'upsert', records: badges }); sharedBadges = result.records || []; historyLoaded = true; return sharedBadges; }
async function deleteBadges(ids) { const result = await requestSharedHistory({ action: 'delete', ids }); sharedBadges = result.records || []; historyLoaded = true; return sharedBadges; }
function layoutToSettings(layout) { try { return JSON.parse(layout.template || '{}'); } catch { return {}; } }
function activateLayout(layout) { window.SHECARD_ACTIVE_LAYOUT = layout ? layoutToSettings(layout) : null; window.SHECARD_ACTIVE_LAYOUT_RECORD = layout || null; return window.SHECARD_ACTIVE_LAYOUT; }
async function loadLayouts() {
	try { const response = await requestSharedHistory(); console.log('Layouts recebidos:', response); if (!Array.isArray(response.layouts)) throw new Error('A API não retornou "layouts". Reimplante o Code.gs atualizado.'); sharedLayouts = response.layouts; localStorage.setItem('shecard_layouts_cache', JSON.stringify(sharedLayouts)); }
	catch (error) { try { sharedLayouts = JSON.parse(localStorage.getItem('shecard_layouts_cache') || '[]'); } catch { sharedLayouts = []; } if (!sharedLayouts.length) throw error; }
	activateLayout(sharedLayouts.find((layout) => layout.isDefault) || sharedLayouts[0] || null); return sharedLayouts;
}
function getLayouts() { return sharedLayouts; }
async function saveLayout(layout) { const result = await requestSharedHistory({ action: 'layout-upsert', layout }); sharedLayouts = result.layouts || []; localStorage.setItem('shecard_layouts_cache', JSON.stringify(sharedLayouts)); return sharedLayouts; }
async function removeLayout(id) { const result = await requestSharedHistory({ action: 'layout-delete', id }); sharedLayouts = result.layouts || []; localStorage.setItem('shecard_layouts_cache', JSON.stringify(sharedLayouts)); return sharedLayouts; }
async function setDefaultLayout(id) { const result = await requestSharedHistory({ action: 'layout-default', id }); sharedLayouts = result.layouts || []; localStorage.setItem('shecard_layouts_cache', JSON.stringify(sharedLayouts)); activateLayout(sharedLayouts.find((layout) => layout.isDefault) || null); return sharedLayouts; }
function findBadge(fileName) { return getBadges().find((badge) => badge.fileName.toLowerCase() === fileName.toLowerCase()); }
function badgeUrl(fileName) { return `https://dmos15.github.io/treinamentos-colaboradores/colaboradores/${fileName}.html`; }
