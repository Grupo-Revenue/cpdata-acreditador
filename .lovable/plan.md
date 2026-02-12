

## Agregar columna "Fecha de Pago" en boletas y actualizar configuracion

### Resumen

Dos cambios principales:
1. **Configuracion**: Cambiar el selector de dia de pago para que los 3 dias sean editables (no elegir uno de tres, sino poder modificar los valores de los 3 dias de pago del mes).
2. **Boletas**: Agregar una columna "Fecha de pago" calculada automaticamente a partir de la fecha del evento y los dias de pago configurados. La logica: se busca el proximo dia de pago igual o posterior a la fecha del evento.

### Logica de calculo

Los dias de pago dividen el mes en ciclos. Dado un evento, la fecha de pago es el proximo dia de pago:

| Fecha evento | Dias de pago (5,15,25) | Fecha de pago |
|---|---|---|
| 01-02-2026 | 5,15,25 | 05-02-2026 |
| 15-05-2026 | 5,15,25 | 25-05-2026 |
| 26-01-2026 | 5,15,25 | 05-02-2026 |

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/settings/PaymentDaySettings.tsx` | Reemplazar RadioGroup por 3 campos Input numericos editables. Guardar en settings como `"5,15,25"` (comma-separated). Descripcion actualizada. |
| `src/pages/app/Invoices.tsx` | Agregar query para obtener los dias de pago desde `settings`. Pasar `paymentDays` como prop a `InvoicesTable`. |
| `src/components/invoices/InvoicesTable.tsx` | Agregar prop `paymentDays: number[]`. Agregar columna "Fecha de pago". Implementar funcion `calcPaymentDate(eventDate, paymentDays)` que encuentra el proximo dia de pago. |

### Detalle tecnico

**1. PaymentDaySettings.tsx** - Tres inputs editables:

- Estado: `days: [5, 15, 25]` (array de 3 numeros)
- Guardar en `settings` con key `payment_days` y value `"5,15,25"`
- Validacion: valores entre 1 y 28, ordenados de menor a mayor, sin duplicados
- Al guardar cualquier cambio, hacer upsert y mostrar toast

**2. Funcion de calculo `calcPaymentDate`:**

```text
function calcPaymentDate(eventDateStr: string, paymentDays: number[]): Date {
  const eventDate = new Date(eventDateStr + 'T00:00:00');
  const day = eventDate.getDate();
  const sorted = [...paymentDays].sort((a, b) => a - b);
  
  // Buscar el proximo dia de pago en el mismo mes
  for (const pd of sorted) {
    if (pd > day) {
      return new Date(eventDate.getFullYear(), eventDate.getMonth(), pd);
    }
  }
  // Si no hay, es el primer dia de pago del mes siguiente
  const next = new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, sorted[0]);
  return next;
}
```

**3. InvoicesTable.tsx** - Nueva columna:

- Agregar `paymentDays: number[]` al interface de props
- Agregar columna "Fecha de pago" despues de "Fecha emision"
- Calcular usando `calcPaymentDate(inv.events?.event_date, paymentDays)`
- Formatear como `dd-MM-yyyy`
- Ajustar colSpan del estado vacio

**4. Invoices.tsx** - Fetch de settings:

- Agregar query para obtener `payment_days` desde la tabla `settings`
- Parsear el valor comma-separated a `number[]`, default `[5, 15, 25]`
- Pasar como prop a `InvoicesTable`
