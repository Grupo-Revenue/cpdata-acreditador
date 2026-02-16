

## Agregar turnos (AM/PM) a la asignacion de equipo

### Contexto

Actualmente al asignar un equipo a un evento, solo se seleccionan usuarios con un checkbox. No existe la posibilidad de indicar en que turno trabajara cada persona. Para eventos de un dia completo o de varios dias, es necesario poder asignar turnos como AM o PM.

### Cambios propuestos

**1. Migracion de base de datos**

Agregar una columna `shift` de tipo texto a la tabla `event_accreditors` con valor por defecto `null`. Los valores posibles seran: `null` (sin turno / dia completo), `'AM'` o `'PM'`.

```sql
ALTER TABLE event_accreditors ADD COLUMN shift text;
```

**2. EventTeamDialog.tsx - Interfaz de turnos**

- Reemplazar el sistema actual de `Set<string>` por un `Map<string, string | null>` donde la clave es el `user_id` y el valor es el turno (`null`, `'AM'` o `'PM'`).
- Al seleccionar un usuario con el checkbox, se asigna por defecto sin turno (dia completo).
- Agregar una columna "Turno" en cada tabla (supervisores y acreditadores) con un selector que aparece solo cuando el usuario esta seleccionado. Las opciones seran: "Dia Completo", "AM" y "PM".
- Al guardar, incluir el campo `shift` en cada fila insertada en `event_accreditors`.

**3. Carga de asignaciones existentes**

- Modificar la query de `event-assignments` para traer tambien el campo `shift` junto al `user_id`.
- Al pre-seleccionar usuarios existentes, cargar su turno correspondiente en el Map.

### Detalle tecnico

| Archivo | Cambio |
|---|---|
| Migracion SQL | Agregar columna `shift` (text, nullable) a `event_accreditors` |
| `src/components/events/EventTeamDialog.tsx` | Cambiar `selectedSupervisors` y `selectedAccreditors` de `Set<string>` a `Map<string, string or null>`. Agregar columna "Turno" con selector por usuario. Incluir `shift` al insertar filas en `handleSave`. Cargar turnos existentes en el `useEffect` de pre-seleccion. |

### Comportamiento esperado

- Al marcar un usuario, aparece un selector de turno en su fila con las opciones: "Dia Completo" (default), "AM", "PM".
- Al desmarcar un usuario, desaparece el selector.
- Los turnos se persisten en la base de datos y se recargan al abrir el dialogo.
- No se modifica ningun otro componente; el turno queda disponible para uso futuro en gestion de asistencia y otras vistas.

