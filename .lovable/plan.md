

## Plan: Add search filter to bulk WhatsApp dialog in Users

### Change: `src/pages/app/Users.tsx`

**1. Add search state**

Add `bulkWhatsappSearch` state (string) for filtering the recipient list.

**2. Add filtered list**

Create `filteredUsersWithPhone` that filters `usersWithPhone` by name or phone matching the search term (case-insensitive).

**3. Update toggle all**

Make "Seleccionar todos / Deseleccionar todos" operate on the **filtered** list so the user can search, then select/deselect just the visible results.

**4. Add search input in the dialog**

Insert an `Input` with a `Search` icon above the `ScrollArea` (inside the Recipients section), similar to the pattern used in `UsersTable`. Render `filteredUsersWithPhone` instead of `usersWithPhone` in the list.

**5. Reset search on dialog open**

Clear `bulkWhatsappSearch` when opening the dialog.

### Files changed
- `src/pages/app/Users.tsx`

