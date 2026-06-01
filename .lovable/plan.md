## Plan: Agregar ícono de información al campo "Número de boleta"

### Contexto
En el diálogo de subida de boletas (`InvoiceUploadDialog`), los usuarios no saben qué es el "número de boleta" ni dónde encontrarlo. Se requiere un ícono de ayuda con tooltip explicativo.

### Cambios

**Archivo:** `src/components/invoices/InvoiceUploadDialog.tsx`

1. Importar `HelpCircle` de `lucide-react` y los componentes `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` de `@/components/ui/tooltip`.
2. Modificar el label "Número de boleta" para incluir un ícono `HelpCircle` al lado.
3. Agregar un `<Tooltip>` que explique: "El número de boleta es el folio que aparece en la parte superior del documento emitido por el SII. Ejemplo: B-001."
4. El ícono debe ser pequeño, con color `text-muted-foreground`, y mostrar el tooltip al pasar el mouse (hover).

### Notas técnicas
- No requiere cambios de backend ni estado.
- Se usa el componente `Tooltip` existente del proyecto (`src/components/ui/tooltip.tsx`).
- Texto en español, acorde al idioma UI del proyecto.