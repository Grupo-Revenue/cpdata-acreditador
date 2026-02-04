
## Plan: Agregar Botón "Crear Usuario" en Gestión de Usuarios

### Objetivo
Permitir a los superadministradores crear nuevos usuarios directamente desde la página de gestión de usuarios, sin que estos necesiten registrarse ellos mismos.

---

### Arquitectura de la Solución

Crear un usuario desde el panel de administración requiere:
1. **Edge Function**: Usar la Admin API de Supabase (requiere `service_role` key) para crear el usuario en `auth.users`
2. **Componente Dialog**: Formulario para capturar los datos del nuevo usuario
3. **Integración UI**: Botón en el PageHeader para abrir el diálogo

```text
+-------------------+     +------------------------+     +------------------+
|   UserCreateDialog |---->|  Edge Function         |---->|  Supabase Auth   |
|   (Frontend Form)  |     |  create-user           |     |  Admin API       |
+-------------------+     +------------------------+     +------------------+
                                      |
                                      v
                          +------------------+
                          |   profiles table |
                          |   (auto-trigger) |
                          +------------------+
```

---

### Cambios Necesarios

#### 1. Nueva Edge Function: `create-user`
**Archivo**: `supabase/functions/create-user/index.ts`

Funcionalidad:
- Recibe datos del usuario (email, password, rut, nombre, apellido, telefono, referencia_contacto)
- Opcionalmente recibe roles iniciales y estado de aprobación
- Usa `supabase.auth.admin.createUser()` para crear el usuario
- El trigger existente en la BD crea automáticamente el perfil
- Opcionalmente asigna roles si se especifican

Campos del formulario:
- RUT (requerido)
- Nombre (requerido)
- Apellido (requerido)
- Email (requerido)
- Teléfono (requerido)
- Referencia de contacto (opcional)
- Contraseña temporal (requerida)
- Estado inicial (approved/pending - por defecto approved)
- Roles iniciales (checkbox múltiple)

#### 2. Nuevo Componente: `UserCreateDialog`
**Archivo**: `src/components/users/UserCreateDialog.tsx`

Similar al formulario de registro pero:
- Incluye campo de contraseña temporal
- Permite seleccionar estado inicial (approved por defecto para usuarios creados por admin)
- Permite asignar roles iniciales
- Llama a la edge function en lugar de `signUp`

#### 3. Actualizar Página de Usuarios
**Archivo**: `src/pages/app/Users.tsx`

Cambios:
- Agregar estado para controlar el diálogo de creación
- Agregar botón "Crear Usuario" junto al botón "Actualizar" en el PageHeader
- Importar y renderizar `UserCreateDialog`

---

### Flujo de Creación

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Superadmin hace clic en "Crear Usuario" | Se abre el diálogo |
| 2 | Completa el formulario con datos del usuario | Validación client-side |
| 3 | Hace clic en "Crear" | Se llama a la edge function |
| 4 | Edge function crea usuario en auth.users | Trigger crea perfil automáticamente |
| 5 | Edge function actualiza approval_status si es necesario | Usuario queda approved |
| 6 | Edge function asigna roles seleccionados | Roles insertados en user_roles |
| 7 | Se cierra el diálogo y se refresca la tabla | Usuario visible en la lista |

---

### Archivos a Crear/Modificar

| Archivo | Tipo |
|---------|------|
| `supabase/functions/create-user/index.ts` | Nuevo - Edge function |
| `src/components/users/UserCreateDialog.tsx` | Nuevo - Componente diálogo |
| `src/pages/app/Users.tsx` | Modificar - Agregar botón y diálogo |

---

### Consideraciones de Seguridad

- La edge function debe validar que el usuario que hace la petición sea superadmin
- Se usa el service_role key solo en el backend (edge function)
- Validación de RUT única antes de crear
- Validación de email único (Supabase lo maneja automáticamente)
- Contraseña temporal que el usuario debería cambiar al primer login
