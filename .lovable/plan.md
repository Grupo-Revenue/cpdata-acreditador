

## Plan: Gestor de Boletas completo

Este plan cubre la creacion de la tabla en base de datos, bucket de almacenamiento, componentes de UI y logica de permisos.

---

### 1. Base de datos

#### 1.1 Crear tabla `invoices`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| invoice_number | serial | Correlativo para generar B001, B002... |
| user_id | uuid (FK profiles) | Usuario asociado (supervisor/acreditador) |
| event_id | uuid (FK events) | Evento asociado |
| status | enum `invoice_status` | 'pendiente', 'pagado', 'rechazado' |
| amount | integer | Valor en pesos chilenos (sin decimales) |
| emission_date | date | Fecha de emision, default now() |
| file_url | text nullable | URL del archivo subido |
| created_by | uuid | Quien creo el registro |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() + trigger |

#### 1.2 Crear enum `invoice_status`

```
create type public.invoice_status as enum ('pendiente', 'pagado', 'rechazado');
```

#### 1.3 Politicas RLS

- **Admins (superadmin/administracion)**: SELECT, INSERT, UPDATE, DELETE completo
- **Usuarios normales**: SELECT solo sus propios registros (`user_id = auth.uid()`)
- **Usuarios normales**: UPDATE solo su propio `file_url` (para subir su boleta)

#### 1.4 Crear bucket `invoices`

Bucket publico para almacenar los archivos de boletas, con politicas RLS:
- Lectura publica
- Upload: admins pueden subir cualquier archivo; usuarios solo en su carpeta (`{user_id}/...`)

---

### 2. Componentes nuevos

#### 2.1 `src/components/invoices/InvoicesTable.tsx`

Tabla con las columnas solicitadas:

| Columna | Fuente |
|---------|--------|
| Nombre usuario | JOIN con profiles (nombre + apellido) |
| Rol | JOIN con user_roles |
| ID Boleta | B + invoice_number formateado (B001) |
| Estado | StatusBadge (pendiente/pagado/rechazado) |
| Nombre evento | JOIN con events |
| Fecha inicio evento | event_date formateada dd-mm-yyyy |
| Valor | Formato $ chileno (ej: $150.000) |
| Fecha emision | emission_date formateada dd-mm-yyyy |
| Acciones | Botones editar y enviar WhatsApp |

- El ID de boleta sera un link clickeable para ver/descargar el archivo si `file_url` existe
- Boton de editar visible solo para admins
- Boton de enviar plantilla WhatsApp visible solo para admins

#### 2.2 `src/components/invoices/InvoiceCreateDialog.tsx`

Dialogo para crear nueva boleta con campos:
- Seleccionar usuario (dropdown de perfiles aprobados con rol supervisor/acreditador)
- Seleccionar evento (dropdown de eventos existentes)
- Estado (default: pendiente)
- Valor ($)
- Fecha de emision (default: hoy)
- Subir archivo de boleta (opcional)

Accesible solo para superadmin y administracion.

#### 2.3 `src/components/invoices/InvoiceEditDialog.tsx`

Dialogo de edicion con todos los campos editables excepto:
- ID Boleta (mostrado pero bloqueado)
- Fecha de emision (mostrada pero bloqueada)

Para usuarios no-admin, solo se mostrara el campo de subir archivo.

#### 2.4 `src/components/invoices/InvoiceWhatsappDialog.tsx`

Dialogo para seleccionar una plantilla de WhatsApp y enviarla al numero del usuario asociado:
- Lista de plantillas aprobadas desde `whatsapp_templates`
- Vista previa del mensaje
- Boton de enviar (UI-only por ahora, igual que el sistema actual)

---

### 3. Pagina principal

#### `src/pages/app/Invoices.tsx` (reescribir)

- PageHeader con boton "Crear Boleta" (solo admins)
- Filtros: busqueda por nombre, filtro por estado
- Tabla con paginacion
- Dialogos de crear, editar y enviar WhatsApp
- Query con JOINs a profiles, user_roles y events
- Admins ven todas las boletas; usuarios ven solo las suyas (manejado por RLS)

---

### 4. Permisos y acceso

| Accion | Superadmin / Admin | Supervisor / Acreditador |
|--------|-------------------|--------------------------|
| Ver todas las boletas | Si | No (solo las suyas) |
| Crear boleta | Si | No |
| Editar campos | Si (todos excepto ID y fecha emision) | No |
| Subir archivo | Si | Si (solo su propia boleta) |
| Enviar WhatsApp | Si | No |

---

### Resumen de archivos

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear enum, tabla `invoices`, bucket, RLS |
| `src/integrations/supabase/types.ts` | Se regenerara automaticamente |
| `src/components/invoices/InvoicesTable.tsx` | Nuevo |
| `src/components/invoices/InvoiceCreateDialog.tsx` | Nuevo |
| `src/components/invoices/InvoiceEditDialog.tsx` | Nuevo |
| `src/components/invoices/InvoiceWhatsappDialog.tsx` | Nuevo |
| `src/pages/app/Invoices.tsx` | Reescribir completamente |
| `src/components/ui/StatusBadge.tsx` | Agregar estado 'pagado' si no existe (ya existe) |

