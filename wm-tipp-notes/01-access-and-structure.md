# WM Tipp 2026 — Access & Structure Notes

_Last updated: 2026-06-21 (Clawdia joining as 6th player)_

## The file

- **Title:** `WM Tipp Plan 2026`
- **Type:** Google Sheet (`application/vnd.google-apps.spreadsheet`)
- **File ID:** `1b6y48tLnlM2CXit_oSdG55kyU_yzu3EPKEtLSr3K4dQ`
- **URL:** https://docs.google.com/spreadsheets/d/1b6y48tLnlM2CXit_oSdG55kyU_yzu3EPKEtLSr3K4dQ/edit
- **Owner:** `jacob.beisser@googlemail.com`
- **Permissions:** `{"role":"writer","type":"anyone"}` → anyone with the link is a **writer**.

## How I can access it (tools available)

I reach the sheet through the **Google_Drive MCP server**. The full set of tools it
exposes in this session:

| Tool | Capability | Use for this task? |
| --- | --- | --- |
| `read_file_content` | Reads sheet as flattened markdown tables | ✅ reading current tips/results |
| `get_file_metadata` | Title, owner, mime, contentSnippet | ✅ orientation |
| `get_file_permissions` | Lists ACL | ✅ confirmed write perms exist |
| `download_file_content` | Download as base64 (export mime, e.g. xlsx/csv) | maybe (read-only) |
| `search_files` | Find files by query | not needed |
| `list_recent_files` | Recent files | not needed |
| `create_file` | **Create a NEW** Drive file | new file only |
| `copy_file` | **Copy** an existing file | copy only |

### ⚠️ Critical access limitation (the blocker)

**There is NO tool to update cells / append rows / batchUpdate an *existing*
Google Sheet.** The Google_Drive MCP server is effectively read + create/copy.

Consequences:
- I **cannot** edit the shared sheet in place to add a "Clawdia" column.
- `copy_file` would make a copy, but I still couldn't edit the copy (no update tool).
- `create_file` makes a *separate new* spreadsheet (different fileId, I'd own it) —
  it would not appear in the group's shared sheet.

So writing Clawdia's tips into the real shared sheet is **not currently possible
with the available tools**. This needs a decision / extra access from Stefan
(see `03-plan.md`).

## Read access pattern that works

```
read_file_content(fileId="1b6y48tLnlM2CXit_oSdG55kyU_yzu3EPKEtLSr3K4dQ")
```
Returns every tab concatenated as GitHub-style markdown tables. Column headers per
matchday tab:

```
Gruppe | Spiel | Ergebnis | <Player>/Tip | <Player>/Punkte | ... (repeated per player)
```
Player order left→right: **Jette, Jacob, Anke, Kai, Stefan**.

`get_file_metadata` `contentSnippet` returns the same data in raw CSV-ish form,
useful for seeing the exact tab titles:
`1. Spieltag`, `2. Spieltag`, `3. Spieltag`, `Round of 32`, `Achtelfinale`,
`Viertelfinale`, `Halbfinale`, `Finale`, `Weltmeistertip`, `Torschützentip`,
`Punkteübersicht`.

## Scoring (reverse-engineered from 1. Spieltag results)

- **Exact result** → 3 pts (e.g. Stefan 2:0 on actual 2:0).
- **Correct goal difference** (non-exact) → 2 pts (e.g. Jacob 3:1 on actual 2:0).
- **Correct tendency only** (right winner / right that it's a draw) → 1 pt.
- **Wrong tendency** → 0 pts.
- (Draw sub-cases have a minor inconsistency in the sheet; not relevant for
  entering tips — Punkte is only filled once a result exists.)

This means: enter only a `Tip` (e.g. `2:1`) for future games; leave `Punkte`
empty until the match is played.
