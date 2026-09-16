const SHARED_HISTORY_API = window.SHECARD_API_URL;
const BADGES_CACHE_KEY = 'shecard_history_cache';
const LAYOUTS_CACHE_KEY = 'shecard_layouts_cache';
let sharedBadges = readCache(BADGES_CACHE_KEY);
let historyLoaded = false;
let sharedLayouts = readCache(LAYOUTS_CACHE_KEY);
let sharedSyncPromise = null;

function readCache(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function writeCache(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { console.warn(`Não foi possível atualizar o cache ${key}:`, error.message); } }
function cacheChanged(previous, next) { return JSON.stringify(previous) !== JSON.stringify(next); }
function publishDataUpdate() { window.dispatchEvent(new CustomEvent('shecard:data-updated')); }

async function requestSharedHistory(payload = null) {
	if (SHARED_HISTORY_API.startsWith('COLE_')) throw new Error('A API compartilhada ainda não foi configurada.');
	const response = await fetch(SHARED_HISTORY_API, payload ? { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) } : { cache: 'no-store' });
	if (!response.ok) throw new Error(`Erro na API compartilhada (${response.status}).`);
	const result = await response.json();
	console.log('Resposta da API SHECARD:', result);
	if (!result.ok) throw new Error(result.error || 'A API compartilhada recusou a operação.');
	return result;
}

async function syncSharedData(force = false) {
	if (sharedSyncPromise && !force) return sharedSyncPromise;
	const started = performance.now();
	sharedSyncPromise = requestSharedHistory().then((result) => {
		const nextBadges = result.records || [];
		const nextLayouts = result.layouts || [];
		const changed = cacheChanged(sharedBadges, nextBadges) || cacheChanged(sharedLayouts, nextLayouts);
		sharedBadges = nextBadges; sharedLayouts = nextLayouts; historyLoaded = true;
		writeCache(BADGES_CACHE_KEY, sharedBadges);
		writeCache(LAYOUTS_CACHE_KEY, sharedLayouts);
		console.log(`Histórico e layouts sincronizados em ${((performance.now() - started) / 1000).toFixed(2)}s`);
		if (changed) publishDataUpdate();
		return result;
	}).finally(() => { sharedSyncPromise = null; });
	return sharedSyncPromise;
}
async function loadBadges(options = {}) {
	const hasCache = sharedBadges.length > 0;
	if (hasCache && !options.force) { console.log('Histórico carregado em 0.00s (cache local)'); syncSharedData().catch((error) => console.warn('Sincronização do histórico indisponível:', error.message)); return sharedBadges; }
	const started = performance.now(); const result = await syncSharedData(Boolean(options.force)); console.log(`Histórico carregado em ${((performance.now() - started) / 1000).toFixed(2)}s`); return result.records || sharedBadges;
}
function getBadges() { return sharedBadges; }
async function saveBadges(badges) { const result = await requestSharedHistory({ action: 'upsert', records: badges }); sharedBadges = result.records || []; historyLoaded = true; writeCache(BADGES_CACHE_KEY, sharedBadges); return sharedBadges; }
async function deleteBadges(ids) { const result = await requestSharedHistory({ action: 'delete', ids }); sharedBadges = result.records || []; historyLoaded = true; writeCache(BADGES_CACHE_KEY, sharedBadges); return sharedBadges; }
function layoutToSettings(layout) { try { return JSON.parse(layout.template || '{}'); } catch { return {}; } }
function activateLayout(layout) { window.SHECARD_ACTIVE_LAYOUT = layout ? layoutToSettings(layout) : null; window.SHECARD_ACTIVE_LAYOUT_RECORD = layout || null; if (layout) localStorage.setItem('shecard_active_layout_id', layout.id); else localStorage.removeItem('shecard_active_layout_id'); return window.SHECARD_ACTIVE_LAYOUT; }
function activateBadgeLayout(badge) { if (!badge) return null; if (badge.layoutTemplate) return activateLayout({ id: badge.layoutId || `history-${badge.id}`, nome: badge.layoutName || 'Layout do histórico', template: badge.layoutTemplate }); const layout = sharedLayouts.find((item) => item.id === badge.layoutId || item.nome === badge.layoutName); return activateLayout(layout || null); }
function getActiveLayoutRecord() { return window.SHECARD_ACTIVE_LAYOUT_RECORD || null; }
async function loadLayouts() {
	if (!sharedLayouts.length) { const started = performance.now(); const result = await syncSharedData(); if (!Array.isArray(result.layouts)) throw new Error('A API não retornou "layouts". Reimplante o Code.gs atualizado.'); console.log(`Layouts carregados em ${((performance.now() - started) / 1000).toFixed(2)}s`); }
	else { console.log('Layouts carregados em 0.00s (cache local)'); syncSharedData().catch((error) => console.warn('Sincronização dos layouts indisponível:', error.message)); }
	const activeId = localStorage.getItem('shecard_active_layout_id'); activateLayout(sharedLayouts.find((layout) => layout.id === activeId) || sharedLayouts.find((layout) => layout.isDefault) || sharedLayouts[0] || null); return sharedLayouts;
}
function getLayouts() { return sharedLayouts; }
async function refreshSharedData() { const result = await syncSharedData(true); return result; }
async function saveLayout(layout) { const result = await requestSharedHistory({ action: 'layout-upsert', layout }); sharedLayouts = result.layouts || []; writeCache(LAYOUTS_CACHE_KEY, sharedLayouts); return sharedLayouts; }
async function removeLayout(id) { const result = await requestSharedHistory({ action: 'layout-delete', id }); sharedLayouts = result.layouts || []; writeCache(LAYOUTS_CACHE_KEY, sharedLayouts); return sharedLayouts; }
async function setDefaultLayout(id) { const result = await requestSharedHistory({ action: 'layout-default', id }); sharedLayouts = result.layouts || []; writeCache(LAYOUTS_CACHE_KEY, sharedLayouts); activateLayout(sharedLayouts.find((layout) => layout.isDefault) || null); return sharedLayouts; }
function findBadge(fileName) { return getBadges().find((badge) => badge.fileName.toLowerCase() === fileName.toLowerCase()); }
function badgeUrl(fileName) { return `https://dmos15.github.io/treinamentos-colaboradores/colaboradores/${fileName}.html`; }
