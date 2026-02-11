

## Fix: Desfase de fecha de emision entre tabla y edicion

### Problema

La fecha `emission_date` se almacena como `"2026-02-11"` en la base de datos. En la tabla de boletas, `new Date("2026-02-11")` lo interpreta como medianoche UTC, que en Chile (UTC-3) se convierte en 10 de febrero. El dialogo de edicion muestra el string tal cual ("2026-02-11"), mostrando el 11.

### Solucion

Parsear la fecha como fecha local en lugar de UTC en `InvoicesTable.tsx`.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/invoices/InvoicesTable.tsx` | Reemplazar `new Date(inv.emission_date)` por un parser local que evite el desfase UTC |

### Detalle tecnico

Cambiar la linea que formatea la fecha de emision:

```text
// Antes
format(new Date(inv.emission_date), 'dd-MM-yyyy')

// Despues
format(new Date(inv.emission_date + 'T00:00:00'), 'dd-MM-yyyy')
```

Al agregar `T00:00:00` (sin `Z`), JavaScript interpreta la fecha como medianoche en la zona horaria local en lugar de UTC, eliminando el desfase de un dia.

### Importante
Parsear la fecha como fecha local en lugar de UTC ocurra en todos los campos fecha del sistema, ya que se ocupara la fecha locar  siempre.

