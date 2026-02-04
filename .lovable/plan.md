
## Plan: Gestión Completa de Usuarios para Superadmin

### Objetivo
Expandir la página de gestión de usuarios para que los superadmin puedan:
1. Ver todos los usuarios (no solo pendientes)
2. Editar información de usuarios
3. Asignar/modificar roles

---

### Arquitectura de la Solución

La página tendrá dos pestañas:
- **Pendientes**: Lista actual de usuarios por aprobar
- **Todos los Usuarios**: Tabla completa con opciones de edición y gestión de roles

---

### Cambios Necesarios

#### 1. Modificar `src/pages/app/Users.tsx`

**Nuevas funcionalidades:**
- Agregar sistema de pestañas (Tabs) para separar vistas
- Crear estado para usuarios completos (`allUsers`)
- Agregar modal de edición de usuario
- Agregar modal de asignación de roles
- Verificar si el usuario actual es superadmin para mostrar la pestaña adicional

**Estructura de la nueva interfaz:**

```text
+------------------------------------------+
|  Gestión de Usuarios                     |
+------------------------------------------+
|  [Pendientes]  [Todos los Usuarios]      |  <- Tabs (solo superadmin ve ambas)
+------------------------------------------+
|                                          |
|  Tabla/Lista de usuarios                 |
|  - Nombre, Email, RUT, Estado, Roles     |
|  - Botón Editar                          |
|  - Botón Gestionar Roles                 |
|                                          |
+------------------------------------------+
```

#### 2. Nuevos Componentes a Crear

**`src/components/users/UserEditDialog.tsx`**
- Modal para editar datos del perfil
- Campos: nombre, apellido, teléfono, referencia_contacto
- Opción para activar/desactivar usuario
- Cambiar estado de aprobación

**`src/components/users/UserRolesDialog.tsx`**
- Modal para gestionar roles del usuario
- Checkboxes para cada rol disponible (superadmin, administracion, supervisor, acreditador)
- Muestra roles actuales y permite agregar/quitar

**`src/components/users/UsersTable.tsx`**
- Tabla reutilizable para mostrar usuarios
- Columnas: Nombre, Email, RUT, Estado, Roles, Acciones
- Botones de acción para editar y gestionar roles

---

### Flujo de Datos

```text
Cargar página
      │
      ▼
¿Es superadmin? ─────────────────┐
      │                          │
     Sí                         No
      │                          │
      ▼                          ▼
Mostrar ambas pestañas    Solo pendientes
      │
      ▼
Tab "Todos los Usuarios"
      │
      ▼
Fetch profiles + user_roles (JOIN)
      │
      ▼
Renderizar tabla con acciones
      │
      ├──> Editar → UserEditDialog
      │              │
      │              ▼
      │         supabase.profiles.update()
      │
      └──> Roles → UserRolesDialog
                    │
                    ▼
              supabase.user_roles.insert/delete()
```

---

### Detalles Técnicos

#### Interfaces TypeScript

```typescript
interface UserWithRoles {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  referencia_contacto: string | null;
  approval_status: 'pending' | 'preapproved' | 'approved';
  is_active: boolean;
  created_at: string;
  roles: AppRole[];
}
```

#### Consulta para obtener usuarios con roles

```typescript
// Paso 1: Obtener todos los perfiles
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false });

// Paso 2: Obtener todos los roles
const { data: userRoles } = await supabase
  .from('user_roles')
  .select('user_id, role');

// Paso 3: Combinar en el frontend
const usersWithRoles = profiles.map(profile => ({
  ...profile,
  roles: userRoles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
}));
```

#### Gestión de Roles

```typescript
// Agregar rol
await supabase.from('user_roles').insert({ user_id, role });

// Quitar rol
await supabase.from('user_roles').delete().eq('user_id', user_id).eq('role', role);
```

---

### Seguridad

- Solo usuarios con rol `superadmin` verán la pestaña "Todos los Usuarios"
- Las políticas RLS existentes ya permiten a admins leer/modificar perfiles
- La tabla `user_roles` tiene política que permite a admins gestionar roles

**Verificación en el frontend:**
```typescript
const { hasRole } = useAuth();
const isSuperadmin = hasRole('superadmin');
```

---

### Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/app/Users.tsx` | Modificar - Agregar tabs, estados, lógica |
| `src/components/users/UserEditDialog.tsx` | Crear - Modal de edición |
| `src/components/users/UserRolesDialog.tsx` | Crear - Modal de roles |
| `src/components/users/UsersTable.tsx` | Crear - Tabla de usuarios |
| `src/components/users/UserRow.tsx` | Crear - Fila individual (opcional) |

---

### Resultado Final

El superadmin podrá:
1. Ver usuarios pendientes y aprobarlos/rechazarlos (funcionalidad existente)
2. Ver TODOS los usuarios del sistema en una tabla
3. Editar información de cualquier usuario
4. Asignar o remover roles a cualquier usuario
5. Activar/desactivar usuarios
