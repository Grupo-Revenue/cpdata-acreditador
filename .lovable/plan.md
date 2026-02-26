

## Plan

### Cambio 1: Ocultar boton de subir boleta para admin/superadmin en `InvoicesTable.tsx`

En las lineas 324-338, cambiar la logica para que:
- **Admin**: solo muestra check verde si hay archivo, o nada si no hay. Sin boton de upload.
- **No-admin (supervisor/acreditador)**: muestra check verde si hay archivo, o boton de upload si no.

### Cambio 2: Agregar campo "Numero de boleta" al `InvoiceUploadDialog.tsx`

Antes de permitir subir el archivo, el dialog debe incluir un campo de texto para ingresar el numero de boleta (`numero_boleta`). Al hacer submit, se actualizan ambos campos (`file_url` y `numero_boleta`) en la tabla `invoices`.

- Agregar estado `numeroBoleta` al dialog
- Agregar `<Input>` para el numero de boleta antes del file input
- Validar que ambos campos esten completos antes de subir
- Actualizar el `.update()` para incluir `numero_boleta`

### Archivos a modificar
1. `src/components/invoices/InvoicesTable.tsx` — logica de acciones
2. `src/components/invoices/InvoiceUploadDialog.tsx` — agregar campo numero de boleta

