

## Separar el botón "Subir boleta" del dialog de edición

### Problema

El botón de subir boleta (icono Upload) en la tabla de boletas llama a `onUpload={setEditInvoice}`, lo que abre el mismo `InvoiceEditDialog` que muestra todos los campos de edición (usuario, evento, estado, valor, etc.). Se necesita que solo permita subir un archivo.

### Solución

Crear un nuevo componente `InvoiceUploadDialog` dedicado exclusivamente a subir el archivo de boleta, y conectarlo al botón Upload en la tabla.

### Cambios

**1. Nuevo archivo: `src/components/invoices/InvoiceUploadDialog.tsx`**
- Dialog simple con:
  - Título: "Subir Boleta" con el ID de boleta (ej: B001)
  - Input de archivo (acepta .pdf, .jpg, .jpeg, .png)
  - Botones Cancelar y Subir
- Al confirmar: sube el archivo a Supabase Storage (`invoices` bucket), actualiza `file_url` en la tabla `invoices`, e invalida la query
- No muestra campos de edición (ni usuario, ni evento, ni estado, ni monto)

**2. `src/pages/app/Invoices.tsx`**
- Agregar estado `uploadInvoice` separado de `editInvoice`
- Cambiar `onUpload` para que use `setUploadInvoice` en lugar de `setEditInvoice`
- Renderizar el nuevo `InvoiceUploadDialog` con el estado correspondiente

### Resultado

- Botón de lápiz (Editar) abre el dialog completo de edición
- Botón de Upload abre un dialog limpio que solo permite subir archivo
