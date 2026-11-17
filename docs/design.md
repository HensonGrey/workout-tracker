## 1. Principles

1. **One exercise at a time.** Today’s inputs come first; history sits below.
2. **Suggestions never block logging.** Pre-render suggested sets; save only what was actually performed.
3. **Keep navigation predictable.** Stack screens, labelled actions, no gestures required.
4. **Make gym use effortless.** Large inputs, visible saved states, primary actions near the bottom.
5. **Use quiet styling.** Flat surfaces, system fonts, restrained colour, no decorative motion.

## 2. Tokens

Nine semantic tokens. Theme values are applied through NativeWind `vars()`; Tailwind colour names map to the same variables in every theme.

Hex values below specify the colours; expose their RGB channels through variables such as `--background` and `--text-muted`.

| Token | Light | Dark | Sage | Sand | Plum |
|---|---|---|---|---|---|
| `background` | `#FFFFFF` | `#111827` | `#F7FAF7` | `#FFFBF5` | `#19131F` |
| `surface` | `#F3F4F6` | `#1F2937` | `#EAF1EB` | `#F4EBDD` | `#292032` |
| `border` | `#6B7280` | `#9CA3AF` | `#657568` | `#81705D` | `#A394AE` |
| `text` | `#111827` | `#F9FAFB` | `#17281D` | `#30261B` | `#FAF5FF` |
| `text-muted` | `#4B5563` | `#D1D5DB` | `#4B6050` | `#655542` | `#D8CCDF` |
| `accent` | `#1D4ED8` | `#93C5FD` | `#25603B` | `#8A460F` | `#D8B4FE` |
| `on-accent` | `#FFFFFF` | `#111827` | `#FFFFFF` | `#FFFFFF` | `#19131F` |
| `danger` | `#B91C1C` | `#FCA5A5` | `#B91C1C` | `#B91C1C` | `#FDA4AF` |
| `success` | `#166534` | `#86EFAC` | `#166534` | `#166534` | `#86EFAC` |

**Colour rules**

- `text`, `text-muted`, `danger`, and `success` appear only on `background` or `surface`.
- `on-accent` appears only on `accent`.
- Primary buttons have an `accent` fill and a `border` outline.
- Links use underlined `text`; colour alone never communicates selection, completion, or errors.
- Do not reduce text opacity for placeholders or disabled controls.

Calculated contrast for these pairings: normal text **≥5.47:1**, primary button labels **≥6.70:1**, and control borders against adjacent base surfaces **≥4.03:1**. These exceed AA text and control-boundary requirements.

**Custom theme**

Choose **Light or Dark base**, then one accent from this fixed grid:

| Blue | Indigo | Violet | Orchid | Rose |
|---|---|---|---|---|
| `#1D4ED8` | `#4338CA` | `#7E22CE` | `#A21CAF` | `#BE185D` |

| Red | Rust | Ochre | Forest | Teal |
|---|---|---|---|---|
| `#B91C1C` | `#9A3412` | `#854D0E` | `#166534` | `#0F766E` |

Custom themes replace `accent` and set `on-accent` to `#FFFFFF`; all other values come from the base. White labels achieve **≥5.47:1** across these swatches. On dark bases, retain the contrasting button outline; do not use these accents as body text.

Swatches have 48 × 48 touch targets, names for accessibility, and a visible check on the selected colour. Default theme: **System**, resolving to Light or Dark. Named themes have fixed appearances.

## 3. Type and spacing scale

System fonts only; support system text scaling without clipping.

| Use | Size / line height | Weight |
|---|---|---|
| Screen title | 28 / 34 | Bold |
| Exercise title | 24 / 30 | Bold |
| Section heading | 18 / 24 | Semibold |
| Body, buttons, inputs | 17 / 24 | Regular; buttons semibold |
| Set values, timer | 20 / 26 | Medium, tabular numerals |
| Notes, metadata | 14 / 20 | Regular |

- **Spacing:** 4, 8, 12, 16, 24, 32.
- **Screen gutters:** 16; section gaps: 24; field gaps: 12.
- **Radius:** 8 for inputs/buttons; 12 for grouped surfaces.
- **Borders:** 1; focused inputs use 2.
- **Targets:** 48 minimum; primary buttons and numeric inputs 56 high. Never below 44.
- Respect top/bottom safe areas. Scroll content clear of sticky actions and the keyboard.
- Allow rows and labels to grow with text scaling; never truncate exercise names.

