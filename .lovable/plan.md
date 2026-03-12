

## Plan: Bulk WhatsApp "Eventos Disponibles" button in Events admin table

### Change: `src/components/events/EventsAdminTable.tsx`

**1. New state variables**
- `whatsappDialogOpen` (boolean)
- `selectedUserIds` (Set of user IDs)
- `sending` (boolean)
- `users` (array of acreditadores/supervisores with phone numbers, fetched from profiles + user_roles)
- `searchFilter` (string for name/phone filtering)
- `confirmOpen` (boolean for confirmation step)

**2. Fetch acreditadores & supervisores on dialog open**
Query `user_roles` for users with role `acreditador` or `supervisor`, then fetch their profiles (nombre, apellido, telefono). Filter to only those with a valid phone number.

**3. New button next to "Descargar Todos los Contratos"**
"Enviar WhatsApp Masivo" with a `MessageSquare` icon. Opens the selection dialog.

**4. Selection dialog**
- Search input to filter by name or phone
- Checkbox list of acreditadores/supervisores with phone numbers inside a ScrollArea
- "Seleccionar todos / Deseleccionar todos" toggle for filtered results
- Shows count of selected users

**5. Confirmation dialog**
After clicking "Enviar", show a ConfirmDialog stating "Se enviará la plantilla msg_eventos_disponibles a X usuarios. ¿Confirmar?"

**6. Send logic**
Loop through selected users, call `send-whatsapp-message` edge function with:
- `template_name: 'msg_eventos_disponibles'`
- `template_language: 'es'`
- `to_phone: user.telefono`
- `parameters: [user.nombre]`

Show success/failure count toast.

**7. New imports**
- `MessageSquare, Search` from lucide-react
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription` from ui/dialog
- `Checkbox` from ui/checkbox
- `ScrollArea` from ui/scroll-area
- `Input` from ui/input

### Files changed
- `src/components/events/EventsAdminTable.tsx`

