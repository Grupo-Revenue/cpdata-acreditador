

## Sumar rendiciones aprobadas al valor de la boleta

### Problema actual

El valor que se muestra en la boleta de cada acreditador es solo el monto base (`payment_amount`). Las rendiciones aprobadas (`event_expenses` con `approval_status = 'aprobado'` y `user_id` del acreditador) no se reflejan en el valor total.

### Solucion

Modificar la consulta de boletas en `src/pages/app/Invoices.tsx` para obtener las rendiciones aprobadas por usuario/evento y sumarlas al monto mostrado en la tabla.

### Cambios

**`src/pages/app/Invoices.tsx`**
- En la query de `invoices`, despues de obtener los roles, consultar `event_expenses` filtrando por `user_id` (in userIds) y `approval_status = 'aprobado'`
- Construir un mapa `expensesMap[user_id][event_id] = totalAprobado`
- Al mapear cada invoice, calcular un campo `total_amount` = `inv.amount` + gastos aprobados del usuario para ese evento

**`src/components/invoices/InvoicesTable.tsx`**
- Agregar campo `total_amount` a la interfaz `InvoiceRow`
- En la columna "Valor", mostrar `total_amount` en lugar de `amount`
- Si `total_amount > amount` (tiene rendiciones), mostrar un tooltip o texto secundario indicando el desglose (ej: "$50.000 + $10.000 rendiciones")

### Detalle tecnico

```text
Flujo de datos:
invoices query
  -> fetch event_expenses WHERE user_id IN (...) AND approval_status = 'aprobado'
  -> agrupar por user_id + event_id
  -> sumar al amount de cada invoice
  -> mostrar total_amount en la tabla
```

Archivos modificados:
- `src/pages/app/Invoices.tsx` - agregar consulta de gastos aprobados y calcular total
- `src/components/invoices/InvoicesTable.tsx` - mostrar total con desglose visual

