# BEFORE snapshot (others' invariants) — captured 2026-06-21

These MUST be identical after Clawdia is added. Re-read the sheet and diff.

## Punkteübersicht totals (must not change)
| Player | 1. ST | 2. ST | Gesamt |
| ------ | ----- | ----- | ------ |
| Jette  | 19 | 10 | 29 |
| Jacob  | 18 | 10 | 28 |
| Anke   | 17 |  6 | 23 |
| Kai    | 21 |  5 | 26 |
| Stefan | 19 | 15 | 34 |

## Existing tournament picks (must not change)
- Weltmeister: Jacob=Spanien, Jette=Portugal, Anke=Argentinien, Kai=England, Stefan=USA
- Torschützenkönig: Jacob=Lamine Yamal, Jette=Ronaldo, Anke=Messi, Kai=Kane, Stefan=Folarin Balogun

## Player column order (left→right): Jette, Jacob, Anke, Kai, Stefan
Clawdia is to be inserted to the RIGHT of Stefan only.

## Verification method
1. `read_file_content(SHEET_ID)` after write.
2. Confirm all five totals above are unchanged.
3. Spot-check a few existing tips (e.g. Stefan FRA-IRQ tip 4:0 still present, 2.Spieltag).
4. Confirm Clawdia appears only as a new right-most column + new pick rows.
