

## Plan: Send WhatsApp on applicant acceptance

### Change: `src/components/events/EventApplicantsDialog.tsx`

In the `handleConfirmAccept` function, after the successful update of `event_accreditors` and invoice sync (line 252), add a call to send the WhatsApp message using the `msg_seleccionado` template. The applicant's phone number needs to be retrieved from the already-fetched `profiles` data.

**1. Retrieve phone from profiles**

After the successful acceptance update, look up the applicant's phone from the `profiles` array (already queried and includes `telefono`). If a valid phone exists, invoke the edge function.

**2. Send WhatsApp after acceptance**

Insert after line 252 (invoice sync), before the success toast:

```typescript
// Send WhatsApp notification
const profile = profiles?.find(p => p.id === applicant.user_id);
if (profile?.telefono) {
  supabase.functions.invoke('send-whatsapp-message', {
    body: {
      template_name: 'msg_seleccionado',
      template_language: 'es',
      to_phone: profile.telefono,
      parameters: [applicant.nombre],
    },
  }).catch(() => {}); // fire-and-forget, don't block acceptance
}
```

This is fire-and-forget so a WhatsApp failure won't block the acceptance flow. The success toast will still show.

### Files changed
- `src/components/events/EventApplicantsDialog.tsx`

