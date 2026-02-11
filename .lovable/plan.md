

## Fix: Select de usuarios vacio en edicion de boleta + agregar busqueda

### Problema

La consulta de usuarios en `InvoiceEditDialog` usa un join `profiles:user_id(...)` en la tabla `user_roles`, que falla con error 400 porque PostgREST no puede resolver esa relacion. Resultado: el select aparece vacio.

### Solucion

1. Usar la estrategia de dos consultas (ya establecida en el proyecto): primero obtener los `user_id` con rol supervisor/acreditador, luego consultar sus perfiles por separado.
2. Reemplazar el `Select` de Radix por un **Combobox con busqueda** usando los componentes `Popover` + `Command` ya disponibles en el proyecto, permitiendo filtrar usuarios por nombre.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/invoices/InvoiceEditDialog.tsx` | Corregir la query de usuarios con dos consultas separadas (user_roles + profiles). Reemplazar el Select de usuario por un Combobox con campo de busqueda usando Popover + Command. |

### Detalle tecnico

**Query corregida:**
```text
// Paso 1: obtener user_ids con rol supervisor o acreditador
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('user_id')
  .in('role', ['supervisor', 'acreditador']);

// Paso 2: obtener perfiles de esos usuarios
const userIds = [...new Set(rolesData.map(r => r.user_id))];
const { data: profilesData } = await supabase
  .from('profiles')
  .select('id, nombre, apellido')
  .in('id', userIds);
```

**Combobox con busqueda:**
Se usara el patron Popover + Command (componentes ya existentes en el proyecto) para mostrar un input de busqueda dentro del dropdown de usuarios. El filtrado sera por nombre completo (`nombre + apellido`).

