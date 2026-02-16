
## Corregir flash de menús completos mientras cargan los permisos

### Problema

Al navegar entre páginas, el hook `usePermissions` se reinicializa y mientras carga los permisos desde la base de datos (~3 segundos), `canAccess()` retorna `true` por defecto para todas las claves. Esto causa que el sidebar muestre todos los elementos del menú brevemente antes de ocultarlos.

### Solución

Dos cambios simples en el Sidebar:

**Archivo: `src/components/layout/Sidebar.tsx`**

1. Obtener `isLoading` del hook `usePermissions` (ya existe, solo no se usa)
2. Mientras `isLoading` sea `true` y el rol NO sea superadmin, no renderizar los items de navegación (o mostrar un skeleton/placeholder)

Cambio concreto:
- Linea 49: cambiar `const { canAccess } = usePermissions();` a `const { canAccess, isLoading: permissionsLoading } = usePermissions();`
- En la seccion de navegacion (linea 114-118): envolver el listado en una condicion que muestre skeletons animados cuando `permissionsLoading` sea true, y los items filtrados cuando no

Los skeletons seran barras grises animadas del mismo tamano que los items del menu, para que la transicion sea fluida y no haya salto visual.

### Resultado

El usuario vera barras de carga suaves en el sidebar mientras se obtienen los permisos, y luego solo los menus permitidos. No habra ventana de tiempo para hacer click en menus no autorizados.
