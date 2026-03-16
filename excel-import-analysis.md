# Excel Import Analysis And Conversion Plan

## 1. Goal

Add a new dashboard action:
- Button text: `Εισαγωγή Δεδομένων`
- Position: left of `Ανανέωση δεδομένων`
- Behavior: read `ΦΩΤΟΤΥΠΙΚΟ.xlsx` + `ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx`, convert rows to Firestore-compatible records, and import them safely.

Also remove printer-based differentiation for this import flow (and related UI logic where needed).

---

## 2. What I verified in the Excel files

I parsed both `.xlsx` files from XML (not just visible cells), including formulas and styles.

### 2.1 `ΦΩΤΟΤΥΠΙΚΟ.xlsx`

- Sheets: 1 (`Sheet1`)
- Non-empty rows: up to row `181`
- Importable business rows (where `C` is numeric user code): `153` rows (`4..172`)
- Formula validation:
  - `H = E + G` for all importable rows
  - `L = H*0.05 + F*0.25 + I + J + K` for all importable rows
  - `M = D + L` for all importable rows
- No formula mismatches found.

Column meaning:
- `B`: Display name
- `C`: User code (best key for matching Firestore `users.username`)
- `D`: Previous print debt (`Παλιές Οφειλές`)
- `E`: BW count (2520)
- `F`: Color count (3330)
- `G`: BW count (3330)
- `H`: Total BW count
- `I`: `Χρεώσεις Κυδωνιών` (all `0` for coded rows in this file)
- `J`: `Ειδικές` charges (money)
- `K`: `Υπογείου` charges (money)
- `L`: New print charge total for the period (`Σύνολο`)
- `M`: Final print debt (`Τελικές Οφειλές`)

Key stats (coded rows):
- `153` unique codes, no duplicates
- `86` rows have non-zero new print charges (`L`)
- `18` rows have negative old print debt (`D`)
- `9` rows have negative final print debt (`M`) -> print credit exists for some users
- Totals:
  - Sum `L` (new print charges): `1800.45`
  - Sum `M` (final print debts): `4035.18`

### 2.2 `ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx`

- Sheets: 1 (`Sheet1`)
- Non-empty rows: up to row `174`
- Numeric financial rows align with the same row range used by coded rows in photocopier sheet.
- Formula validation:
  - `F = C + D + E` for all numeric rows
- No formula mismatches found.

Column meaning:
- `B`: Display name
- `C`: Previous lamination debt (`Παλιές Οφειλές`)
- `D`: New lamination charge (`Χρεώσεις 40`)
- `E`: `Χρεώσεις Κυδωνιών` (all `0` for coded rows in this file)
- `F`: Final lamination debt (`Σύνολο`)

Key stats (rows aligned to coded users):
- `153` aligned rows
- `22` rows have non-zero new lamination charges (`D + E`)
- Totals:
  - Sum new lamination charges (`D + E`): `44.1`
  - Sum final lamination debts (`F`): `225.21`

### 2.3 Cross-file correlation quality

- All `153` coded rows from `ΦΩΤΟΤΥΠΙΚΟ.xlsx` have matching numeric lamination rows by row index.
- Name match quality between sheets is very high (`154/156` normalized exact matches on comparable rows), with only minor formatting/string variants.
- Best primary key remains photocopier `C` (user code).

---

## 3. Cell color semantics (important for template validation)

Color is useful as a guard that the template is unchanged.

### 3.1 Photocopier key fills

- `D` (old debt): green fill
- `J` / `K` (special charges): distinct accent fills
- `L` (period charge total): yellow fill
- `M` (final debt): blue fill

### 3.2 Laminator key fills

- `C` (old debt): green fill
- `F` (final debt): yellow fill

Recommendation:
- Parse by header text first.
- Use color/style checks as **secondary validation**, not as the only mapping mechanism.

---

## 4. Firestore correlation and mapping

Current schema relevant fields:
- `users`: `uid`, `username`, `displayName`, `printDebt`, `laminationDebt`, `totalDebt`
- `printJobs`
- `laminationJobs`
- `income` (not imported from these files)

### 4.1 User matching

Primary:
- `Excel ΦΩΤΟΤΥΠΙΚΟ C (code)` -> Firestore `users.username` (string compare)

Secondary verification:
- normalized `Excel B (name)` vs `users.displayName`

### 4.2 Data to import

The files contain:
- old debt snapshot,
- period charges,
- final debt snapshot.

No income rows should be imported (as requested).

---

## 5. Recommended import model

## 5.1 Why this model

