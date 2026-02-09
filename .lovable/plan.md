

## Plan: Corregir contadores de eventos en el Dashboard Superadmin

### Problema
Los contadores de eventos muestran cero porque consultan la tabla local `events` de Supabase, la cual esta vacia. Los eventos reales provienen de HubSpot a traves de la Edge Function `hubspot-deals`.

### Solucion
Cambiar el dashboard para que obtenga los eventos desde HubSpot (reutilizando la misma query `hubspot-deals` que usa la pagina de Eventos) y calcule los contadores filtrando por las fechas de los deals.

### Cambios en las metricas

| Antes | Despues |
|-------|---------|
| Eventos Hoy (tabla local) | Eventos Hoy (HubSpot, filtrado por `fecha_inicio_del_evento` = hoy) |
| Eventos del Mes (tabla local) | Eventos del Mes (HubSpot, filtrado por mes actual) |
| Eventos del Dia (duplicado de Hoy) | **Eventos Semanales** (HubSpot, filtrado por semana actual) |
| Usuarios Pendientes (tabla profiles) | Sin cambios |

### Archivo afectado: `src/pages/dashboard/SuperadminDashboard.tsx`

**Cambios:**

1. Reemplazar las 3 queries individuales de eventos (today, month, day) por una sola query que reutiliza `hubspot-deals`:
   - Llama a `supabase.functions.invoke('hubspot-deals')`
   - Del array de deals retornado, filtra por `fecha_inicio_del_evento` para calcular:
     - **Hoy**: deals cuya fecha de inicio es hoy
     - **Semana**: deals cuya fecha de inicio cae en la semana actual (lunes a domingo)
     - **Mes**: deals cuya fecha de inicio cae en el mes actual

2. Cambiar la tercera tarjeta de "Eventos del Dia" a "Eventos Semanales" con descripcion "En esta semana"

3. Mantener la query de "Usuarios Pendientes" sin cambios (ya funciona correctamente desde la tabla `profiles`)

### Detalle tecnico

```text
// Logica de filtrado client-side sobre los deals de HubSpot:
const today = new Date().toISOString().split('T')[0];
const startOfWeek = // lunes de la semana actual
const endOfWeek = // domingo de la semana actual
const startOfMonth = // primer dia del mes
const endOfMonth = // ultimo dia del mes

eventsToday = deals.filter(d => d.fecha_inicio_del_evento === today).length
eventsWeek = deals.filter(d => d.fecha_inicio_del_evento >= startOfWeek && ... <= endOfWeek).length
eventsMonth = deals.filter(d => d.fecha_inicio_del_evento >= startOfMonth && ... <= endOfMonth).length
```

No se requieren cambios en la Edge Function ni migraciones de base de datos.

