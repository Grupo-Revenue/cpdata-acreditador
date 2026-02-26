

## Plan: Agregar comentarios desde Gestion de Usuarios visibles en el Ranking

### Problema
Actualmente los comentarios solo se pueden crear desde la gestion de asistencia de eventos (tabla `attendance_comments`) y requieren un `attendance_record_id`. No hay forma de crear comentarios generales para un usuario desde la pagina de gestion de usuarios.

### Solucion

#### Paso 1: Crear tabla `user_comments`
Nueva tabla para comentarios generales no vinculados a eventos:
```sql
CREATE TABLE public.user_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_comments ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access user_comments"
ON public.user_comments FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Admins can view
CREATE POLICY "Admins can view user_comments"
ON public.user_comments FOR SELECT TO authenticated
USING (is_admin(auth.uid()));
```

#### Paso 2: Crear `UserCommentDialog`
Nuevo componente `src/components/users/UserCommentDialog.tsx` con un textarea para escribir el comentario y guardarlo en `user_comments`.

#### Paso 3: Agregar boton de comentario en `UsersTable`
Mostrar un icono de `MessageSquare` solo para usuarios que tengan rol `acreditador` o `supervisor`. Al hacer clic, abre el `UserCommentDialog`.

#### Paso 4: Actualizar `AttendanceCommentsDialog` para incluir comentarios generales
Modificar la query del dialogo de comentarios (usado en el ranking) para tambien consultar `user_comments` y mostrarlos junto a los comentarios de asistencia, diferenciandolos visualmente (ej. etiqueta "General" vs nombre del evento).

### Archivos a crear/modificar
1. **Migracion SQL** — tabla `user_comments` con RLS
2. **`src/components/users/UserCommentDialog.tsx`** — nuevo dialogo para crear comentario
3. **`src/components/users/UsersTable.tsx`** — agregar boton de comentario condicional
4. **`src/pages/app/Users.tsx`** — manejar estado del dialogo de comentarios
5. **`src/components/events/AttendanceCommentsDialog.tsx`** — integrar `user_comments` en la consulta

