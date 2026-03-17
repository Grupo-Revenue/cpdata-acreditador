

## Plan: Fix EventTeamDialog layout stability and table visibility

The dialog currently has `max-w-4xl max-h-[85vh] overflow-y-auto` on the `DialogContent`, but the content inside (filters + table + pagination + footer) causes layout shifts as tabs change and the table width overflows without horizontal scroll.

### Changes: `src/components/events/EventTeamDialog.tsx`

**1. Fix dialog size to be stable**
- Change `DialogContent` to use fixed dimensions: `w-[95vw] max-w-5xl h-[85vh]` with `flex flex-col` layout instead of `overflow-y-auto` on the whole content.
- This prevents the dialog from resizing when switching between tabs.

**2. Structure internal layout with flex**
- `DialogHeader` and `DialogFooter` stay fixed (no shrink).
- The `Tabs` container gets `flex-1 min-h-0 flex flex-col overflow-hidden`.
- Each `TabsContent` gets `flex-1 min-h-0 flex flex-col overflow-hidden`.
- Filters section stays fixed height.
- Table wraps in a `div` with `flex-1 min-h-0 overflow-auto` for both vertical and horizontal scroll, ensuring the full table is accessible.

**3. Add min-width to tables**
- Wrap each `Table` in `overflow-auto` container with `min-w-[700px]` on the supervisor table and `min-w-[850px]` on the accreditor table (more columns) so columns don't get crushed.

**4. Pagination stays at bottom**
- `PaginationControls` stays outside the scrollable area, pinned below the table.

### Files changed
- `src/components/events/EventTeamDialog.tsx`

