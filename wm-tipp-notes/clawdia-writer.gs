/**
 * Clawdia writer for the Google Sheet "WM Tipp Plan 2026".
 *
 * >>> Just press the ▶ Run button. There is only ONE function. <<<
 * (First run shows a Google authorization prompt — approve it.)
 *
 * SAFETY: only inserts NEW columns to the RIGHT of the last player, and appends
 * NEW rows to the Weltmeister/Torschützen tabs. It never touches another
 * player's cells. It only tips matches with no result yet (future games only).
 * Idempotent: re-running won't duplicate or overwrite anything.
 * Writes a summary to a "_ClawdiaLog" tab (safe to delete afterwards).
 */

function addClawdiaTips() {
  const SHEET_ID = '1b6y48tLnlM2CXit_oSdG55kyU_yzu3EPKEtLSr3K4dQ';
  const PLAYER = 'Clawdia';

  // FUTURE 2. Spieltag matches Stefan already tipped. (BEL-IRN already played.)
  const TIPS = {
    'NZL - EGY': '1:2', 'URU - CPV': '2:0', 'FRA - IRQ': '3:0', 'NOR - SEN': '2:1',
    'ARG - AUT': '2:0', 'JOR - ALG': '1:2', 'POR - UZB': '3:0', 'COL - COD': '2:0',
    'ENG - GHA': '2:0', 'PAN - CRO': '1:2'
  };
  const WELTMEISTER = 'Frankreich';
  const TORSCHUETZE = 'Kylian Mbappé';
  const MATCH_SHEETS = ['1. Spieltag', '2. Spieltag', '3. Spieltag',
    'Round of 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const log = [];

  function findHeader(sh) {
    const data = sh.getDataRange().getValues();
    for (let r = 0; r < Math.min(data.length, 8); r++)
      for (let c = 0; c < data[r].length; c++)
        if (String(data[r][c]).trim() === 'Spiel') return { data: data, row: r, spielCol: c };
    return { data: data, row: -1, spielCol: -1 };
  }
  function colInRow(rowArr, label) {
    for (let c = 0; c < rowArr.length; c++) if (String(rowArr[c]).trim() === label) return c;
    return -1;
  }

  // 1) Clawdia Tip/Punkte columns on every match sheet.
  MATCH_SHEETS.forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) { log.push('skip (missing tab): ' + name); return; }
    const h = findHeader(sh);
    if (h.row === -1) { log.push(name + ': no "Spiel" header'); return; }
    const header = h.data[h.row];
    const bandRow = h.row - 1;

    let tipCol = -1;
    for (let c = 0; c < header.length; c++) {
      const band = bandRow >= 0 ? String(h.data[bandRow][c]).trim() : '';
      if (band === PLAYER) { tipCol = c + 1; break; }
    }
    if (tipCol === -1) {
      let lastCol = header.length;
      while (lastCol > 0 && String(header[lastCol - 1]).trim() === '') lastCol--;
      sh.insertColumnsAfter(lastCol, 2);
      tipCol = lastCol + 1;
      sh.getRange(h.row + 1, tipCol).setValue('Tip');
      sh.getRange(h.row + 1, tipCol + 1).setValue('Punkte');
      if (bandRow >= 0) {
        sh.getRange(bandRow + 1, tipCol).setValue(PLAYER);
        sh.getRange(bandRow + 1, tipCol + 1).setValue(PLAYER);
      }
      log.push(name + ': added Clawdia columns ' + tipCol + '/' + (tipCol + 1));
    } else {
      log.push(name + ': Clawdia columns already present (' + tipCol + ')');
    }

    // 2) Fill tips on 2. Spieltag, future games only.
    if (name === '2. Spieltag') {
      const h2 = findHeader(sh);
      const ergCol = colInRow(h2.data[h2.row], 'Ergebnis');
      let written = 0;
      for (let r = h2.row + 1; r < h2.data.length; r++) {
        const match = String(h2.data[r][h2.spielCol]).trim();
        if (!TIPS.hasOwnProperty(match)) continue;
        const played = ergCol !== -1 && String(h2.data[r][ergCol]).trim() !== '';
        if (played) { log.push('skip ' + match + ' (already played)'); continue; }
        const cell = sh.getRange(r + 1, tipCol);
        if (String(cell.getValue()).trim() === '') { cell.setValue(TIPS[match]); written++; log.push(match + ' -> ' + TIPS[match]); }
      }
      log.push('2. Spieltag: wrote ' + written + ' tips');
    }
  });

  // 3) Weltmeister + Torschützenkönig (append new rows only).
  [['Weltmeistertip', WELTMEISTER], ['Torschützentip', TORSCHUETZE]].forEach(function (pair) {
    const sh = ss.getSheetByName(pair[0]);
    if (!sh) { log.push('skip (missing tab): ' + pair[0]); return; }
    const data = sh.getDataRange().getValues();
    let exists = false;
    for (let r = 0; r < data.length; r++) if (String(data[r][0]).trim() === PLAYER) exists = true;
    if (exists) { log.push(pair[0] + ': Clawdia already present'); return; }
    sh.appendRow([PLAYER, pair[1], 0]);
    log.push(pair[0] + ': added Clawdia -> ' + pair[1]);
  });

  // 4) Log tab so the run is verifiable via the Drive API.
  let lg = ss.getSheetByName('_ClawdiaLog');
  if (!lg) lg = ss.insertSheet('_ClawdiaLog');
  lg.clear();
  lg.getRange(1, 1).setValue('Clawdia run @ ' + new Date().toISOString());
  for (let i = 0; i < log.length; i++) lg.getRange(i + 2, 1).setValue(log[i]);

  SpreadsheetApp.flush();
  return log;
}
