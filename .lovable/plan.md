

## Agregar monto de pago obligatorio antes de aceptar postulantes

### Resumen

Al hacer click en el boton verde de aceptar un postulante, se abrira un pequeno dialog pidiendo el monto a pagar. Solo al confirmar con un monto valido se aceptara al postulante. Este monto se guardara en `event_accreditors` y se sincronizara con la boleta (`invoices`).

### Cambios

**1. Migracion de base de datos**
- Agregar columna `payment_amount` (integer, nullable, default null) a `event_accreditors`

**2. `src/components/events/EventApplicantsDialog.tsx`**
- Agregar campo `payment_amount` a la interfaz `Applicant` y a la query (incluir en el select de `event_accreditors`)
- Agregar dos estados nuevos: `acceptingApplicant` (Applicant | null) y `paymentAmount` (string)
- Modificar el boton de aceptar para que en lugar de llamar `handleAccept` directamente, guarde el postulante en `acceptingApplicant` y abra un mini-dialog
- El mini-dialog tendra:
  - Titulo: "Monto de pago"
  - Input numerico para ingresar el monto
  - Botones Cancelar y Confirmar
- Al confirmar:
  - Validar monto mayor a 0
  - Ejecutar la validacion de conflicto de fechas existente
  - Actualizar `event_accreditors` con `application_status: 'aceptado'` y `payment_amount`
  - Si existe una boleta en `invoices` para ese user+event, actualizarla con el monto
- Agregar columna "Monto" a la tabla entre Ranking y Acciones, mostrando el `payment_amount` formateado o un guion si no tiene

**3. `src/components/events/EventTeamDialog.tsx`**
- Al crear boletas para nuevos usuarios (linea 344), buscar el `payment_amount` del `event_accreditor` correspondiente y usarlo como monto en lugar de 0

### Detalle tecnico

Archivos modificados:
- 1 migracion SQL
- `src/components/events/EventApplicantsDialog.tsx` - dialog de confirmacion con input de monto
- `src/components/events/EventTeamDialog.tsx` - usar payment_amount al crear boletas

