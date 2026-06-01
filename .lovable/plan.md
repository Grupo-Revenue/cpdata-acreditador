## Resumen
Hacer clickeables las tarjetas de estadísticas en los dashboards de Superadmin y Administración, redirigiendo a la sección correspondiente con un filtro pre-aplicado para mostrar solo los registros del rango deseado (hoy / semana / mes / pendientes).

## Cambios

### 1. `src/pages/app/Events.tsx`
- Leer query param `range` (`today` | `week` | `month`) con `useSearchParams`.
- Aplicar filtro sobre `userDeals` usando la misma lógica de `parseDate` que ya usan los dashboards (formato `DD-MM-YYYY` → ISO) contra `fecha_inicio_del_evento`.
- Mostrar un chip/badge arriba de la tabla indicando el rango activo (ej. "Eventos de hoy") con botón "Limpiar filtro" que remueve el param.

### 2. `src/pages/app/Users.tsx`
- Leer query param `tab` con `useSearchParams`.
- Pasar `value` controlado al `<Tabs>` (en lugar de `defaultValue`) cuando `tab=pending`, para abrir directamente la pestaña Pendientes.

### 3. `src/pages/app/Invoices.tsx`
- Leer query param `status=pendiente`.
- Si está presente, filtrar `displayInvoices` por `inv.status === 'pendiente'` y mostrar chip "Mostrando boletas pendientes" con opción de limpiar.

### 4. `src/pages/dashboard/SuperadminDashboard.tsx`
- Añadir `href` a cada item de `stats`:
  - Eventos Hoy → `/app/events?range=today`
  - Eventos del Mes → `/app/events?range=month`
  - Eventos Semanales → `/app/events?range=week`
  - Usuarios Pendientes → `/app/users?tab=pending`
- Envolver cada `<Card>` con `onClick={() => navigate(href)}` + clases `cursor-pointer hover-lift`.

### 5. `src/pages/dashboard/AdminDashboard.tsx`
- Mismo tratamiento:
  - Eventos Hoy / Mes / Semanales → `/app/events?range=...`
  - Boletas Pendientes → `/app/invoices?status=pendiente`
- Cards clickeables con navegación.

## Notas técnicas
- Reutilizar la función `parseDate` ya presente en los dashboards (copiar a Events.tsx) para mantener consistencia con `DD-MM-YYYY` de HubSpot.
- Rangos calculados con `date-fns` (`startOfWeek`/`endOfWeek` con `weekStartsOn: 1`) tal como en los dashboards.
- No se cambia lógica de negocio ni queries existentes; solo se añaden filtros en frontend.