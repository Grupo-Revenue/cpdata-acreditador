## Agregar panel "Rendiciones Pendientes" al Dashboard de Administración

### Cambios en `src/pages/dashboard/AdminDashboard.tsx`

1. **Nueva query de conteo**: Agregar un `useQuery` que consulte la tabla `event_expenses` filtrando por `approval_status = 'pendiente'` y retorne el conteo exacto (igual al patrón existente de `pendingInvoices`).

2. **Nuevo card estadístico**: Extender el array `stats` con un quinto elemento:
   - Título: "Rendiciones Pendientes"
   - Ícono: `Wallet` (ya usado en la sección de Rendiciones)
   - Color: `text-info` / `bg-info/10` (o similar del sistema de diseño)
   - Trend: dinámico según haya o no pendientes
   - Link al hacer click: `/app/reimbursements?status=pendiente`

3. **Ajuste de grid**: Cambiar la clase del contenedor de estadísticas de `lg:grid-cols-4` a `lg:grid-cols-5` para que los 5 cards se distribuyan correctamente en una fila en pantallas grandes.

### Notas técnicas
- No se requieren cambios en backend ni RLS; el rol `administracion` ya tiene acceso full a `event_expenses`.
- El parámetro de query `?status=pendiente` puede usarse posteriormente para filtrar en la página de Rendiciones (si aún no lo hace), pero el panel siempre redirigirá allí.