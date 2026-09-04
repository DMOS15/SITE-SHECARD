const SHARED_HISTORY_API = window.SHECARD_API_URL;
let sharedBadges = [];
let historyLoaded = false;

async function requestSharedHistory(payload = null) {
	if (SHARED_HISTORY_API.startsWith('COLE_')) throw new Error('A API compartilhada ainda não foi configurada.');
	const response = await fetch(SHARED_HISTORY_API, payload ? { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) } : { cache: 'no-store' });
	if (!response.ok) throw new Error(`Erro na API compartilhada (${response.status}).`);
	const result = await response.json();
	if (!result.ok) throw new Error(result.error || 'A API compartilhada recusou a operação.');
	return result.records || [];
}

async function loadBadges() { sharedBadges = await requestSharedHistory(); historyLoaded = true; return sharedBadges; }
function getBadges() { return sharedBadges; }
async function saveBadges(badges) { sharedBadges = await requestSharedHistory({ action: 'upsert', records: badges }); historyLoaded = true; return sharedBadges; }
async function deleteBadges(ids) { sharedBadges = await requestSharedHistory({ action: 'delete', ids }); historyLoaded = true; return sharedBadges; }
function findBadge(fileName) { return getBadges().find((badge) => badge.fileName.toLowerCase() === fileName.toLowerCase()); }
function badgeUrl(fileName) { return `https://dmos15.github.io/treinamentos-colaboradores/colaboradores/${fileName}.html`; }
