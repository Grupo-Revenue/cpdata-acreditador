

## Plan: Fix blocked evidence URLs in support tickets

### Problem
The `ticket-evidence` bucket is likely **not public**, but the code uses `getPublicUrl()` which generates a URL that requires the bucket to be public. When the user clicks "Ver / Descargar", the browser blocks the request because the URL is inaccessible.

### Solution
Store the **storage path** instead of the public URL, and generate **signed URLs on demand** when displaying evidence.

### Changes

**1. `src/components/support/TicketCreateDialog.tsx`**
- After uploading, store the `filePath` (e.g. `{ticketId}/{timestamp}.pdf`) in `evidence_url` instead of the `publicUrl`.

**2. `src/components/support/TicketEditDialog.tsx`**
- Same fix: store the `filePath` in `response_evidence_url` instead of the `publicUrl`.
- When displaying creator evidence link, generate a signed URL on demand instead of using the stored value directly.

**3. `src/components/support/TicketDetailDialog.tsx`**
- For both `evidence_url` and `response_evidence_url`, generate signed URLs on click using `supabase.storage.from('ticket-evidence').createSignedUrl(path, 3600)`.
- Change the links from direct `<a href>` to buttons that call an async function to get the signed URL and then open it in a new tab.

**4. `src/components/support/TicketEditDialog.tsx` (view section)**
- Same signed URL generation for the read-only creator evidence link.

### Technical detail
```typescript
// Helper to open evidence
const openEvidence = async (path: string) => {
  const { data, error } = await supabase.storage
    .from('ticket-evidence')
    .createSignedUrl(path, 3600);
  if (error) { toast({ title: 'Error', ... }); return; }
  window.open(data.signedUrl, '_blank');
};
```

The stored `evidence_url` / `response_evidence_url` values will now contain just the path (e.g. `abc-123/1234567890.pdf`). Existing tickets with full URLs will need a fallback: if the value starts with `http`, use it directly; otherwise generate a signed URL.

### Files changed
- `src/components/support/TicketCreateDialog.tsx`
- `src/components/support/TicketEditDialog.tsx`
- `src/components/support/TicketDetailDialog.tsx`

