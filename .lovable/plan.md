

## Fecha de pago editable para boletas

### Resumen

Actualmente la fecha de pago se calcula automaticamente a partir de la fecha del evento y los dias de pago configurados. Se agregara la posibilidad de que administradores y superadmins puedan sobreescribir esta fecha manualmente.

### Cambios

| Elemento | Detalle |
|---|---|
| **Migracion SQL** | Agregar columna `payment_date` (date, nullable) a la tabla `invoices` |
| **InvoicesTable.tsx** | Mostrar `payment_date` cuando existe, sino calcular automaticamente como hasta ahora |
| **InvoiceEditDialog.tsx** | Agregar campo DatePicker para fecha de pago (solo visible para admin) |
| **InvoiceCreateDialog.tsx** | Agregar campo DatePicker para fecha de pago (opcional) |
| **types.ts (supabase)** | Se actualizara automaticamente con la nueva columna |

---

### Detalle tecnico

#### 1. Migracion SQL

Agregar columna nullable `payment_date` de tipo `date` a la tabla `invoices`. Cuando es `NULL`, el sistema sigue calculando la fecha automaticamente. Cuando tiene valor, se usa ese valor directamente.

#### 2. InvoicesTable.tsx (linea 261-265)

Cambiar la logica de la columna "Fecha de pago" para priorizar `inv.payment_date` si existe:

```text
Si inv.payment_date existe -> mostrar inv.payment_date
Si no -> calcular con calcPaymentDate() como hasta ahora
```

#### 3. InvoiceEditDialog.tsx

- Agregar estado `paymentDate` (string)
- Inicializarlo con `invoice.payment_date` o vacio
- Mostrar un campo de tipo `date` (Input type="date") dentro del bloque `isAdmin`
- Incluir `payment_date` en el update de admin

#### 4. InvoiceCreateDialog.tsx

- Agregar estado `paymentDate` (string, opcional)
- Mostrar un campo de tipo `date` (Input type="date")
- Incluir `payment_date` en el insert si tiene valor, sino enviar null para calculo automatico

