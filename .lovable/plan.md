

## Plan: Bloquear aceptación hasta que el usuario haya postulado

### Contexto
Actualmente el botón de aceptar (check) solo se deshabilita si el estado ya es `'aceptado'`. Pero también debe deshabilitarse si el usuario aún no ha postulado (estado `'asignado'`).

### Cambio

**Archivo: `src/components/events/EventApplicantsDialog.tsx`**
- Cambiar la condición `disabled` del botón de aceptar de:
  ```
  disabled={a.application_status === 'aceptado'}
  ```
  a:
  ```
  disabled={a.application_status !== 'pendiente'}
  ```
- Esto bloquea el botón para estados `asignado`, `aceptado` y `rechazado`, permitiendo aceptar solo cuando el usuario ha postulado activamente (`pendiente`).

### Archivos a modificar
- `src/components/events/EventApplicantsDialog.tsx` (1 línea)