## 4. Components

| Component | Default | Pressed / focused | Disabled / other states |
|---|---|---|---|
| Primary button | `accent`, `on-accent`, `border` outline | Add inner `on-accent` outline; preserve fill | `surface`, `text-muted`, `border`; no feedback |
| Secondary button | `background`, `text`, `border` | `surface` fill | `surface`, `text-muted`; no feedback |
| Text action | `text`, underlined; 48-high target | `surface` background | `text-muted`, no underline |
| Destructive action | `danger` label on base surface | `surface` fill and `danger` outline | `text-muted` |
| List row | Title, optional muted subtitle, labelled trailing action | `surface` fill | Muted subtitle explains unavailability |
| Text / numeric input | `surface`, `text`, `border`; persistent label | 2px `text` border | Read-only `text-muted`; error adds `danger` border and message |
| Set row | Number, kg, reps, Done, Remove | Inputs/actions follow rules above | Saved: check + “Saved” in `success`; Edit action |
| Section header | Semibold `text`, optional action | Action follows text-action rules | No container interaction |
| Empty state | Short `text` heading, muted explanation, one button | Button rules | No illustration |
| Confirm dialog | Platform alert with explicit consequence | Platform defaults | Cancel and named destructive action |
| Timer chip | `surface`, `text`, “Rest” label | Noninteractive | “Rest —” before first save |
| Theme option | Bordered row or swatch, name | `surface` pressed state | Selected check and “Selected” label |

Validation never relies on colour alone. Icon-only controls need accessible labels such as “Remove set 3.”

## 5. Screens

Wireframes show hierarchy, not fixed heights. Each screen uses the native Stack header. Small forms open in a Stack modal using the same components.

### 1. Home — `/`

```text
Workout                    Settings
Programs ›

Strength A                 Active
Choose a training day

Day A                      Up next
Squat · Bench · Row         [Start]

Day B
Deadlift · Press            [Start]
```

**Hierarchy:** header → Programs entry → active program → ordered day rows.

**Actions**

- **Start:** creates a session and opens its first exercise.
- With an unfinished session, show **“Day A · In progress” / Resume** above the list. Other Start buttons are unavailable until that session is finished or skipped.
- **Programs / Settings:** open their respective screens.
- “Up next” is a text badge plus a thicker border, never colour alone.

**Empty states**

- No programs: “Build your first program.” → **Create program**.
- Programs exist but none active: “Choose a program to train.” → **Choose program**.
- Active program has no days: “Add a training day.” → **Edit program**.
- A day without exercises shows **Add exercises** instead of Start.

**Key classes**

- Page: `flex-1 bg-background px-4`
- Day row: `rounded-xl border border-border bg-surface p-4 gap-3`
- Start: `min-h-14 rounded-lg border border-border bg-accent px-6 items-center justify-center`

### 2. Programs — `/programs`

```text
‹ Back              Programs

Strength A             Active
Open ›                  More

Travel
Open ›                  More

                     [+ Program]
```

**Hierarchy:** header → program list → bottom Create button.

**Actions**

- Row opens Program detail.
- **More:** Rename, Set active, Delete.
- Create opens a name field with **Create program**.
- Set active makes this the sole active program.
- Delete confirms the program name and loss of its days and workout history.

**Empty:** “No programs yet.” → **Create program**.

**Key classes**

- List row: `min-h-16 border-b border-border py-4`
- Active label: `text-sm font-semibold text-success`
- Bottom action area: `border-t border-border bg-background p-4`

### 3. Program detail — `/program/[programId]`

```text
‹ Programs          Strength A

Active program

1  Day A                    ›
   Squat · Bench · Row     More

2  Day B                    ›
   Deadlift · Press        More

                        [+ Day]
```

**Hierarchy:** header → active status → ordered days → Add day.

**Actions**

- Row opens Day editor.
- **Add day / Rename:** name form.
- **More:** Rename, Move up, Move down, Delete. Boundary move actions are disabled.
- Delete confirms removal from the program; historical sessions remain readable.
- New days append at the end.

**Empty:** “Add your first training day.” → **Add day**.

**Key classes**

- Day name: `text-lg font-semibold text-text`
- Exercise summary: `mt-1 text-sm text-text-muted`
- Day action target: `min-h-12 min-w-12 items-center justify-center`

