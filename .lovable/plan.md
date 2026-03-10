

## Plan: Add confirmation dialog before bulk WhatsApp send in Reimbursements

### Change: `src/pages/app/Reimbursements.tsx`

**1. Add state for confirmation dialog**

Add `showBulkConfirm` boolean state and a `bulkTargets` state to hold the list of supervisors to notify.

**2. Split `sendBulkWhatsapp` into two steps**

- **Step 1 (on button click):** Compute the `targets` list (unclosed events with supervisor phone), store in `bulkTargets`, and open the confirm dialog (`showBulkConfirm = true`). If no targets, show toast and return.
- **Step 2 (on confirm):** Execute the existing send loop using `bulkTargets`.

**3. Add confirmation dialog UI**

Use a `Dialog` (not `ConfirmDialog` since we need custom content) that shows:
- Title: "Confirmar envío masivo"
- A table/list of supervisors with their name and phone number
- Count: "Se enviarán X mensajes"
- Cancel and Confirm buttons

This gives the admin full visibility before sending.

