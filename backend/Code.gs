const SHEET_NAME = 'Historico';
const HEADERS = ['id', 'name', 'company', 'fileName', 'url', 'createdAt'];

function doGet() {
  return jsonResponse({ ok: true, records: readRecords_() });
}

function doPost(event) {
  const body = JSON.parse(event.postData.contents || '{}');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    let records = readRecords_();
    if (body.action === 'upsert') records = upsertRecords_(records, body.records || []);
    if (body.action === 'delete') records = records.filter((record) => !(body.ids || []).includes(record.id));
    writeRecords_(records);
    return jsonResponse({ ok: true, records });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
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
