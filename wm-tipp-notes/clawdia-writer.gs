/**
 * Clawdia writer for the Google Sheet "WM Tipp Plan 2026".
 *
 * SAFETY GUARANTEE: this script only ever
 *   (a) inserts NEW columns to the RIGHT of the last existing player, and
 *   (b) appends NEW rows at the bottom of the Weltmeister/Torschützen tabs.
 * It never writes into any column or row that belongs to another player,
 * so it is structurally incapable of changing Jette/Jacob/Anke/Kai/Stefan.
 *
 * It is idempotent: re-running will not duplicate Clawdia's columns.
 *
 * DEPLOY: Extensions > Apps Script (from the sheet) OR a standalone project.
 *   Deploy > New deployment > Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *   Copy the /exec URL and send it to Clawdia.
 * TRIGGER: GET <exec-url>?token=clawdia-2026&action=all
 */

const SHEET_ID = '1b6y48tLnlM2CXit_oSdG55kyU_yzu3EPKEtLSr3K4dQ';
const TOKEN = 'clawdia-2026';
const PLAYER = 'Clawdia';

// Tips for matches that are FUTURE and that Stefan already tipped (2. Spieltag).
// Keyed by the exact text in the "Spiel" column.
const TIPS_2_SPIELTAG = {
  'BEL - IRN': '2:0',
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

// Sheets that use the "Gruppe | Spiel | Ergebnis | <player> Tip | Punkte ..." layout.
const MATCH_SHEETS = [
  '1. Spieltag', '2. Spieltag', '3. Spieltag',
  'Round of 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'
];

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.token !== TOKEN) return json({ ok: false, error: 'bad or missing token' });
  try {
    return json({ ok: true, log: run() });
  } catch (err) {
    return json({ ok: false, error: String(err && err.stack || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function run() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const log = [];

  // 1) Ensure Clawdia columns exist on every match sheet (idempotent).
  MATCH_SHEETS.forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) { log.push('skip (missing tab): ' + name); return; }
    const tipCol = ensureClawdiaColumns(sh, log, name);
    if (name === '2. Spieltag') fillTips(sh, tipCol, TIPS_2_SPIELTAG, log);
  });

  // 2) Weltmeister + Torschützenkönig picks (append new rows only).
  appendPick(ss, 'Weltmeistertip', WELTMEISTER, log);
  appendPick(ss, 'Torschützentip', TORSCHUETZE, log);

  return log;
}

/**
 * Finds the header row (the one containing "Spiel"), locates the last used
 * column in it, and—if Clawdia isn't already there—inserts two columns:
 * "<PLAYER>/Tip" and "<PLAYER>/Punkte". Also writes the player name in the
 * row above (player-name band), mirroring the other players.
 * Returns the 1-based column index of Clawdia's Tip column.
 */
function ensureClawdiaColumns(sh, log, name) {
  const data = sh.getDataRange().getValues();
  let headerRow = -1;
  for (let r = 0; r < Math.min(data.length, 6); r++) {
    if (data[r].some(function (c) { return String(c).trim() === 'Spiel'; })) { headerRow = r; break; }
  }
  if (headerRow === -1) { log.push(name + ': no "Spiel" header found, skipped'); return -1; }

  const header = data[headerRow];
  // Already present?
  const nameBandRow = headerRow - 1;
  let existing = -1;
  for (let c = 0; c < header.length; c++) {
    const h = String(header[c]).trim();
    const band = nameBandRow >= 0 ? String(data[nameBandRow][c]).trim() : '';
    if (h === PLAYER + '/Tip' || h === 'Tip' && band === PLAYER) { existing = c; break; }
  }
  if (existing !== -1) { log.push(name + ': Clawdia already present (col ' + (existing + 1) + ')'); return existing + 1; }

  // Last used column in the header row.
  let lastCol = header.length;
  while (lastCol > 0 && String(header[lastCol - 1]).trim() === '') lastCol--;

  sh.insertColumnsAfter(lastCol, 2);
  const tipCol = lastCol + 1;
  const pktCol = lastCol + 2;

  // Header labels (match this sheet's style: it uses bare "Tip"/"Punkte" with a
  // player-name band above).
  sh.getRange(headerRow + 1, tipCol).setValue('Tip');
  sh.getRange(headerRow + 1, pktCol).setValue('Punkte');
  if (nameBandRow >= 0) sh.getRange(nameBandRow + 1, tipCol).setValue(PLAYER);

  log.push(name + ': added Clawdia columns ' + tipCol + '/' + pktCol);
  return tipCol;
}

/** Writes tips into Clawdia's Tip column by matching the "Spiel" column text. */
function fillTips(sh, tipCol, tips, log) {
  if (tipCol < 1) { log.push('2. Spieltag: no Clawdia tip column, tips skipped'); return; }
  const data = sh.getDataRange().getValues();
  // Find the "Spiel" column index.
  let headerRow = -1, spielCol = -1;
  for (let r = 0; r < Math.min(data.length, 6); r++) {
    const idx = data[r].findIndex(function (c) { return String(c).trim() === 'Spiel'; });
    if (idx !== -1) { headerRow = r; spielCol = idx; break; }
  }
  if (spielCol === -1) { log.push('2. Spieltag: Spiel column not found'); return; }

  let written = 0;
  for (let r = headerRow + 1; r < data.length; r++) {
    const match = String(data[r][spielCol]).trim();
    if (tips.hasOwnProperty(match)) {
      const cell = sh.getRange(r + 1, tipCol);
      if (String(cell.getValue()).trim() === '') { cell.setValue(tips[match]); written++; }
      log.push('2. Spieltag: ' + match + ' -> ' + tips[match]);
    }
  }
  log.push('2. Spieltag: wrote ' + written + ' tips');
}

/** Appends a "Clawdia, <pick>, 0" row at the bottom of a pick sheet. */
function appendPick(ss, sheetName, pick, log) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) { log.push('skip (missing tab): ' + sheetName); return; }
  const data = sh.getDataRange().getValues();
  // Idempotent: don't add twice.
  for (let r = 0; r < data.length; r++) {
    if (String(data[r][0]).trim() === PLAYER) { log.push(sheetName + ': Clawdia already present'); return; }
  }
  sh.appendRow([PLAYER, pick, 0]);
  log.push(sheetName + ': added Clawdia -> ' + pick);
}
