

## Plan: Gastos generales del evento en Gestión de Evento

### Problema
Actualmente la sección "Adicionales (Gastos)" solo muestra gastos por acreditador (itera sobre `attendanceRows`). Si no hay acreditadores aceptados con contrato firmado, no se puede agregar ningún gasto.

### Cambio en `src/components/events/EventManagementDialog.tsx`

1. **Agregar formulario de gasto general** debajo de los gastos por acreditador (o como única sección si no hay acreditadores). Este formulario permite agregar gastos con `user_id = null` (gasto a nivel de evento, no asociado a persona).

2. **Mostrar gastos generales existentes**: Filtrar `expenses` donde `user_id IS NULL` y renderizarlos en una sección "Gastos generales del evento" con nombre, monto, comprobante y botón eliminar.

3. **Formulario**: Input nombre, input monto, botón comprobante, botón agregar. Reutiliza la misma función `addExpense` pero pasando `null` como userId.

4. **Ajustar `addExpense`**: Modificar para que acepte `userId: string | null` y pase `user_id: userId` (o omitirlo si es null, dado que la columna es nullable).

### Diseño visual
```text
Adicionales (Gastos)
  ┌─────────────────────────────────────────┐
  │ Gastos generales del evento             │
  │  Transporte  $15.000  [Ver] [🗑]        │
  │  [Nombre___] [$____] [Comprobante] [+]  │
  └─────────────────────────────────────────┘
  
  (gastos por acreditador, si los hay)
  ┌─────────────────────────────────────────┐
  │ Juan Pérez                              │
  │  Almuerzo  $8.000  [Ver] [🗑]           │
  │  [Nombre___] [$____] [Comprobante] [+]  │
  └─────────────────────────────────────────┘
```

### Archivo a modificar
- `src/components/events/EventManagementDialog.tsx` (único archivo)

