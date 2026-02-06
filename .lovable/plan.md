

## Plan: Configuración del Sidebar y Gestión Dinámica de Roles

### Objetivo
1. Asegurar que el botón "Configuración" en el Sidebar solo sea visible para superadmin (ya implementado)
2. Implementar una interfaz en la página de Configuración para agregar y gestionar roles del sistema

---

### Estado Actual

El Sidebar ya tiene la restricción correcta en línea 36:
```typescript
{ icon: Settings, label: 'Configuración', href: '/app/settings', roles: ['superadmin'] }
```

Sin embargo, los roles están definidos como un `enum` de PostgreSQL (`app_role`), lo que limita la capacidad de agregar roles dinámicamente sin migraciones de base de datos.

---

### Arquitectura Propuesta

```text
+-------------------+     +------------------+     +------------------+
|  Settings Page    |---->|  Supabase        |---->|  app_role enum   |
|  RolesManager     |     |  ALTER TYPE      |     |  (modificado)    |
+-------------------+     +------------------+     +------------------+
        |                         |
        v                         v
+-------------------+     +------------------+
|  roles table      |     |  user_roles      |
|  (metadatos)      |     |  (asignaciones)  |
+-------------------+     +------------------+
```

---

### Enfoque de Implementacion

Para permitir agregar nuevos roles, se necesita:

1. **Nueva Edge Function** para modificar el enum de PostgreSQL (requiere privilegios elevados)
2. **Componente de UI** para gestionar roles en la pagina de Configuracion
3. **Actualizacion del frontend** para cargar roles dinamicamente desde la base de datos

---

### Cambios Necesarios

#### 1. Nueva Edge Function: `manage-roles`
**Archivo**: `supabase/functions/manage-roles/index.ts`

Operaciones disponibles:
- `add`: Agrega un nuevo rol al enum usando `ALTER TYPE app_role ADD VALUE`
- `list`: Lista todos los roles desde la tabla `roles`
- `update`: Actualiza descripcion de un rol existente

Restriccion: Solo superadmins pueden ejecutar esta funcion.

#### 2. Actualizar Pagina de Configuracion
**Archivo**: `src/pages/app/Settings.tsx`

Agregar seccion de gestion de roles:
- Lista de roles existentes con nombre y descripcion
- Boton para agregar nuevo rol
- Dialogo para crear rol con nombre (slug) y descripcion
- Edicion de descripcion de roles existentes

#### 3. Nuevo Componente: RolesManager
**Archivo**: `src/components/settings/RolesManager.tsx`

Funcionalidades:
- Mostrar tabla de roles existentes
- Formulario para agregar nuevo rol
- Editar descripcion de roles

#### 4. Actualizar Componentes que Usan Roles
**Archivos**:
- `src/components/users/UserRolesDialog.tsx`
- `src/components/users/UserCreateDialog.tsx`

Cambiar de lista estatica `ALL_ROLES` a carga dinamica desde la tabla `roles`.

---

### Diseño de la Interfaz de Roles

| Seccion | Contenido |
|---------|-----------|
| Encabezado | "Gestion de Roles" con icono y boton "Agregar Rol" |
| Tabla | Nombre, Descripcion, Fecha creacion, Acciones |
| Dialogo Crear | Campo nombre (solo letras minusculas y guiones), Campo descripcion |
| Restricciones | Los 4 roles base no se pueden eliminar, solo editar descripcion |

---

### Validaciones para Nuevos Roles

- **Nombre**: Solo letras minusculas y guiones (ej: `auditor`, `coordinador-zona`)
- **Unicidad**: No puede duplicar un nombre existente
- **Descripcion**: Opcional pero recomendada

---

### Flujo de Creacion de Rol

1. Superadmin hace clic en "Agregar Rol"
2. Completa nombre y descripcion
3. Se llama a la edge function `manage-roles`
4. Edge function ejecuta `ALTER TYPE public.app_role ADD VALUE '{nombre}'`
5. Edge function inserta registro en tabla `roles`
6. Se refresca la lista en el frontend

---

### Archivos a Crear/Modificar

| Archivo | Tipo |
|---------|------|
| `supabase/functions/manage-roles/index.ts` | Nuevo |
| `src/components/settings/RolesManager.tsx` | Nuevo |
| `src/components/settings/RoleCreateDialog.tsx` | Nuevo |
| `src/pages/app/Settings.tsx` | Modificar |
| `src/components/users/UserRolesDialog.tsx` | Modificar |
| `src/components/users/UserCreateDialog.tsx` | Modificar |

---

### Consideraciones Tecnicas

- **Enum de PostgreSQL**: Agregar valores es irreversible sin recrear el tipo. Los roles agregados no se pueden eliminar facilmente, solo desactivar.
- **Sincronizacion Frontend**: El tipo `AppRole` en TypeScript se volvera dinamico, cargando los valores desde la base de datos.
- **Cache**: Los roles se cargaran una vez al iniciar y se almacenaran en contexto o React Query.

---

### Limitaciones

- Los roles base (superadmin, administracion, supervisor, acreditador) no se pueden eliminar
- Los nombres de rol son permanentes una vez creados (limitacion de PostgreSQL enums)
- Para "eliminar" un rol, se podria agregar un campo `is_active` a la tabla roles

