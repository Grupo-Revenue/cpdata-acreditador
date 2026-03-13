

## Plan: Bulk WhatsApp button in Invoices page

### New file: `src/components/invoices/BulkWhatsappInvoicesDialog.tsx`

A dialog component that:

1. **Template selection** — Two radio/select options: `msg_pendiente_boleta` and `msg_boleta_pagada`
2. **Auto-filter recipients based on template**:
   - `msg_pendiente_boleta`: shows only invoices where `file_url` is null (haven't uploaded their invoice)
   - `msg_boleta_pagada`: shows only invoices where `file_url` is not null (have uploaded)
3. **User list with checkboxes** — Each row shows: name, phone, invoice status badge, and whether they've uploaded (Sí/No indicator). Includes search filter by name/phone and select all toggle.
4. **Confirmation** — Uses `ConfirmDialog` before sending
5. **Send logic** — Loops through selected, calls `send-whatsapp-message` with the chosen template name and `parameters: [nombre]` for `{{1}}`

Props: receives `invoices: InvoiceRow[]` from the parent (already filtered to admin view), plus `open`/`onOpenChange`.

### Change: `src/pages/app/Invoices.tsx`

- Add state `bulkWhatsappOpen`
- Add a second button next to "Crear Boleta" in `PageHeader.actions`: "WhatsApp Masivo" with `MessageSquare` icon
- Render `BulkWhatsappInvoicesDialog` passing the current `invoices` array

### Files changed
- `src/components/invoices/BulkWhatsappInvoicesDialog.tsx` (new)
- `src/pages/app/Invoices.tsx`