### 4. Day editor — `/day/[dayId]`

```text
‹ Strength A               Day A

1  Squat                   More
   5 × 5
   Controlled descent

2  Dips                    More
   4 × 10
   @90%

                   [+ Exercise]
```

**Hierarchy:** header → ordered placements with prescription and program note → Add exercise.

**Add/edit form:** Name → matching exercises in this program → Suggested sets → Suggested reps → Program note → Save.

**Actions**

- Name suggestions display both name and prescription: **Squat · 5 × 5**.
- Choosing a suggestion reuses that exercise identity; the program note belongs to this day’s placement.
- Accept a positive integer set count and reps text such as `10` or `8-12`.
- Row opens Edit. More offers Move up, Move down, Remove.
- Remove confirms removal from this day; existing history remains.
- Changing name, sets, or rep suggestion selects/creates another identity. The form explains: “This prescription has separate history.”
- Editing only the program note preserves identity.

**Empty:** “No exercises in this day.” → **Add exercise**.

**Key classes**

- Exercise row: `rounded-xl border border-border bg-surface p-4`
- Note: `mt-1 text-sm text-text-muted`
- Form input: `min-h-14 rounded-lg border border-border bg-surface px-4 text-text`

### 5. Session — `/session/[sessionId]`

```text
‹ Home              Day A     More
Exercise 2 of 6

Dips
4 × 10 suggested
Program note: @90%

Today's sets             Rest 1:24
 #    kg       reps
 1   [20.0]    [10]    [Saved] [−]
 2   [20.0]    [10]    [ Done] [−]
 3   [20.0]    [10]    [ Done] [−]
 4   [20.0]    [10]    [ Done] [−]

[+ Add set]
Today's note
[How did this feel?              ]

─────────────────────────────────
History · This program
12 Nov
20 × 10 · 20 × 10 · 20 × 8
“Last set was hard.”

  [Previous]               [Next]
```

**Hierarchy:** header/progress → exercise identity → program note → today’s sets/timer → Add set → session note → history → sticky navigation.

**Actions**

- **Done:** validates and saves that row, displays Saved, resets rest to `0:00`.
- **Saved/Edit:** allows correction of the recorded row.
- **Previous / Next:** move within the same session route; no new Stack entry per exercise.
- On the last exercise, Next becomes **Finish**.
- Header **More:** Skip exercise, Skip day, Finish workout.
- Back returns Home with the session still in progress; Resume restores the current exercise.
- Session note saves automatically.

**Empty states**

- No history: “Your first session with this exercise.”
- No sets: “No sets logged.” → **Add set**.
- Skipped exercise: “Exercise skipped.” → **Undo skip**; history remains below.

**Key classes**

- Exercise title: `text-2xl font-bold text-text`
- Today group: `gap-3`
- History: `mt-8 border-t border-border pt-6`
- Footer: `flex-row gap-3 border-t border-border bg-background p-4`

### 6. Settings — `/settings`

```text
‹ Home              Settings

Appearance
(✓) System
( ) Light     ( ) Dark
( ) Sage      ( ) Sand
( ) Plum      ( ) Custom

Custom base      Light | Dark
Accent            ■ ■ ■ ■ ■
                  ■ ■ ■ ■ ■

Data
Export data                     ›
Import data                     ›
Replaces all programs and history
```

**Hierarchy:** header → theme choices → custom controls when selected → data actions.

**Actions**

- Theme changes apply immediately and persist.
- Custom reveals base choice, swatch grid, and a small sample button.
- **Export:** saves/shares a versioned JSON backup containing all app data.
- **Import:** select file → validate → show program/session counts → confirm replacement.
- Invalid import shows a readable error and changes nothing.
- Confirmation: **“Replace all data?”** with Cancel and **Replace data**. Recommend exporting first.

**Empty:** theme controls always work; export can produce an empty backup. Before a custom choice, default to Light + Blue.

**Key classes**

- Theme row: `min-h-14 flex-row items-center rounded-lg border border-border px-4`
- Swatch target: `h-12 w-12 items-center justify-center`
- Data explanation: `text-sm text-text-muted`

## 6. Session screen detail

### Set row

At a 360-wide viewport with 16-unit gutters, use:

