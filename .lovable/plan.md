

## Comentarios de Asistencia + Vista de Comentarios en Ranking

### Resumen

Agregar un campo de comentarios en el dialogo de Gestion de Evento (supervisor) para cada acreditador al registrar asistencia, y un boton en la tabla de Ranking para que administradores/superadmin puedan ver el historial de comentarios de cada usuario.

### Cambios

| Elemento | Detalle |
|---|---|
| **Nueva tabla `attendance_comments`** | Almacena comentarios por registro de asistencia |
| **Migracion SQL** | Crear tabla, indices y politicas RLS |
| **EventManagementDialog.tsx** | Agregar campo Textarea de comentario por acreditador en la seccion de asistencia |
| **RankingTable.tsx** | Agregar boton para ver comentarios (solo admin/superadmin), con dialogo que muestra el historial |
| **Nuevo componente `AttendanceCommentsDialog.tsx`** | Dialogo que lista los comentarios de un usuario con fecha, evento y contenido |

---

### Detalle tecnico

#### 1. Nueva tabla `attendance_comments`

```text
attendance_comments
├── id (uuid, PK, default gen_random_uuid())
├── attendance_record_id (uuid, FK -> attendance_records.id, NOT NULL)
├── user_id (uuid, NOT NULL) -- el acreditador/supervisor comentado
├── comment (text, NOT NULL)
├── created_by (uuid, NOT NULL, default auth.uid()) -- el supervisor que escribe
├── created_at (timestamptz, default now())
```

Politicas RLS:
- Admins (is_admin) pueden ver todos los comentarios (SELECT)
- Supervisores pueden insertar comentarios en eventos donde estan asignados (INSERT)
- Supervisores pueden ver comentarios que ellos crearon (SELECT)

#### 2. EventManagementDialog.tsx

- Agregar campo `comment` al interface `AttendanceRow`
- Agregar una columna "Comentarios" en la tabla de asistencia con un Textarea pequeno
- Al guardar asistencia (saveAttendance), si hay comentario no vacio, insertar en `attendance_comments`
- Cargar comentarios existentes al abrir el dialogo
- Campo deshabilitado cuando el evento esta cerrado

#### 3. RankingTable.tsx

- Agregar una columna de accion visible solo para admin/superadmin
- Boton con icono MessageSquare que abre el dialogo de comentarios
- Pasar `activeRole` desde useAuth para controlar visibilidad

#### 4. Nuevo componente `AttendanceCommentsDialog.tsx`

- Recibe `userId`, `userName` como props
- Consulta `attendance_comments` filtrado por `user_id`, unido con datos del evento (nombre) y del supervisor que comento
- Lista cronologica con: fecha, nombre del evento, comentario, quien lo escribio
- Acceso de solo lectura

#### 5. Pagina Ranking.tsx

- Sin cambios significativos, el RankingTable se encarga de todo internamente

