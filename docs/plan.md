# Workout tracker: implementation plan and status

A client-only Expo SDK 58 app (expo-router, React 19.3, RN 0.88, NativeWind 4 / Tailwind 3): programs → training days → exercises, history in a local SQLite DB, JSON import/export, a rest timer, selectable themes, and tests that pin the data logic so later additions can't silently break it. The visual design is GPT-6 Astra's, in [design.md](design.md).

## Status (17-11-2026)

| Step | State |
|---|---|
| 0. Baseline (NativeWind, ESLint) | Done, committed |
| 1. Design from Astra | Done, committed (`docs/design.md`) |
| 2. Test harness | Done, committed |
| 3. Schema + migration | Done, committed |
| 4. Programs + active program | **Committed, not verified on a device** |
| 4b. Exercise library (migration v2, 87 seeded names) | **Committed, not verified on a device** |
| 5. Training days | Next |
| 6–13 | Not started |

Lint, typecheck and all 23 tests pass at the last commit. **Nothing after step 3 has been seen running on a phone.** The JS bundle compiles (`npx expo export --platform android` bundles all modules; it only failed at the Hermes bytecode step, on a Temp-folder permission error that dev mode doesn't hit).

### Why it hasn't run on a device yet

On the work PC, Expo Go spins or crashes after scanning the QR code. Most likely cause: the Wi-Fi profile there is **Public** and there is no firewall rule letting Node accept inbound connections, so the phone never reaches Metro on port 8081. Tunnel mode needs an Expo account. On a home network set to Private (or with Node allowed through the firewall) a plain `npx expo start` should work. Alternatives that avoid the network: an Android phone over USB (`adb` from Platform-Tools in `%LOCALAPPDATA%\Android\Sdk\platform-tools`, then `npx expo start --localhost` and press `a`), or an Android emulator.

### First thing to do at home

1. `npm install`, then `npx expo start` and open the app in Expo Go (it must support SDK 58).
2. If Expo Go on that phone ever ran an earlier build of this app, clear Expo Go's data first: early step 3 builds created `workout.db` with snake_case columns that the current schema doesn't match.
3. Run the step 4 manual check below. If it crashes, the most likely suspects are the NativeWind theme variables in `src/app/_layout.tsx` (docs don't confirm navigator screens inherit `vars()`) or the database opening.

## Requirements (the owner's choices; these win)

- Extremely simple, nothing fancy. Light feel.
- Create a program, set one as active, build on it. Option to start a day.
- Inside a day: one screen per exercise, with its history in this program below.
- Skip an exercise, or skip the entire day.
- Exercises have a notes field shown unobtrusively ("dips 4x10 @90%": 4 sets, 10 reps, note "@90%").
- Sets and rep range are suggestions: the set count is how many rows are pre-rendered, not how many must be done. Sets can be added or removed individually, and history reflects what was actually done.
- Sets and rep range define the exercise: 5x5 squat and 3x8 squat are different exercises with separate histories.
- Notes are separate from sets/reps, allowed when building the program and on the exercise during the current training day.
- Light and dark mode first, plus a few prebuilt themes and a way to customise.
- Rest timer that counts **up** from 0:00.
- Import/export of all data.
- A seeded library of common exercises so the obvious ones don't have to be typed.

## Decisions

- **Targets:** iOS and Android only. Web-only starter files were deleted.
- **Exercise identity = program + name (case-insensitive) + sets + reps.** The same identity on two days of one program shares one history; another program always gets a new exercise. Changing sets or reps in the editor re-points the day to the matching (or a new) exercise; the old history stays with the old one.
- **Notes:** a *program note* on the day's placement (`training_day_exercise.notes`, shown small under the title) and a *session note* per session per exercise (`session_exercise.notes`, shown in history). Never part of identity.
- **A set** is weight (kg, decimal) × reps (integer). Only sets actually saved are stored.
- **Skips are recorded:** a skipped exercise shows as skipped in history and **keeps any sets already saved**; a skipped day is a session with status `skipped`, so "up next" moves on.
- **Deleting a training day keeps its history:** sessions keep `dayName` and their `trainingDayId` becomes null.
- **Unsaved set values live in memory only** (no draft tables); the session screen warns before leaving with edited, unsaved values.
- **Start a day:** home lists the active program's days, the one after the latest completed or skipped session highlighted as "Up next" (wrapping). One session in progress at a time; home shows Resume.
- **First program created while none is active becomes active.**
- **Exercise library:** `exercise_library` table seeded by migration v2. Step 6 suggests names from it; any new name typed is added to it. Included in export.
- **Rest timer:** starts at 0:00 when a set is saved, resets on the next saved set, computed from a start timestamp so backgrounding doesn't break it. No target or alarm.
- **Themes:** System / Light / Dark, Astra's Sage / Sand / Plum, and custom = light or dark base + one accent from a 10-swatch grid. Stored in `expo-sqlite/kv-store`, not exported. Light and dark tokens already exist (`src/themes.ts`, pulled forward from step 10).
- **Export:** one JSON file with a `schemaVersion` and every table. **Import replaces all data** in one transaction after a confirm dialog. No merge.
- **Naming:** camelCase columns (rows map straight onto `src/db/entities.ts` types), snake_case table names, `WorkoutSessionStatus` is a string enum.

## Data model

Schema in `src/db/migrate-database.ts`, row types in `src/db/entities.ts`. `foreign_keys = ON`, WAL. Migrations are an ordered list; index + 1 = `PRAGMA user_version`. Never edit an applied migration, append a new one.

| Table | Columns |
|---|---|
| `program` | `id`, `name`, `isActive` (at most one = 1), `position`, `createdAt` |
| `training_day` | `id`, `programId` (cascade), `name`, `position` |
| `exercise` | `id`, `programId` (cascade), `name`, `sets`, `reps` (text, "10" or "8-12"); unique on program + name NOCASE + sets + reps |
| `training_day_exercise` | `trainingDayId` (cascade), `exerciseId` (cascade), `position`, `notes` |
| `workout_session` | `id`, `programId` (cascade), `trainingDayId` (set null), `dayName`, `status` (at most one `in_progress`), `startedAt`, `finishedAt` |
| `set_entry` | `id`, `sessionId` (cascade), `exerciseId` (cascade), `setNumber`, `weight`, `reps` |
| `session_exercise` | `sessionId`, `exerciseId`, `skipped`, `notes`; a row exists only when skipped or noted |
| `exercise_library` | `id`, `name` (unique NOCASE) — v2 |

`position` is display order (Astra's Move up / Move down).

## Code layout

- `src/db/`: `migrate-database.ts`, `entities.ts`, and one file of plain async functions per area taking `db` first (`programs.ts` done; `training-days.ts`, `exercises.ts`, `workout-sessions.ts`, `backup.ts` to come). Only `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`, with **array** params (the test helper only supports that form).
- `src/app/`: `_layout.tsx` (theme variables, `SQLiteProvider`, `Stack`), `index.tsx` (home), `programs.tsx`, `edit-program.tsx` (modal). To come: `program/[programId].tsx`, `day/[dayId].tsx`, `session/[sessionId].tsx`, `settings.tsx`.
- `src/components/`: `button.tsx`, `text-field.tsx`, `empty-state.tsx`. `src/hooks/use-focused-data.ts` reloads screen data on focus (pass a stable loader).
- `src/themes.ts` + `tailwind.config.js`: semantic colours (`bg-background`, `text-text-muted`, `bg-accent`…) read CSS variables set with NativeWind `vars()`.
- **Tests** in `__tests__/`, run against real SQLite through Node's built-in `node:sqlite` (`test-utils/open-test-database.ts`). No SQL mocks.

## How steps are run

- One step at a time: do it, run `npx expo lint`, `npx tsc --noEmit`, `npx jest`, report with the manual check, stop with the diff uncommitted for review. A "go" commits that step on its own and starts the next.
- Code comments are one sentence. The dev server is started by the owner, not by Claude.
- Branch `core-tracker`.

## Steps

**0. Baseline.** ✅

**1. Design from Astra.** ✅ `codex exec -m gpt-6-astra -s read-only` with the requirements above; output in `docs/design.md`.

**2. Test harness.** ✅ Jest 30 + `jest-expo`, `node:sqlite` helper.

**3. Schema + migration.** ✅ *Manual:* app boots with no error screen.

**4. Programs + active program.** ⚠️ unverified. *Tests:* create, rename, delete, blank names rejected, one active at a time, first program auto-active, delete blocked while a workout is in progress.
*Manual:* home shows "Build your first program."; create "Strength" (becomes active); add "Travel", set it active, restart, still active; delete Travel, home says "Choose a program to train."; dark mode follows the phone.

**4b. Exercise library.** ⚠️ unverified. *Tests:* seeded with 50–100 names, a v1 database upgrades and keeps its data, case-insensitive uniqueness.

**5. Training days.** `training-days.ts`, `program/[programId].tsx` (add, rename, move up/down, delete), days listed on home; tapping a program row opens it (edit/delete move to a header button).
*Tests:* days scoped to their program, ordering and moves, cascade with the program, deleting a day keeps its sessions.
*Manual:* add days to each program; they don't leak between programs.

**6. Exercises on a day.** `exercises.ts`, `day/[dayId].tsx`: name field suggesting from `exercise_library` and the program's exercises (shown as "Squat · 5 × 5"), sets, reps, program note. New names go into the library. The same identity can't appear twice in one day.
*Tests:* same name + sets + reps on two days → one row, separate program notes; different sets or reps → different row; another program → different row; editing sets/reps re-points the day and keeps the old history; unlink keeps the row; case and whitespace don't duplicate.
*Manual:* "Dips, 4, 10, @90%" on Day A, "Dips, 4, 10" on Day B, "Dips, 3, 12" on Day C, "Dips, 4, 10" in Program 2.

**7. Session logic (no UI).** `workout-sessions.ts`: start, save/edit/remove sets, skip exercise (keeps saved sets), session note, skip day, finish (unperformed exercises become skipped), one in progress, `getSuggestedNextDay` (advances past completed and skipped, wraps), history newest first with skips and notes, shared across days using the same exercise, separate for another sets/reps variant or program.

**8. Session screen.** `session/[sessionId].tsx` per `docs/design.md` §5–6: one exercise per screen, rows from `sets` prefilled from the last session, add/remove set, program note, session note, Previous / Next / Finish, Skip exercise / Skip day in a More menu, history below (latest three, "Show older"). Start and Resume on home.
*Manual:* start Day A, do 5 sets of the 4x10 Dips with a note, skip the next exercise, finish; Day B shows those sets and the note; Day C's 3x12 Dips has no history; skip a day and home suggests the next one.

**9. Rest timer.** Count-up in the "Today's sets" heading, from the last saved set.
*Tests:* elapsed seconds from the timestamp, never negative, formatting past 60 s.

**10. Themes.** Sage / Sand / Plum and the custom accent grid on top of the existing light/dark tokens, settings screen picker, persisted in `expo-sqlite/kv-store`.
*Manual:* every screen in light, dark and one prebuilt theme; choice survives a restart.

**11. Export / import logic.** `backup.ts`: export → import into an empty DB → export again is identical; malformed JSON, wrong `schemaVersion` and broken references are rejected with existing data untouched.

**12. Export / import screen.** `npx expo install expo-sharing expo-document-picker` (PowerShell form: `npx expo install <pkg> "--" --dev` only for dev deps). Export: `new File(Paths.cache, name)` → `write` → `Sharing.shareAsync`. Import: `DocumentPicker.getDocumentAsync({ type: 'application/json' })` → `new File(uri).text()` → `parseBackup` → confirm → `importAllData`.

**13. Cleanup.** Delete unused starter files (`explore.tsx`, `hint-row`, `web-badge`, `external-link`, `collapsible`, `app-tabs`, `animated-icon` if unused, `themed-*` and `Colors` in `constants/theme.ts`, tab icons, `reset-project`), update `README.md`.

## Not included

Web, lb units, rest-timer targets or alarms, charts, drag-to-reorder, cloud sync, import-merge, a full colour picker, screen-level UI tests.
