

## Plan: Corregir query de boletas que falla con error 400

### Problema

Las boletas **si se estan creando** en la base de datos (hay 5 registros). El problema es que la pagina de Boletas no puede mostrarlos porque el query de Supabase falla con error 400:

```
column profiles_1.role does not exist
```

La causa es el JOIN `user_roles:user_id(role)` en el query. PostgREST no puede hacer este JOIN porque `invoices.user_id` tiene FK hacia `profiles`, no hacia `user_roles`. No hay relacion directa entre `invoices` y `user_roles`.

### Solucion

Modificar el query en `src/pages/app/Invoices.tsx` para obtener los roles en una consulta separada, o simplemente eliminar el JOIN con `user_roles` y obtener el rol de otra manera.

La solucion mas limpia es hacer dos consultas:
1. Obtener las boletas con JOINs a `profiles` y `events` (que si tienen FK directa)
2. Obtener los roles de los usuarios desde `user_roles` en una consulta separada y combinarlos en el frontend

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/app/Invoices.tsx` | Separar la consulta de roles de la consulta principal de invoices |
| `src/components/invoices/InvoicesTable.tsx` | Ajustar el tipo `InvoiceRow` para reflejar la nueva estructura de datos |

### Detalle tecnico

En `Invoices.tsx`, el queryFn se modificara asi:

```text
1. SELECT invoices.*, profiles(nombre, apellido, telefono), events(name, event_date)
2. Obtener user_ids unicos de los resultados
3. SELECT user_id, role FROM user_roles WHERE user_id IN (user_ids)
4. Combinar: agregar campo "role" a cada invoice basado en su user_id
```

En `InvoicesTable.tsx`, el tipo `InvoiceRow` cambiara `user_roles` de objeto anidado a un campo `role` string directo.

