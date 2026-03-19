

## Plan: Fix white space in EventTeamDialog

### Root cause
The dialog has a fixed `h-[85vh]` and the `TabsContent` uses `flex-1 min-h-0` to fill all available space. Radix Tabs keeps inactive panels in the DOM (hidden), and the flex layout distributes excess vertical space as empty white area above the content when there are few table rows.

### Fix: `src/components/events/EventTeamDialog.tsx`

1. **Remove `flex-1` from `TabsContent`** — Instead, let the content flow naturally from top to bottom. The scrollable area should be the table container only, not the entire tab content.

2. **Change table container from `flex-1` to fixed max-height** — Replace `flex-1 min-h-0 overflow-auto` on the table wrapper with `overflow-auto max-h-[calc(85vh-320px)]` (approximately: dialog height minus header, tabs, search, pagination, footer). This ensures the table scrolls when needed but doesn't stretch to fill empty space.

3. **Remove `flex flex-col flex-1 min-h-0 overflow-hidden`** from the Tabs and TabsContent elements — These are no longer needed since the table container handles its own scroll. Keep `mt-2` on TabsContent.

4. **Change the middle content area** (`div.flex-1.min-h-0.flex.flex-col.overflow-hidden.px-6`) to `overflow-y-auto px-6 flex-1 min-h-0` — This makes the entire content area scrollable as a unit, so content always starts at the top.

### Result
Content (search bar, table, pagination) will always start directly below the tabs with no empty space gap. The table area scrolls when there are many rows, but doesn't expand to fill whitespace when there are few.

### Files changed
- `src/components/events/EventTeamDialog.tsx`