| Element | Width | Behaviour |
|---|---:|---|
| Set number | 24 | Plain text |
| Weight | Flexible; approximately 80 | Decimal kg |
| Reps | Flexible; approximately 64 | Integer |
| Done/Saved | 88 | Explicit save/edit action |
| Remove | 44 | Minus icon, accessible label |

Four 4-unit gaps fit the row within 328 units. All controls are 56 high.

Persistent column headings identify **kg** and **reps**. Each input also has an accessible label containing its set number. At larger text sizes or narrower widths, place Done and Remove on a second line beneath the inputs.

- Weight accepts zero and positive decimals; accept comma or dot decimal separators.
- Reps must be a positive integer.
- Numeric keyboards match each input. Provide a visible keyboard-dismiss action.
- Invalid Done attempts show an inline error under that row.
- Prefilled values remain unsaved until Done is tapped. No placeholder is treated as data.

### Prefill, add, remove

- Initially show exactly the suggested number of rows.
- Prefill matching row positions from the latest non-skipped session with saved sets for this identity in this program.
- If that session had fewer sets, leave remaining rows blank.
- If it had more sets, do not automatically add extra rows.
- **Add set** appends one unsaved row, copying the preceding row’s values when available.
- Removing an unsaved row is immediate. Removing a saved row confirms **Delete set**.
- Renumber remaining rows sequentially. History reflects only saved rows.
- Persist drafts so navigating away, backgrounding, or resuming does not discard typed values.

### Timer

Keep the count-up timer in the **Today’s sets** heading, aligned right. Keep that heading visible while scrolling through today’s rows; it scrolls away when history takes over.

- Before any saved set: **Rest —**.
- Saving a new set anywhere in the session resets it to **Rest 0:00**.
- It continues across exercises, backgrounding, and Resume.
- Editing or deleting a saved set does not reset it.
- No target, alarm, countdown, pause, or manual reset.
- Do not announce every second to screen readers.

### History

Separate history using 32 units of space, a border, and **History · This program**.

Show newest first:

- Session date and training-day name.
- Actual saved sets as `20 kg × 10`.
- Explicit **Skipped** marker where applicable.
- Session note, if present.

Exclude the current session. Initially show the latest three entries; **Show older** expands more. Reusing the same identity on another day shares this history.

### Skip and finish

Keep skip actions in the labelled **More** menu, away from Done and Next.

- **Skip exercise:** confirm with the exercise name. If saved sets exist, explicitly state that skipping will remove those sets. Retain its session note, mark skipped, and advance.
- **Skip day:** confirm with the day name. Retain already saved sets and notes; mark the session skipped. Untouched exercises are not individually marked skipped.
- **Undo skip:** restores an exercise for logging; deleted sets are not silently restored.
- **Finish:** confirms the saved-set count and number of exercises without saved sets. Unperformed exercises become skipped; unsaved suggestions are discarded.
- Before moving away with edited but unsaved set values, offer **Keep editing** or **Discard unsaved changes**. Unchanged prefilled suggestions do not trigger this warning.

## 7. Open questions

| Ambiguity | Recommendation |
|---|---|
| How is “Up next” chosen? | First day initially; then the next ordered day after the latest completed or skipped session, wrapping at the end. Starting another day remains allowed. |
| Can multiple sessions be in progress? | Allow one across the app. Resume it before starting another. Switching the active program does not change that session. |
| Can an identical exercise occur twice in one day? | Disallow it with the current model: set entries and session notes cannot distinguish two placements of the same identity. Reuse across different days is allowed. |
| How strict is identity matching? | Trim names, compare case-insensitively, and normalize rep ranges such as `8 – 12` to `8-12`. Notes never affect identity. |
| What happens when a prescription changes? | Replace the placement’s identity for future sessions. Retain the old identity and its historical records; never relabel past workouts. |
| Can a program change during training? | Allow program editing, but the running session keeps its starting exercise order, prescriptions, and program notes. |
| Where do drafts and snapshots live? | Extend persistence to store unsaved row values, the current exercise, and session snapshots. The supplied model does not represent these yet. |
| What does program deletion remove? | Delete the program and its history after an explicit warning. Block deletion while its session is in progress. Deleting a day or placement preserves historical snapshots. |
| Does a skipped day advance the rotation? | Yes. It counts as the latest addressed day, while retaining the distinct skipped status. |
