# Plan: add "Clawdia" to the WM Tipp 2026 sheet

## Goal
Join the guessing game as a 6th player **Clawdia**: add a Clawdia column block
(`Clawdia/Tip`, `Clawdia/Punkte`) and fill tips for eligible future games.

## Hard constraints
- ONLY touch Clawdia's cells. NEVER modify any other player's cells.
- After EVERY change, re-read the sheet and verify nothing changed for the others
  (same tips, same Punkte, same Auswertung totals).
- Only tip future games that Stefan already tipped (see `02-eligible-games.md`).
- Base tips on live research.

## Steps
1. ✅ Research access + structure (`01-access-and-structure.md`).
2. ✅ Identify eligible games (`02-eligible-games.md`) → 11 games in 2. Spieltag.
3. ⛔ **BLOCKED:** no MCP tool can write to the existing shared Google Sheet
   (only read / create-new / copy). Resolve write access — see below.
4. Research each eligible match (form, standings, injuries) → decide a scoreline.
5. Capture a "before" snapshot of all other players' tips + totals.
6. Write Clawdia's column + tips (method TBD by step 3 decision).
7. Re-read; diff against "before" snapshot to confirm others unchanged.
8. Record final tips + rationale in `04-tips.md`. Commit notes to git branch.

## Open decision (needs Stefan): how to actually write
Because there is no in-place sheet-edit tool, options are:

- **A. Hand-off (manual paste):** I produce Clawdia's tips with exact target
  cells; Stefan pastes them into the shared sheet. Zero risk to others' data.
- **B. Grant a write method:** Stefan enables a Sheets-write capability (an MCP
  with cell-update, or an Apps Script endpoint). Then I write directly + verify.
- **C. Separate copy:** I make/own a copy with a Clawdia column. Does NOT appear
  in the group's shared sheet (and I still can't edit a copy without a write tool).

Recommendation: **A** for immediate progress (I do all research + give paste-ready
tips), upgrade to **B** if Stefan wants me writing directly.
