

## Agregar monto de pago antes de aceptar postulantes

### Problema actual

Al aceptar un postulante, no se solicita el monto que ganara. La boleta se crea con monto 0 cuando se asigna al equipo, y no hay forma de definir el valor desde el flujo de postulantes.

### Solucion

Agregar un campo `payment_amount` a la tabla `event_accreditors` y mostrar un dialog de confirmacion con input de monto antes de aceptar al postulante. Este monto se propagara automaticamente a la boleta correspondiente.

### Cambios

**1. Migracion de base de datos**
- Agregar columna `payment_amount` (integer, nullable, default null) a la tabla `event_accreditors`

**2. `src/components/events/EventApplicantsDialog.tsx`**
- Agregar estado para controlar un dialog de confirmacion de monto (`acceptingApplicant`, `paymentAmount`)
- Al hacer click en el boton de aceptar (check verde), en lugar de aceptar directamente, abrir un dialog que pida el monto
- El dialog tendra un input numerico para el monto y botones Cancelar/Confirmar
- Al confirmar:
  - Validar que el monto sea mayor a 0
  - Ejecutar la validacion de conflicto de fechas existente
  - Actualizar `event_accreditors` con `application_status: 'aceptado'` y `payment_amount: monto`
  - Actualizar la boleta correspondiente en `invoices` (si existe) con el monto ingresado
- Agregar columna "Monto" a la tabla de postulantes para mostrar el monto asignado (si ya fue aceptado)

**3. `src/components/events/EventTeamDialog.tsx`**
- Al crear boletas para nuevos usuarios asignados, verificar si el `event_accreditor` tiene un `payment_amount` definido y usarlo en lugar de 0

### Flujo resultante

1. Admin ve la lista de postulantes
2. Hace click en el boton de aceptar
3. Aparece un dialog pidiendo el monto a pagar
4. Ingresa el monto y confirma
5. Se actualiza el estado del postulante y se guarda el monto
6. Cuando se asigne al equipo, la boleta se creara con ese monto
7. Si la boleta ya existe, se actualiza inmediatamente con el monto