If we only set `users.printDebt/laminationDebt` and skip event history, future debt recomputation (used in income flows) can drift.

So import should:
1. preserve debt baselines, and
2. create period charge events, with no printer differentiation.

### 5.2 Proposed fields/logic

For each matched user code row:

From photocopier:
- `oldPrintDebt = D`
- `newPrintCharge = L`
- `bwQty = H`
- `colorQty = F`
- `extraCharge = I + J + K`
- `finalPrintDebt = M`

From laminator:
- `oldLaminationDebt = C`
- `newLaminationCharge = D + E`
- `finalLaminationDebt = F`

Write strategy:

1. Store opening balances on user (new metadata fields, one-time baseline):
- `openingPrintDebt`
- `openingLaminationDebt`
- `openingDebtSource` (e.g. `excel-2026-01`)
- `openingDebtImportedAt`

2. Create synthetic period jobs (idempotent IDs):
- Print:
  - BW job (if `bwQty > 0`): `type=A4BW`, `quantity=bwQty`, `pricePerUnit=0.05`, `totalCost=bwQty*0.05`
  - Color job (if `colorQty > 0`): `type=A4Color`, `quantity=colorQty`, `pricePerUnit=0.25`, `totalCost=colorQty*0.25`
  - Extra-charge job (if `extraCharge > 0`): `type=A4BW`, `quantity=0`, `pricePerUnit=extraCharge`, `totalCost=extraCharge` (explicit import adjustment)
- Lamination:
  - Aggregate lamination job (if `newLaminationCharge > 0`): `type=A4`, `quantity=0`, `pricePerUnit=newLaminationCharge`, `totalCost=newLaminationCharge`, `notes='Excel aggregated charge'`

3. Remove printer differentiation in imported print jobs:
- `deviceName = 'Φωτοτυπικό'` for all imported print rows
- `deviceIP = ''`

4. Recompute user debt with opening balance support:
- update debt recompute to start from opening balances, then apply jobs/income.

This keeps income manual entry working without losing imported baseline debt.

---

## 6. Import pipeline (end-to-end)

1. UI button near refresh:
- File: `app/dashboard/page.tsx` (button row around line ~1435)
- Add `Εισαγωγή Δεδομένων` button left of refresh.

2. Import modal:
- Inputs: two files (`ΦΩΤΟΤΥΠΙΚΟ.xlsx`, `ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx`)
- Parse client-side with `xlsx`
- Preview summary:
  - parsed users,
  - unknown codes,
  - rows with negative balances,
  - totals from both sheets.

3. API route (admin-only):
- Suggested: `POST /api/import/excel`
- Validate headers, formulas, and row counts.
- Match users by `username`.
- Upsert opening balances and import jobs in batches.
- Return detailed report (created/updated/skipped/errors).

4. Idempotency:
- Deterministic IDs per `period + username + kind`
- Re-import of same month updates same docs instead of duplicating.

5. Post-import:
- Trigger refresh
- Update snapshots (or force manual refresh path)

---

## 7. Printer differentiation removal plan

Current printer-specific logic exists in:
- `components/print-filters.tsx` (device filter, Canon/Brother/Kυδωνιών assumptions)
- `app/dashboard/page.tsx` (`calculatePrintStatistics` branches on device names)

Recommended changes:
- Keep `deviceName` technically present in schema, but:
  - imported data uses one constant value,
  - remove/disable device-based filtering and conditional UI behavior for this flow,
  - base stats on `type` and totals, not device.

This aligns with your requirement that source data is not printer-differentiated.

---

## 8. Validation rules before import commit

Hard checks:
- both files loaded
- expected headers present
- formula integrity checks pass
- row alignment for all coded rows
- user code exists in Firestore

Soft checks (warnings):
- display name mismatch between sheet and Firestore
- negative final debts

Abort import if hard checks fail.

---

## 9. Important implementation notes

- Do not import any `income` entries from these files.
- Use Firestore server route with admin auth; do not trust client-side totals.
- Add a `dryRun` mode first (preview without writes).
- Keep import metadata per job/user to support rollback and audit.

---

## 10. Minimal technical change list

1. `app/dashboard/page.tsx`
- Add `Εισαγωγή Δεδομένων` button and modal flow.

2. New parser/helper module
- Read and normalize both workbooks.

3. New API route
- `app/api/import/excel/route.ts` for validated batch import.

4. `lib/server/debt.ts`
- Add opening-balance-aware recompute mode.

5. `components/print-filters.tsx` + dashboard stats
- Remove printer differentiation assumptions from filtering/stats.