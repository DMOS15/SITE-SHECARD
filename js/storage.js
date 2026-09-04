const STORAGE_KEY = 'shecard_badges_v2';
function getBadges() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function saveBadges(badges) { localStorage.setItem(STORAGE_KEY, JSON.stringify(badges)); }
function findBadge(fileName) { return getBadges().find((badge) => badge.fileName.toLowerCase() === fileName.toLowerCase()); }
function badgeUrl(fileName) { return `https://dmos15.github.io/treinamentos-colaboradores/colaboradores/${fileName}.html`; }
