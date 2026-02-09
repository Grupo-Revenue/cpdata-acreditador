

## Plan: Sistema de Tickets de Soporte

### Resumen
Crear un sistema completo de tickets de soporte con tabla en base de datos, almacenamiento de archivos, y una interfaz con pestanas para tickets pendientes y resueltos. Los superadmin/admin pueden crear y editar tickets; supervisores/acreditadores solo pueden crear.

---

### 1. Migracion de base de datos

**Crear enum `ticket_status`:**
- `pendiente`
- `resuelto`
- `inactivo`

**Crear enum `ticket_priority`:**
- `alta`
- `media`
- `baja`

**Crear tabla `support_tickets`:**

| Columna | Tipo | Nullable | Default | Descripcion |
|---------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| ticket_number | serial (integer) | No | auto-increment | Correlativo visible (ID del ticket) |
| motivo | text | No | - | Motivo del ticket |
| status | ticket_status | No | 'pendiente' | Estado del ticket |
| priority | ticket_priority | No | 'media' | Prioridad |
| observaciones | text | Si | null | Observaciones (solo editable por admin) |
| evidence_url | text | Si | null | URL del archivo de evidencia en Storage |
| created_by | uuid | No | auth.uid() | Usuario que creo el ticket |
| created_at | timestamptz | No | now() | Fecha de creacion |
| updated_at | timestamptz | No | now() | Fecha de actualizacion |

**Trigger:** `update_updated_at_column` en `support_tickets`.

**RLS Policies:**
- Todos los usuarios autenticados pueden ver sus propios tickets (SELECT WHERE created_by = auth.uid())
- Admins pueden ver todos los tickets (SELECT con is_admin)
- Todos los usuarios autenticados pueden insertar tickets (INSERT con created_by = auth.uid())
- Solo admins pueden actualizar tickets (UPDATE con is_admin)

**Storage:** Crear bucket `ticket-evidence` (publico) para subir documentos/imagenes de evidencia.

---

### 2. Nuevos archivos

**`src/components/support/TicketCreateDialog.tsx`**
- Dialog con formulario: motivo (textarea), prioridad (select: alta/media/baja)
- Disponible para todos los roles
- Al crear, inserta en `support_tickets` con `created_by = auth.uid()`

**`src/components/support/TicketEditDialog.tsx`**
- Dialog con formulario de edicion
- Campos bloqueados (solo lectura): ID del ticket (ticket_number), fecha de creacion
- Campos editables: motivo, prioridad (select), estado (select: pendiente/resuelto/inactivo), observaciones (textarea)
- Subida de archivo de evidencia (imagen o documento) al bucket `ticket-evidence`
- Solo visible para superadmin y administracion

**`src/components/support/TicketsTable.tsx`**
- Tabla reutilizable con columnas: ID (ticket_number), Motivo, Estado (StatusBadge), Prioridad (badge con colores), Fecha de creacion (formato dd-mm-yyyy), Acciones
- Acciones: boton "Editar" visible solo para superadmin/admin
- Recibe array de tickets filtrados como prop

---

### 3. Actualizar `src/pages/app/Support.tsx`

- Agregar pestanas: "Pendientes" y "Resueltos"
- Consultar `support_tickets` ordenados por fecha de creacion descendente
- Filtrar client-side por status para cada pestana
- Boton "Crear Ticket" en el header (disponible para todos los roles)
- Usar `useAuth` para determinar si mostrar acciones de edicion
- Los admins ven todos los tickets; supervisores/acreditadores ven solo los suyos

---

### 4. Actualizar types

- Actualizar `src/integrations/supabase/types.ts` para incluir la nueva tabla y enums (se regenera automaticamente con la migracion)

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear: tabla, enums, RLS, trigger, bucket |
| `src/components/support/TicketCreateDialog.tsx` | Crear |
| `src/components/support/TicketEditDialog.tsx` | Crear |
| `src/components/support/TicketsTable.tsx` | Crear |
| `src/pages/app/Support.tsx` | Reescribir completamente |
| `src/integrations/supabase/types.ts` | Actualizar con nuevos tipos |

