## Problema

En `InvoiceUploadDialog`, el botón `?` (HelpCircle) usa `Tooltip` de Radix, que solo se abre al hacer hover/focus, no al click. En mobile o táctil, al pinchar no se ve el mensaje.

## Cambio

En `src/components/invoices/InvoiceUploadDialog.tsx`:

- Reemplazar `Tooltip` por `Popover` (`@/components/ui/popover`) para el icono `?` junto a "Número de boleta".
- `PopoverTrigger asChild` con el mismo `<button>` (mantiene estilos y aria-label).
- `PopoverContent` con `className="max-w-xs text-sm"` y el mismo texto explicativo del SII.

Así el mensaje se abre tanto al click (mobile y desktop) como por teclado, sin depender del hover.

Sin cambios en lógica de subida ni en otros componentes.