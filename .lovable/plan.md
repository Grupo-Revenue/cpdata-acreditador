

## Plan: Edit and Resubmit Rejected WhatsApp Templates to Meta

### Problem
When a template is rejected by Meta and the user edits it, the edge function always calls `POST /{waba_id}/message_templates` (create new). Meta rejects this with "Ya existe contenido en este idioma" because a template with that name already exists. To update an existing template, Meta's API requires `POST /{meta_template_id}` with just the `components` array.

### Changes

**1. `supabase/functions/submit-whatsapp-template/index.ts`**
- Check if the template already has a `meta_template_id` (meaning it was previously submitted to Meta)
- If yes: use `POST https://graph.facebook.com/v21.0/{meta_template_id}` with only `components` and `category` (Meta's edit endpoint -- name/language cannot be changed)
- If no: use the current create endpoint `POST /{waba_id}/message_templates` as before

**2. `src/components/settings/WhatsappTemplateDialog.tsx`**
- When editing a rejected template, disable the `name` and `language` fields (Meta doesn't allow changing these on existing templates)
- Show a hint explaining the template will be resubmitted for approval

**3. `src/components/settings/WhatsappTemplatesManager.tsx`**
- Show the "Consultar estado" (refresh) button for both `pending` and `rejected` statuses, so users can recheck after resubmission

### Technical Detail: Meta Edit API
```text
CREATE (new template):
  POST /v21.0/{waba_id}/message_templates
  Body: { name, language, category, components }

EDIT (existing template):  
  POST /v21.0/{meta_template_id}
  Body: { components, category }
  (name and language are immutable)
```

