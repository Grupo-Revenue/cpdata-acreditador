

## Modulo de Postulantes en Eventos

### Resumen

Agregar un boton "Postulantes" en la pagina de Eventos (solo para superadmin y administracion) que abre un dialogo con una tabla de todos los acreditadores y supervisores asignados a eventos, con estados de postulacion/contrato, filtros por columna, acciones de aceptar/rechazar, y validacion de conflicto por fecha.

### Cambios en Base de Datos

Se necesitan dos nuevas columnas en `event_accreditors` y dos nuevos enums:

| Cambio | Detalle |
|---|---|
| Nuevo enum `application_status` | `pendiente`, `aceptado`, `rechazado` |
| Nuevo enum `contract_status` | `pendiente`, `firmado`, `rechazado` |
| Nueva columna `application_status` en `event_accreditors` | Default `pendiente` |
| Nueva columna `contract_status` en `event_accreditors` | Default `pendiente` |

Las nuevas columnas se asignan automaticamente con valor `pendiente` al insertar (default de PostgreSQL), por lo que las asignaciones existentes y futuras desde `EventTeamDialog` ya tendran los valores correctos sin modificar ese componente.

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| **Migracion SQL** | Crear enums y agregar columnas a `event_accreditors` |
| `src/components/events/EventApplicantsDialog.tsx` | **Nuevo** - Dialogo con tabla de postulantes, filtros y acciones |
| `src/pages/app/Events.tsx` | Agregar boton "Postulantes" visible solo para admin/superadmin, estado para abrir el dialogo |
| `src/components/events/EventsAdminTable.tsx` | Sin cambios |

### Detalle tecnico

**1. Migracion SQL:**

```text
CREATE TYPE public.application_status AS ENUM ('pendiente', 'aceptado', 'rechazado');
CREATE TYPE public.contract_status AS ENUM ('pendiente', 'firmado', 'rechazado');

ALTER TABLE public.event_accreditors
  ADD COLUMN application_status application_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN contract_status contract_status NOT NULL DEFAULT 'pendiente';
```

**2. EventApplicantsDialog.tsx** - Componente nuevo:

- Query principal: obtener todos los registros de `event_accreditors` con join a `profiles` (nombre, apellido, ranking) y `events` (name, event_date)
- Query secundaria: obtener roles de cada usuario desde `user_roles` para determinar si es Supervisor o Acreditador
- Columnas de la tabla:
  - Nombre (nombre + apellido del perfil)
  - Evento (nombre del evento)
  - Rol (Supervisor / Acreditador)
  - Estado de Postulacion (pendiente / aceptado / rechazado)
  - Estado de Contrato (pendiente / firmado / rechazado)
  - Promedio de Ranking (campo `ranking` del perfil)
  - Acciones (botones Aceptar / Rechazar)
- Filtros externos (fila de inputs/selects encima de la tabla):
  - Nombre: Input texto
  - Evento: Select con opciones dinamicas
  - Rol: Select (Supervisor / Acreditador)
  - Estado Postulacion: Select (pendiente / aceptado / rechazado)
  - Estado Contrato: Select (pendiente / firmado / rechazado)
  - Ranking: Input texto (filtro por valor)
- Paginacion local de 10 registros por pagina

**3. Logica de Aceptar:**

Al hacer clic en "Aceptar" para un postulante:
1. Consultar si el usuario ya tiene otro `event_accreditors` con `application_status = 'aceptado'` en un evento con la misma `event_date`
2. Si existe conflicto: mostrar toast de advertencia "Este postulante ya esta asignado a otro evento en la misma fecha" y no permitir la accion
3. Si no hay conflicto: actualizar `application_status` a `aceptado` en `event_accreditors` y refrescar la tabla

**4. Logica de Rechazar:**

- Actualizar `application_status` a `rechazado` directamente, sin validacion de fecha
- Refrescar la tabla despues de la actualizacion

**5. Events.tsx** - Boton Postulantes:

- Agregar un boton "Postulantes" junto al `PageHeader`, visible solo cuando `isAdmin` es true
- Al hacer clic, abrir `EventApplicantsDialog`
- Usar icono `UserCheck` de lucide-react

### Flujo de datos

```text
Events.tsx
  |-- Boton "Postulantes" (solo admin)
  |-- EventApplicantsDialog
        |-- Query: event_accreditors + profiles + events
        |-- Query: user_roles (para determinar rol)
        |-- Filtros externos por columna
        |-- Tabla con acciones Aceptar/Rechazar
        |-- Validacion de conflicto por fecha al aceptar
```

### Notas importantes

- Los botones de Aceptar/Rechazar modifican `application_status`. El campo `contract_status` queda visible en la tabla pero no se modifica desde esta vista (se gestionara en una fase posterior o manualmente).
- La tabla actualiza dinamicamente via `queryClient.invalidateQueries` despues de cada accion, sin recargar la pagina.
- El campo `ranking` del perfil se muestra directamente como "Promedio de Ranking Total" ya que es el unico valor de ranking disponible en la tabla `profiles`.

