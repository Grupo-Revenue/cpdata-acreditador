

## Plan: Show rejection reason when editing rejected templates

### Problem
When a template is rejected by Meta, the user has no visibility into *why* it was rejected. They need this information to fix the template before resubmitting.

### Changes

**1. Add `rejection_reason` column to `whatsapp_templates` table**
- New migration: `ALTER TABLE whatsapp_templates ADD COLUMN rejection_reason text;`

**2. Update `check-whatsapp-template-status` Edge Function**
- Add `rejected_reason` to the Meta API fields query: `?fields=status,name,category,rejected_reason`
- When status is `rejected`, store `metaData.rejected_reason` in the new `rejection_reason` column
- Clear `rejection_reason` when status changes to non-rejected

**3. Update `WhatsappTemplateDialog.tsx`**
- When editing a rejected template, show an alert banner at the top of the form displaying the rejection reason from the template data
- Use the existing `Alert` component with destructive variant

**4. Pass `rejection_reason` through to the dialog**
- The template data already flows from `WhatsappTemplatesManager` to the dialog via the `template` prop, so no additional wiring needed once the column exists

### Files to change
- New migration file for `rejection_reason` column
- `supabase/functions/check-whatsapp-template-status/index.ts` -- fetch and store `rejected_reason`
- `src/components/settings/WhatsappTemplateDialog.tsx` -- show rejection reason alert when `isRejected`

