
## Gestion de Evento, Asistencia, Adicionales y Rendiciones

Este es un feature complejo que abarca multiples modulos. Se implementara en fases logicas.

---

### Fase 1: Esquema de Base de Datos (Migracion SQL)

Se crearan 2 nuevas tablas y se modificara la tabla `events`:

**Tabla `attendance_records`** - Registros de asistencia por acreditador/evento:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | Identificador |
| event_id | uuid FK -> events | Evento |
| user_id | uuid FK -> profiles | Acreditador |
| status | enum (presente, atrasado, ausente) | Estado de asistencia |
| ranking_points | integer | Puntos (7, 5, 0) |
| attendance_date | date | Fecha de asistencia (default hoy) |
| check_in_time | time | Hora de ingreso |
| recorded_by | uuid FK -> profiles | Supervisor que registro |
| created_at / updated_at | timestamptz | Timestamps |

**Tabla `event_expenses`** - Adicionales/gastos por acreditador/evento:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | Identificador |
| event_id | uuid FK -> events | Evento |
| user_id | uuid FK -> profiles | Acreditador asociado |
| name | text | Nombre del adicional |
| amount | integer | Valor en CLP |
| receipt_url | text nullable | URL del comprobante (Storage) |
| approval_status | enum (pendiente, aprobado, rechazado) | Estado de aprobacion |
| approved_by | uuid nullable | Superadmin que aprobo |
| created_by | uuid | Supervisor que creo |
| created_at / updated_at | timestamptz | Timestamps |

**Modificaciones a `events`:**
- Agregar columna `closed_at` (timestamptz nullable) - fecha/hora de cierre
- Agregar columna `closed_by` (uuid nullable) - quien cerro
- Agregar columna `reimbursement_closed_at` (timestamptz nullable) - cierre de rendiciones
- Agregar columna `reimbursement_closed_by` (uuid nullable) - quien cerro rendiciones

**Nuevo enum `attendance_status`:** 'presente' | 'atrasado' | 'ausente'

**Nuevo enum `expense_approval_status`:** 'pendiente' | 'aprobado' | 'rechazado'

**Nuevo bucket de Storage:** `expense-receipts` (publico)

**Politicas RLS:**
- `attendance_records`: Admins full access; supervisores pueden insertar/actualizar en eventos donde estan asignados; usuarios pueden ver sus propios registros
- `event_expenses`: Admins full access; supervisores pueden gestionar en sus eventos asignados; usuarios pueden ver sus propios gastos

---

### Fase 2: Dialogo "Gestion de Evento" (Supervisor)

**Archivo:** `src/components/events/EventManagementDialog.tsx`

Dialogo que se abre desde el boton "Gestion del evento" en `EventsUserTable`. Recibe el `hubspot_deal_id` del deal y resuelve el `event_id` local.

**Contenido del dialogo:**
1. **Tabla de asistencia** - Lista todos los acreditadores asignados al evento (via `event_accreditors`) con:
   - Nombre del acreditador (desde profiles)
   - Select de asistencia: Presente (7pts), Atrasado (5pts), Ausente (0pts)
   - Input de fecha (preseleccionada con hoy)
   - Input de hora de ingreso
   - Boton guardar por fila o guardar todo

2. **Seccion de adicionales** - Por cada acreditador, un boton para agregar adicionales:
   - Nombre del adicional (text)
   - Valor en CLP (number)
   - Archivo comprobante (file upload a Storage bucket `expense-receipts`)
   - Lista de adicionales ya creados con opcion de eliminar

3. **Boton "Cerrar proyecto"** - Al final del dialogo:
   - Confirma con ConfirmDialog
   - Guarda `closed_at` y `closed_by` en el evento
   - Cambia `status` del evento a `completed`
   - Toda la interfaz pasa a modo solo lectura

**Modo solo lectura:** Cuando `closed_at` no es null, todos los inputs, selects y botones de agregar/eliminar se deshabilitan.

---

### Fase 3: Actualizar Ranking con Puntos de Asistencia

**Archivo:** `src/components/dashboard/RankingTable.tsx`

Modificar la query del ranking para sumar los `ranking_points` de `attendance_records` en vez de contar eventos completados. El ranking se ordenara por total de puntos acumulados.

**Archivo:** `src/pages/app/Ranking.tsx`

Reemplazar el EmptyState por el componente `RankingTable` reutilizado con un limite mayor.

---

### Fase 4: Pagina de Rendiciones (Supervisor)

**Archivo:** `src/pages/app/Reimbursements.tsx`

Para el rol **Supervisor**:
- Mostrar los eventos asignados al supervisor
- Por cada evento, mostrar los adicionales/gastos registrados
- Estado de aprobacion de cada gasto (pendiente, aprobado, rechazado)
- Boton "Cerrar rendiciones" por evento:
  - Guarda `reimbursement_closed_at` y `reimbursement_closed_by` en el evento
  - Toda la seccion pasa a solo lectura
  - No se pueden agregar, editar ni eliminar gastos

---

### Fase 5: Pagina de Rendiciones (Superadmin)

**Archivo:** `src/pages/app/Reimbursements.tsx` (misma pagina, vista diferente segun rol)

Para el rol **Superadmin**:
- Ver todos los eventos con adicionales agrupados por evento
- Por cada gasto: aprobar o rechazar
- Total acumulado de gastos aprobados por evento
- Boton "Rehabilitar evento" para reabrir un evento cerrado (limpia `closed_at`)
- Boton "Reabrir rendiciones" para reabrir rendiciones cerradas (limpia `reimbursement_closed_at`)

---

### Fase 6: Vincular el Boton en EventsUserTable

**Archivo:** `src/components/events/EventsUserTable.tsx`

Modificar `handleGestionEvento` para abrir el nuevo `EventManagementDialog` pasando el deal seleccionado.

---

### Resumen de archivos

| Archivo | Accion |
|---|---|
| Nueva migracion SQL | Crear tablas `attendance_records`, `event_expenses`, enums, columnas en `events`, bucket, RLS |
| `src/components/events/EventManagementDialog.tsx` | **Crear** - Dialogo principal de gestion |
| `src/components/events/EventsUserTable.tsx` | **Modificar** - Conectar boton al dialogo |
| `src/components/dashboard/RankingTable.tsx` | **Modificar** - Usar puntos de asistencia |
| `src/pages/app/Ranking.tsx` | **Modificar** - Mostrar tabla de ranking real |
| `src/pages/app/Reimbursements.tsx` | **Modificar** - Vista completa segun rol |
| `src/integrations/supabase/types.ts` | Se regenerara automaticamente |

### Detalle tecnico adicional

- Los puntos de ranking se calculan automaticamente al guardar la asistencia (presente=7, atrasado=5, ausente=0) y se almacenan en `attendance_records.ranking_points`
- El cierre de evento es irreversible excepto por superadmin
- Los archivos de comprobante se suben al bucket `expense-receipts` de Supabase Storage
- Las fechas se manejan con el sufijo `T00:00:00` segun la convencion del proyecto para evitar desfases UTC
- La vista de rendiciones detecta el `activeRole` del contexto para mostrar la interfaz de supervisor o superadmin
