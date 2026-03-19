

## Plan: Mostrar rol asignado en tabla de postulantes

### Problema
`EventApplicantsDialog.tsx` obtiene el rol desde `user_roles` (roles del sistema) en lugar de usar `assigned_role` de `event_accreditors`. Si un usuario tiene rol "supervisor" en el sistema pero fue asignado como "acreditador" al evento, aparece como "Supervisor".

### Cambios en `src/components/events/EventApplicantsDialog.tsx`

1. **Query**: Agregar `assigned_role` al select de `event_accreditors` (línea 97)
2. **Mapeo**: Usar `r.assigned_role` directamente en lugar de inferir desde `user_roles` (líneas 152-175)
   - `r.assigned_role === 'supervisor'` → mostrar "Supervisor"
   - default → "Acreditador"
3. **Eliminar** la query de `user_roles` y el `roleMap`, ya que no se necesitan para determinar el tipo

### Resultado
Cada persona aparecerá con el rol que fue asignado al evento, no con su rol del sistema.

