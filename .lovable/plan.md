

## Plan: Agregar pestanas de Acreditadores, Supervisores y Administradores

### Resumen
Agregar 3 nuevas pestanas en la pagina de Gestion de Usuarios que filtren la lista de usuarios por rol: Acreditadores, Supervisores y Administradores. Cada pestana mostrara la misma tabla (`UsersTable`) pero filtrada por los usuarios que tengan el rol correspondiente.

### Cambios

**Archivo: `src/pages/app/Users.tsx`**

1. Agregar 3 nuevas pestanas al `TabsList` (despues de "Todos los Usuarios"):
   - **Acreditadores**: usuarios con rol `acreditador`
   - **Supervisores**: usuarios con rol `supervisor`
   - **Administradores**: usuarios con rol `administracion`

2. Cada pestana mostrara el contador de usuarios filtrados en el trigger (ej: "Acreditadores (12)")

3. Crear una funcion helper para filtrar `allUsers` por rol y reutilizar el componente `UsersTable` en cada `TabsContent`:

```text
const filterByRole = (role: string) => allUsers.filter(u => u.roles.includes(role));
```

4. Cada pestana tendra la misma estructura que "Todos los Usuarios" (Card con titulo, loading state, empty state y UsersTable), pero con titulo y descripcion adecuados al rol.

### Detalle tecnico

- No se necesitan queries adicionales a la base de datos: los datos ya se obtienen en `fetchAllUsers()` que trae todos los perfiles con sus roles
- El filtrado es puramente client-side sobre el array `allUsers`
- Las mismas acciones de editar, gestionar roles y eliminar estaran disponibles en todas las pestanas
- El `TabsList` usara scroll horizontal si es necesario para acomodar las 5 pestanas en pantallas pequenas

### Sin cambios en
- Base de datos
- Edge Functions
- Otros componentes

