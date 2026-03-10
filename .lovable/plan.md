

## Plan: WhatsApp on user approval + bulk WhatsApp sending in Users

### 1. Auto-send WhatsApp on approval (`src/pages/app/Users.tsx`)

In `handleApprove`, after the profile update succeeds and before the success toast, add a call to `send-whatsapp-message` with:
- `template_name: 'msg_bienvenida'`
- `template_language: 'es'`
- `to_phone: selectedUser.telefono`
- `parameters: [selectedUser.nombre]`

If the user has no phone or the send fails, show a warning toast but don't block the approval. The approval itself always completes.

### 2. Bulk WhatsApp button + dialog (`src/pages/app/Users.tsx`)

**New button** in the page header actions (next to "Crear Usuario"): "Enviar WhatsApp" with a MessageSquare icon.

**New dialog** with the following flow:

- **Step 1 - Select template**: Fetch `whatsapp_templates` where `status = 'approved'`, show a Select dropdown to pick one.
- **Step 2 - Select recipients**: Show all users from `allUsers` that have a phone number (`telefono`). Each row has a Checkbox, name, phone. Include "Select all / Deselect all" toggle.
- **Step 3 - Confirm & send**: Button shows count of selected users. On click, loop through selected users calling `send-whatsapp-message` with:
  - `template_name`: selected template name
  - `template_language`: selected template language
  - `to_phone`: user's telefono
  - `parameters: [user.nombre]` (the `{{1}}` variable is always the recipient's name)

Show progress/result toast with sent/failed counts.

**New state variables**: `showBulkWhatsappDialog`, `bulkWhatsappTemplate`, `selectedWhatsappUsers` (Set of user IDs), `whatsappTemplates` (fetched list).

### 3. Imports to add

- `MessageSquare` from lucide-react
- `Checkbox` from `@/components/ui/checkbox`
- Dialog components already imported via ConfirmDialog pattern but will need direct Dialog imports
- `ScrollArea` for the user list
- `Select` components (already available)

### Files changed
- `src/pages/app/Users.tsx` — all changes in this single file

