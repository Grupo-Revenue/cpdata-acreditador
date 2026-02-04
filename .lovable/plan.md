
## Plan: Página de Configuración de Perfil de Usuario

### Objetivo
Permitir que cada usuario autenticado pueda ver y editar su propia información de perfil desde una nueva página accesible para todos los roles.

---

### Arquitectura de la Solución

```text
+------------------+     +-------------------+     +------------------+
|   Topbar Menu    |---->|  /app/profile     |---->|  Supabase        |
|   "Mi Perfil"    |     |  ProfilePage      |     |  profiles table  |
+------------------+     +-------------------+     +------------------+
                                  |
                                  v
                         +------------------+
                         |  Storage Bucket  |
                         |  avatars         |
                         +------------------+
```

---

### Cambios Necesarios

#### 1. Crear Storage Bucket para Avatares
Crear un bucket `avatars` en Supabase Storage con políticas RLS:
- Los usuarios pueden subir/actualizar su propio avatar
- Los avatares son públicos para lectura (necesario para mostrar en la UI)

#### 2. Nueva Página: Mi Perfil
**Archivo**: `src/pages/app/Profile.tsx`

Funcionalidad:
- Muestra la foto de perfil actual (o avatar por defecto)
- Permite subir/cambiar foto de perfil
- Formulario editable con:
  - RUT (solo lectura - referencia)
  - Email (solo lectura - no se puede cambiar)
  - Nombre (editable)
  - Apellido (editable)
  - Teléfono (editable)
  - Referencia de contacto (editable)
- Botón para guardar cambios
- Opción para cambiar contraseña (enlace a flujo de reset)

#### 3. Agregar Ruta en App.tsx
**Archivo**: `src/App.tsx`

Nueva ruta protegida accesible para todos los usuarios:
```tsx
<Route path="/app/profile" element={
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
} />
```

#### 4. Agregar Enlace en el Menú de Usuario (Topbar)
**Archivo**: `src/components/layout/Topbar.tsx`

Agregar opción "Mi Perfil" en el DropdownMenu del usuario:
```tsx
<DropdownMenuItem asChild>
  <Link to="/app/profile">Mi Perfil</Link>
</DropdownMenuItem>
```

#### 5. Actualizar AuthContext para Refrescar Perfil
**Archivo**: `src/contexts/AuthContext.tsx`

Agregar función `updateProfile` para actualizar el perfil del usuario actual sin requerir edge function (el usuario puede editar su propio perfil por RLS).

---

### Campos del Perfil

| Campo | Editable | Descripción |
|-------|----------|-------------|
| RUT | No | Identificador único, solo referencia |
| Email | No | Asociado a auth, no se puede cambiar |
| Nombre | Sí | Nombre del usuario |
| Apellido | Sí | Apellido del usuario |
| Teléfono | Sí | Número de contacto |
| Referencia | Sí | Referencia de contacto |
| Foto | Sí | Imagen de perfil (avatar) |

---

### Diseño de la Página

La página tendrá:
1. **Header con avatar grande**: Foto circular con botón de cambiar
2. **Información básica**: RUT y email (badges informativos)
3. **Formulario editable**: Nombre, apellido, teléfono, referencia
4. **Sección de seguridad**: Enlace para cambiar contraseña
5. **Botón guardar**: Al final del formulario

---

### Archivos a Crear/Modificar

| Archivo | Tipo |
|---------|------|
| Nueva migración SQL (Storage bucket) | Nuevo |
| `src/pages/app/Profile.tsx` | Nuevo |
| `src/App.tsx` | Modificar - agregar ruta |
| `src/components/layout/Topbar.tsx` | Modificar - agregar enlace |

---

### Políticas RLS para Storage

El bucket `avatars` tendrá las siguientes políticas:
- **SELECT (público)**: Cualquiera puede ver los avatares
- **INSERT**: El usuario puede subir su avatar (path: `{user_id}/avatar.*`)
- **UPDATE**: El usuario puede actualizar su avatar
- **DELETE**: El usuario puede eliminar su avatar

---

### Flujo de Usuario

1. El usuario hace clic en su avatar en el Topbar
2. Selecciona "Mi Perfil" del menú desplegable
3. Ve su información actual y puede editarla
4. Al cambiar la foto, se sube automáticamente al storage
5. Al hacer clic en "Guardar", se actualizan los datos en `profiles`
6. El contexto se refresca y la UI refleja los cambios
