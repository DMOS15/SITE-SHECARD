const SHEET_NAME = 'Historico';
const HEADERS = ['id', 'name', 'company', 'fileName', 'url', 'createdAt'];
const LAYOUTS_SHEET_NAME = 'Layouts';
const LAYOUT_HEADERS = ['id', 'nome', 'empresa', 'mostrarLogo', 'logoUrl', 'corPrimaria', 'corSecundaria', 'qrSize', 'template', 'criadoEm', 'atualizadoEm', 'isDefault'];

function doGet() {
  return jsonResponse({ ok: true, records: readRecords_(), layouts: readLayouts_() });
}

function doPost(event) {
  const body = JSON.parse(event.postData.contents || '{}');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    let records = readRecords_();
    let layouts = readLayouts_();
    if (body.action === 'upsert') records = upsertRecords_(records, body.records || []);
    if (body.action === 'delete') records = records.filter((record) => !(body.ids || []).includes(record.id));
    if (body.action === 'layout-upsert') layouts = upsertLayouts_(layouts, body.layout);
    if (body.action === 'layout-delete') layouts = layouts.filter((layout) => layout.id !== body.id);
    if (body.action === 'layout-default') layouts = setDefaultLayout_(layouts, body.id);
    writeRecords_(records);
    writeLayouts_(layouts);
    return jsonResponse({ ok: true, records, layouts });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function getLayoutsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(LAYOUTS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(LAYOUTS_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(LAYOUT_HEADERS);
  return sheet;
}

function readLayouts_() {
  const values = getLayoutsSheet_().getDataRange().getValues();
  return values.slice(1).filter((row) => row[0]).map((row) => ({
    id: String(row[0]), nome: String(row[1] || ''), empresa: String(row[2] || ''),
    mostrarLogo: row[3] === true || String(row[3]).toLowerCase() === 'true', logoUrl: String(row[4] || ''),
    corPrimaria: String(row[5] || ''), corSecundaria: String(row[6] || ''), qrSize: Number(row[7]) || 220,
    template: String(row[8] || ''), criadoEm: String(row[9] || ''), atualizadoEm: String(row[10] || ''),
    isDefault: row[11] === true || String(row[11]).toLowerCase() === 'true'
  }));
}

function normalizeLayout_(layout) {
  const now = new Date().toISOString();
  return { id: String(layout.id || Utilities.getUuid()), nome: String(layout.nome || 'Novo Layout'), empresa: String(layout.empresa || ''), mostrarLogo: Boolean(layout.mostrarLogo), logoUrl: String(layout.logoUrl || ''), corPrimaria: String(layout.corPrimaria || '#66783e'), corSecundaria: String(layout.corSecundaria || '#dfe8cf'), qrSize: Number(layout.qrSize) || 220, template: String(layout.template || '{}'), criadoEm: String(layout.criadoEm || now), atualizadoEm: now, isDefault: Boolean(layout.isDefault) };
}

function upsertLayouts_(current, incoming) {
  const layout = normalizeLayout_(incoming || {});
  const next = current.filter((item) => item.id !== layout.id);
  if (layout.isDefault) next.forEach((item) => { item.isDefault = false; });
  next.unshift(layout);
  return next;
}

function setDefaultLayout_(current, id) {
  return current.map((layout) => ({ ...layout, isDefault: layout.id === id, atualizadoEm: layout.id === id ? new Date().toISOString() : layout.atualizadoEm }));
}

function writeLayouts_(layouts) {
  const sheet = getLayoutsSheet_();
  sheet.clearContents();
  sheet.getRange(1, 1, 1, LAYOUT_HEADERS.length).setValues([LAYOUT_HEADERS]);
  if (layouts.length) sheet.getRange(2, 1, layouts.length, LAYOUT_HEADERS.length).setValues(layouts.map((layout) => LAYOUT_HEADERS.map((header) => layout[header])));
  sheet.setFrozenRows(1);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function readRecords_() {
  const values = getSheet_().getDataRange().getValues();
  return values.slice(1).filter((row) => row[0]).map((row) => ({ id: String(row[0]), name: String(row[1] || ''), company: String(row[2] || ''), fileName: String(row[3] || ''), url: String(row[4] || ''), createdAt: String(row[5] || '') }));
}

function normalizeRecords_(records) {
  return records.map((record) => ({ id: String(record.id || Utilities.getUuid()), name: String(record.name || ''), company: String(record.company || ''), fileName: String(record.fileName || ''), url: String(record.url || ''), createdAt: String(record.createdAt || new Date().toISOString()) })).filter((record) => record.name && record.fileName);
}

function upsertRecords_(current, incoming) {
  const next = current.slice();
  normalizeRecords_(incoming).forEach((record) => {
    const index = next.findIndex((item) => item.fileName.toLowerCase() === record.fileName.toLowerCase());
    if (index >= 0) next[index] = record;
    else next.unshift(record);
  });
  return next;
}

function writeRecords_(records) {
  const sheet = getSheet_();
  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (records.length) sheet.getRange(2, 1, records.length, HEADERS.length).setValues(records.map((record) => HEADERS.map((header) => record[header])));
  sheet.setFrozenRows(1);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
