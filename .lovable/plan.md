

## Plan: Registrar creador y editor en tickets de soporte

### Resumen
Agregar campos para registrar quien crea y quien edita cada ticket, incluyendo datos de contacto (nombre, email, telefono, RUT, rol). Mostrar esta informacion en la tabla y en el dialog de edicion.

---

### 1. Migracion de base de datos

Agregar columnas a `support_tickets` para almacenar los datos del editor:

| Columna | Tipo | Nullable | Default | Descripcion |
|---------|------|----------|---------|-------------|
| updated_by | uuid | Si | null | ID del usuario que edito el ticket |
| creator_nombre | text | No | '' | Nombre del creador |
| creator_apellido | text | No | '' | Apellido del creador |
| creator_email | text | No | '' | Email del creador |
| creator_telefono | text | Si | null | Telefono del creador |
| creator_rut | text | No | '' | RUT del creador |
| creator_role | text | No | '' | Rol del creador |
| editor_nombre | text | Si | null | Nombre del editor |
| editor_apellido | text | Si | null | Apellido del editor |
| editor_email | text | Si | null | Email del editor |
| editor_telefono | text | Si | null | Telefono del editor |
| editor_rut | text | Si | null | RUT del editor |
| editor_role | text | Si | null | Rol del editor |

**Nota sobre el diseno**: Se desnormalizan los datos del creador/editor directamente en la tabla del ticket para que quede un registro historico fijo. Si el perfil del usuario cambia despues, el ticket mantiene los datos tal como estaban al momento de la creacion/edicion.

Alternativamente, se podria hacer un JOIN con `profiles` y `user_roles`, pero el usuario pidio explicitamente que "quede registrado", lo cual implica un snapshot de los datos.

---

### 2. Cambios en `TicketCreateDialog.tsx`

- Obtener el perfil y roles del usuario actual desde `useAuth()`
- Al insertar el ticket, incluir los campos `creator_nombre`, `creator_apellido`, `creator_email`, `creator_telefono`, `creator_rut`, `creator_role` con los datos del usuario logueado
- El `creator_role` sera el rol principal del usuario (primer rol de la lista, o el mas alto en jerarquia)

---

### 3. Cambios en `TicketEditDialog.tsx`

- Obtener el perfil y roles del usuario actual desde `useAuth()`
- Mostrar seccion de solo lectura con los datos del creador: nombre, email, telefono, RUT, rol
- Al guardar, incluir `updated_by`, `editor_nombre`, `editor_apellido`, `editor_email`, `editor_telefono`, `editor_rut`, `editor_role` con los datos del admin que edita
- Si el ticket ya fue editado previamente, mostrar los datos del ultimo editor

---

### 4. Cambios en `TicketsTable.tsx`

- Agregar columna "Creado por" mostrando `creator_nombre creator_apellido`
- Agregar columna "Responsable" mostrando `editor_nombre editor_apellido` (o "-" si no ha sido editado)

---

### 5. Cambios en `Support.tsx`

- Actualizar la interfaz `SupportTicket` para incluir todos los campos nuevos
- La query `select('*')` ya traera los nuevos campos automaticamente

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Agregar columnas a `support_tickets` |
| `src/components/support/TicketCreateDialog.tsx` | Enviar datos del creador al insertar |
| `src/components/support/TicketEditDialog.tsx` | Mostrar datos creador, registrar datos editor |
| `src/components/support/TicketsTable.tsx` | Agregar columnas "Creado por" y "Responsable" |
| `src/pages/app/Support.tsx` | Actualizar interfaz SupportTicket |

