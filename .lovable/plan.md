

## Validacion obligatoria y check de boleta subida

### Problema actual

1. Los supervisores y acreditadores pueden guardar la boleta sin ingresar el numero de boleta, lo cual no deberia estar permitido.
2. Cuando un usuario no-admin sube su boleta, el icono de "Subir boleta" desaparece de la columna Acciones (porque la condicion `!inv.file_url` deja de cumplirse), quedando la celda vacia. Se necesita mostrar un indicador visual (check) cuando la boleta ya fue subida.

### Cambios propuestos

**1. `src/components/invoices/InvoiceEditDialog.tsx` - Validacion del numero de boleta**

- Para usuarios no-admin, deshabilitar el boton "Guardar" si `numeroBoleta` esta vacio (ademas de cuando la mutacion esta en progreso).
- Agregar un mensaje de ayuda debajo del campo "Numero de boleta" indicando que es obligatorio.

**2. `src/components/invoices/InvoicesTable.tsx` - Mostrar check cuando la boleta ya fue subida**

- Importar el icono `CheckCircle` de lucide-react.
- En la seccion de acciones para usuarios no-admin, cambiar la logica:
  - Si `inv.file_url` es null: mostrar el boton de Upload (comportamiento actual).
  - Si `inv.file_url` existe: mostrar un icono de check verde en lugar de dejar la celda vacia.

### Detalle tecnico

| Archivo | Cambio |
|---|---|
| `InvoiceEditDialog.tsx` | Agregar `disabled={!numeroBoleta.trim()}` al boton Guardar cuando `!isAdmin`. Agregar texto de campo obligatorio. |
| `InvoicesTable.tsx` | Importar `CheckCircle`. Reemplazar `!inv.file_url && (...)` por un condicional que muestre el boton Upload o un check verde segun corresponda. |
