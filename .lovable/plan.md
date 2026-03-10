

## Plan: Show supervisor name and WhatsApp buttons in Reimbursements (admin view)

### Changes to `src/pages/app/Reimbursements.tsx`

**1. Fetch supervisors per event**

Add a query that, for admin users, fetches all `event_accreditors` for the visible events, then cross-references with `user_roles` (role = 'supervisor') and `profiles` to get the supervisor's name and phone. Store as a map: `eventId → { name, phone, userId }`.

```
- Query event_accreditors for all eventIds
- Query user_roles to filter only supervisors
- Query profiles for those supervisor user_ids (nombre, apellido, telefono)
- Build map: eventId → supervisor info
```

**2. Display supervisor name in each event card header**

In the `CardHeader` for each event (line ~301-306), add the supervisor name next to the event name when `isAdmin`:

```
Supervisor: Juan Pérez
```

**3. Per-event WhatsApp button**

Add a button with a MessageSquare icon in each event card's action area (line ~307-329) visible only for admins. On click, it invokes `send-whatsapp-message` with:
- `template_name: 'msg_rendiciones_pendientes'`
- `template_language: 'es'`
- `to_phone`: supervisor's phone
- `parameters: [supervisorName]`

Disabled if the event's reimbursement is already closed or supervisor has no phone.

**4. Bulk WhatsApp button next to "Descargar Excel"**

Add a button next to the existing "Descargar Excel" button (line ~279-283). On click:
- Filter events where `reimbursement_closed_at` is null (unclosed)
- For each, get the supervisor's phone and name
- Send `msg_rendiciones_pendientes` to each supervisor with `{{1}}` = supervisor name
- Show progress toast with count of sent/failed messages

**5. Add `MessageSquare` to lucide imports** (line 16).

### No database or edge function changes needed
The existing `send-whatsapp-message` edge function already supports the `parameters` array and `template_name` fields required.

