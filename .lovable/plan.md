

## Plan: Fix bulk WhatsApp and add selection checkboxes

### Problem 1: "No hay supervisores con teléfono"
The filter on line 317 checks `!!t.sup?.phone` which fails for empty strings `""`. Also, the `telefono` field might have whitespace. Fix: trim the phone value and treat empty strings as no phone.

### Problem 2: Allow selecting which supervisors to notify

### Changes to `src/pages/app/Reimbursements.tsx`

**1. Add selection state**
Add `selectedBulkTargets` state as a `Set<string>` of eventIds. Initialize it with all targets when the dialog opens.

**2. Fix phone filtering in `prepareBulkWhatsapp`**
Change the filter from `!!t.sup?.phone` to `!!t.sup?.phone?.trim()` to handle empty strings and whitespace.

**3. Update bulk confirmation dialog**
- Add a `Checkbox` next to each supervisor row
- Toggle selection on click
- Show selected count in the send button
- Only send to selected targets in `executeBulkWhatsapp`
- Add a "Select all / Deselect all" toggle at the top

**4. Update `executeBulkWhatsapp`**
Filter `bulkTargets` by `selectedBulkTargets` before sending.

