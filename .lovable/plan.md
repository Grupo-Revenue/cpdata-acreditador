

The WhatsApp template creation dialog already shows the hint "Usa {{1}}, {{2}}, etc. para variables dinámicas" below the body text field (line 251). However, it could be clearer about what these variables mean and how they map to actual data when sending messages.

Currently, the `send-whatsapp-message` edge function sends templates without passing component parameters, meaning variables are not being substituted at send time.

## What are WhatsApp dynamic variables?

Meta's WhatsApp Business API uses positional placeholders: `{{1}}`, `{{2}}`, `{{3}}`, etc. These are **not named** -- they are replaced in order when sending the message. For example:

- Body: `Hola {{1}}, tu factura #{{2}} está lista.`
- At send time, you pass: `["Juan Pérez", "00123"]`
- Result: `Hola Juan Pérez, tu factura #00123 está lista.`

## Proposed improvements

1. **Enhance the helper text** in `WhatsappTemplateDialog.tsx` to explain variables more clearly, including an example and auto-detection of how many variables the template uses.

2. **Add variable parameter inputs** in `InvoiceWhatsappDialog.tsx` so when sending a message, the user can fill in the values for each `{{n}}` variable detected in the selected template's body.

3. **Update the `send-whatsapp-message` edge function** to accept and forward `components` parameters to Meta's API, so variables actually get substituted.

### Files to change
- `src/components/settings/WhatsappTemplateDialog.tsx` -- add a detected-variables indicator below the body textarea showing how many variables were found
- `src/components/invoices/InvoiceWhatsappDialog.tsx` -- add input fields for each detected variable when a template is selected, pass them to the edge function
- `supabase/functions/send-whatsapp-message/index.ts` -- accept `parameters` array and include them in the Meta API payload as body component parameters

