

## Plan: Mejorar validación de conflicto de fecha considerando turnos

### Contexto
Ya existe una validación de conflicto de fecha (líneas 240-260 de `EventApplicantsDialog.tsx`), pero actualmente bloquea toda coincidencia de fecha sin considerar turnos. El campo `shift` existe en `event_accreditors` con valores: `'Día Completo'`, `'AM'`, `'PM'` o `null`.

### Lógica de conflicto
- Dos asignaciones el mismo día **conflictan** si:
  - Alguno de los dos tiene turno `'Día Completo'` o `null`
  - Ambos tienen el mismo turno (`AM`-`AM` o `PM`-`PM`)
- **No conflictan** si uno es `AM` y el otro `PM`

### Cambios en `src/components/events/EventApplicantsDialog.tsx`

1. **Query de datos**: Agregar `shift` al select de `event_accreditors` (línea 99) y al select del conflict check (línea 242)

2. **Agregar `shift` al tipo `Applicant`** y al mapeo de datos

3. **Mejorar la validación de conflicto** (líneas 240-260):
   - Obtener el `shift` del applicant actual y de cada conflicto
   - Solo bloquear si los turnos se solapan (ambos `Día Completo`/`null`, mismo turno, o uno `Día Completo` con cualquier otro)
   - Mensaje descriptivo: "Este postulante ya está confirmado en otro evento el mismo día [nombre del evento conflictante]."

### Archivos a modificar
- `src/components/events/EventApplicantsDialog.tsx`

