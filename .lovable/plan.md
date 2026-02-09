

## Plan: Sistema de Ranking y Asignacion de Equipos a Eventos

Este plan cubre tres funcionalidades: (1) columna de ranking en profiles, (2) boton "Asignar Equipo" en eventos con permisos por rol, (3) dialogo de seleccion de supervisores y acreditadores con filtros.

---

### 1. Base de datos: Agregar columna de ranking

Agregar columna `ranking` a la tabla `profiles`:

```sql
ALTER TABLE profiles ADD COLUMN ranking integer DEFAULT NULL;
-- Constraint para validar rango 1-7
ALTER TABLE profiles ADD CONSTRAINT ranking_range CHECK (ranking IS NULL OR (ranking >= 1 AND ranking <= 7));
```

Tambien se necesita actualizar el tipo en `src/integrations/supabase/types.ts` para incluir `ranking`.

---

### 2. Permisos de botones en la tabla de eventos

| Boton | Roles permitidos |
|-------|-----------------|
| Editar evento (lapiz) | superadmin, administracion |
| Asignar equipo (nuevo) | superadmin |

Se usara `useAuth()` para verificar roles en `Events.tsx`. Ambos botones apareceran en la columna de acciones.

---

### 3. Dialogo "Asignar Equipo" al evento

Nuevo componente `EventTeamDialog.tsx` que:

- Recibe el `deal.id` (HubSpot deal ID) del evento
- Tiene dos secciones/pestanas: **Supervisores** y **Acreditadores**
- **Seccion Supervisores**: tabla con nombre, rut, email de usuarios con rol `supervisor`, con checkboxes para seleccion multiple
- **Seccion Acreditadores**: tabla con columnas: nombre, rut, email, idioma, estatura, ranking, telefono. Con checkboxes para seleccion multiple
- **Filtros para acreditadores**: busqueda por nombre, rut, email, idioma, ranking (todos los campos visibles)
- Al confirmar, inserta los registros en `event_accreditors` vinculando cada usuario seleccionado al evento

### Flujo de datos

La tabla `event_accreditors` ya existe con `event_id`, `user_id` y `status`. Sin embargo, los eventos actuales vienen de HubSpot (no de la tabla `events` local). Se necesitara:
- Crear el evento en la tabla local `events` si no existe al asignar equipo (usando el deal ID como referencia), o
- Agregar una columna `hubspot_deal_id` a la tabla `events` para vincular

Se agregara la columna `hubspot_deal_id` a `events` para mantener la relacion:

```sql
ALTER TABLE events ADD COLUMN hubspot_deal_id text UNIQUE;
```

---

### 4. Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| **Migracion SQL** | Agregar `ranking` a `profiles`, `hubspot_deal_id` a `events` |
| `src/integrations/supabase/types.ts` | Actualizar tipos con `ranking` y `hubspot_deal_id` |
| `src/components/events/EventTeamDialog.tsx` | **Nuevo** - Dialogo para asignar supervisores y acreditadores |
| `src/pages/app/Events.tsx` | Agregar boton "Asignar Equipo" con permisos, importar `useAuth` |
| `src/components/events/EventEditDialog.tsx` | Sin cambios (solo se restringe visibilidad desde Events.tsx) |

### 5. Detalle tecnico del EventTeamDialog

- Consulta usuarios aprobados con rol `supervisor` y `acreditador` via join de `profiles` + `user_roles`
- Consulta asignaciones existentes en `event_accreditors` para preseleccionar
- Al guardar: crea evento en tabla `events` si no existe (con `hubspot_deal_id`), luego upsert en `event_accreditors`
- Filtros locales en frontend (como en UsersTable): nombre, rut, email, idioma, ranking, telefono
- Usa checkboxes + tabla similar al patron de `UsersTable`

