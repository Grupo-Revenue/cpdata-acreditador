

## Plan: Permitir a superadmins editar el RUT de usuarios

### Cambios

**Archivo: `src/components/users/UserEditDialog.tsx`**

1. Importar `useAuth` desde `@/contexts/AuthContext`
2. Obtener `activeRole` del contexto de autenticacion
3. Agregar `rut` al estado `formData` (inicializado desde `user.rut`)
4. Cambiar el campo RUT de siempre-deshabilitado a condicionalmente editable: habilitado solo cuando `activeRole === 'superadmin'`
5. Incluir `rut` en el objeto de update a Supabase cuando el rol activo es superadmin

### Detalle tecnico

- El campo RUT actualmente usa `<Input disabled className="bg-muted" />` con el valor directo de `user?.rut`
- Se cambiara a usar `formData.rut` como valor, con `disabled={activeRole !== 'superadmin'}`
- En el `handleSubmit`, se agregara `rut: formData.rut` al objeto de update
- No se requieren cambios de base de datos; la columna `rut` ya existe en `profiles` y los admins ya tienen politica de UPDATE

