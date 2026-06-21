/**
 * Clawdia writer for the Google Sheet "WM Tipp Plan 2026".
 *
 * >>> HOW TO RUN: in the editor's function dropdown choose `run`, click Run. <<<
 *
 * SAFETY GUARANTEE: this script only ever
 *   (a) inserts NEW columns to the RIGHT of the last existing player, and
 *   (b) appends NEW rows at the bottom of the Weltmeister/Torschützen tabs.
 * It never writes into any column or row that belongs to another player,
 * so it is structurally incapable of changing Jette/Jacob/Anke/Kai/Stefan.
 *
 * It also only writes a tip when the match has NO result yet (future games only),
 * and it is idempotent: re-running will not duplicate or overwrite anything.
 *
 * It writes a summary to a tab called "_ClawdiaLog" (safe to delete afterwards).
 */

const SHEET_ID = '1b6y48tLnlM2CXit_oSdG55kyU_yzu3EPKEtLSr3K4dQ';
const TOKEN = 'clawdia-2026';
const PLAYER = 'Clawdia';

// Tips for FUTURE matches that Stefan already tipped (2. Spieltag).
// (BEL - IRN removed: it has already been played.)
const TIPS_2_SPIELTAG = {
  'NZL - EGY': '1:2',
  'URU - CPV': '2:0',
  'FRA - IRQ': '3:0',
  'NOR - SEN': '2:1',
  'ARG - AUT': '2:0',
  'JOR - ALG': '1:2',
  'POR - UZB': '3:0',
  'COL - COD': '2:0',
  'ENG - GHA': '2:0',
  'PAN - CRO': '1:2'
};

const WELTMEISTER = 'Frankreich';
const TORSCHUETZE = 'Kylian Mbappé';

const MATCH_SHEETS = [
  '1. Spieltag', '2. Spieltag', '3. Spieltag',
  'Round of 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'
];

/** Manual entry point — run THIS from the editor. */
function run() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const log = [];
  try {
    doWork(ss, log);
  } catch (err) {
    log.push('ERROR: ' + String(err && err.stack || err));
  }
  writeLog(ss, log);
  return log;
}

/** Web-app entry point (only used if the env can reach script.google.com). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.token !== TOKEN) return out({ ok: false, error: 'bad or missing token' });
  return out({ ok: true, log: run() });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doWork(ss, log) {
  MATCH_SHEETS.forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) { log.push('skip (missing tab): ' + name); return; }
    const tipCol = ensureClawdiaColumns(sh, log, name);
    if (name === '2. Spieltag') fillTips(sh, tipCol, TIPS_2_SPIELTAG, log);
  });
  appendPick(ss, 'Weltmeistertip', WELTMEISTER, log);
  appendPick(ss, 'Torschützentip', TORSCHUETZE, log);
}

/** Locate header row (row containing "Spiel") and the named column in it. */
function findHeader(sh) {
  const data = sh.getDataRange().getValues();
  for (let r = 0; r < Math.min(data.length, 8); r++) {
    for (let c = 0; c < data[r].length; c++) {
      if (String(data[r][c]).trim() === 'Spiel') return { data: data, row: r, spielCol: c };
    }
  }
  return { data: data, row: -1, spielCol: -1 };
}

function colIndexInRow(rowArr, label) {
  for (let c = 0; c < rowArr.length; c++) if (String(rowArr[c]).trim() === label) return c;
  return -1;
}

/**
 * Inserts Clawdia "Tip"/"Punkte" columns after the last used header column,
 * with "Clawdia" written in the player-name band row above. Idempotent.
 * Returns the 1-based column index of Clawdia's Tip column.
 */
function ensureClawdiaColumns(sh, log, name) {
  const h = findHeader(sh);
  if (h.row === -1) { log.push(name + ': no "Spiel" header, skipped'); return -1; }
  const header = h.data[h.row];
  const bandRow = h.row - 1;

  // Already present?
  for (let c = 0; c < header.length; c++) {
    const band = bandRow >= 0 ? String(h.data[bandRow][c]).trim() : '';
    if (band === PLAYER) { log.push(name + ': Clawdia already present (col ' + (c + 1) + ')'); return c + 1; }
  }

  let lastCol = header.length;
  while (lastCol > 0 && String(header[lastCol - 1]).trim() === '') lastCol--;

  sh.insertColumnsAfter(lastCol, 2);
  const tipCol = lastCol + 1, pktCol = lastCol + 2;
  sh.getRange(h.row + 1, tipCol).setValue('Tip');
  sh.getRange(h.row + 1, pktCol).setValue('Punkte');
  if (bandRow >= 0) {
    sh.getRange(bandRow + 1, tipCol).setValue(PLAYER);
    sh.getRange(bandRow + 1, pktCol).setValue(PLAYER);
  }
  log.push(name + ': added Clawdia columns ' + tipCol + '/' + pktCol);
  return tipCol;
}

/** Writes tips, but ONLY for rows whose result (Ergebnis) is still empty. */
function fillTips(sh, tipCol, tips, log) {
  if (tipCol < 1) { log.push('2. Spieltag: no Clawdia tip column'); return; }
  const h = findHeader(sh);
  if (h.spielCol === -1) { log.push('2. Spieltag: Spiel column not found'); return; }
  const ergCol = colIndexInRow(h.data[h.row], 'Ergebnis');
  let written = 0;
  for (let r = h.row + 1; r < h.data.length; r++) {
    const match = String(h.data[r][h.spielCol]).trim();
    if (!tips.hasOwnProperty(match)) continue;
    const played = ergCol !== -1 && String(h.data[r][ergCol]).trim() !== '';
    if (played) { log.push('2. Spieltag: skip ' + match + ' (already played)'); continue; }
    const cell = sh.getRange(r + 1, tipCol);
    if (String(cell.getValue()).trim() === '') { cell.setValue(tips[match]); written++; log.push('2. Spieltag: ' + match + ' -> ' + tips[match]); }
  }
  log.push('2. Spieltag: wrote ' + written + ' tips');
}

/** Appends a "Clawdia, <pick>, 0" row at the bottom of a pick sheet. Idempotent. */
function appendPick(ss, sheetName, pick, log) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) { log.push('skip (missing tab): ' + sheetName); return; }
  const data = sh.getDataRange().getValues();
  for (let r = 0; r < data.length; r++) {
    if (String(data[r][0]).trim() === PLAYER) { log.push(sheetName + ': Clawdia already present'); return; }
  }
  sh.appendRow([PLAYER, pick, 0]);
  log.push(sheetName + ': added Clawdia -> ' + pick);
}

/** Mirrors the run log into a "_ClawdiaLog" tab so it can be read back via the API. */
function writeLog(ss, log) {
  let sh = ss.getSheetByName('_ClawdiaLog');
  if (!sh) sh = ss.insertSheet('_ClawdiaLog');
  sh.clear();
  sh.getRange(1, 1).setValue('Clawdia run @ ' + new Date().toISOString());
  for (let i = 0; i < log.length; i++) sh.getRange(i + 2, 1).setValue(log[i]);
}
