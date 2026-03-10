

## Plan: Fix CheckCircle icon alignment in Invoices table actions column

### Problem
The `CheckCircle` icon (lines 325, 327) is rendered as a bare SVG without a wrapping `Button` container, so it lacks the same padding/sizing as the adjacent icon buttons, causing visual misalignment.

### Fix

**`src/components/invoices/InvoicesTable.tsx`** — Wrap the `CheckCircle` icon in a disabled `Button variant="ghost" size="icon"` to match the dimensions and alignment of the other action buttons (Pencil, MessageSquare, Upload). Apply this to both the admin (line 325) and non-admin (line 327) instances.

Before:
```tsx
<CheckCircle className="h-4 w-4 text-success" />
```

After:
```tsx
<Button variant="ghost" size="icon" className="pointer-events-none" title="Boleta subida">
  <CheckCircle className="h-4 w-4 text-success" />
</Button>
```

This ensures the check icon occupies the same box as other action buttons and stays vertically centered in the row.

