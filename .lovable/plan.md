

## Plan: Improve UX/UI of EventTeamDialog

The current dialog uses dense data tables with many columns and small filter inputs that feel cluttered, especially on medium screens. The improvements focus on visual clarity, better spacing, and a more polished user experience.

### Changes: `src/components/events/EventTeamDialog.tsx`

**1. Cleaner filter section**
- Replace the grid of bare inputs with a single search input that filters across name, RUT, email, and phone simultaneously. Remove the 5-6 individual filter inputs per tab — they cause visual clutter and take up too much vertical space.
- Add a subtle counter badge showing "N seleccionados" and total available.

**2. Simplify table columns**
- **Supervisors tab**: Show only Checkbox, Nombre (full name), RUT, Teléfono, Ranking (star or number badge), Turno. Drop Email column (rarely needed for selection).
- **Accreditors tab**: Show Checkbox, Nombre, RUT, Teléfono, Idioma, Ranking, Turno. Drop Email and Estatura columns to reduce horizontal crowding.
- Reduce `min-w` values since fewer columns are shown (600px for supervisors, 700px for accreditors).

**3. Visual improvements to table rows**
- Add `bg-primary/5` highlight to selected rows so users can instantly see who is checked.
- Make checkbox column narrower (`w-10`).
- Use `text-xs` for RUT and phone to save horizontal space.
- Show ranking as a colored badge (green for high, yellow for mid, red for low).

**4. Better tab indicators**
- Style the tab triggers with count badges: e.g., "Supervisores" with a small pill showing the selected count.

**5. Select All / Deselect All**
- Add a "Seleccionar todos" / "Deseleccionar todos" text button above each table to quickly toggle all visible (filtered) users.

**6. Shift select inline improvement**
- Show shift selector only when row is selected, but use a smaller, more compact design with icon-based AM/PM/Full toggles instead of a full Select dropdown.

**7. Footer summary**
- Show a summary line in the footer: "Total: X supervisores, Y acreditadores seleccionados".

### Files changed
- `src/components/events/EventTeamDialog.tsx`

