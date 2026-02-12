

## Dashboard Supervisor - Metricas reales y ranking

### Objetivo

Reemplazar los datos estaticos del dashboard supervisor por metricas reales consultadas desde la base de datos, filtradas por los eventos asignados al supervisor autenticado.

### Metricas (4 tarjetas)

1. **Eventos Hoy**: Cantidad de eventos con `event_date = hoy` donde el supervisor esta asignado en `event_accreditors`
2. **Eventos Mes**: Cantidad de eventos del mes actual donde el supervisor esta asignado
3. **Total Participados**: Cantidad total de eventos en los que el supervisor ha participado (todos los registros en `event_accreditors` para su `user_id`)
4. **Boletas Pagadas**: Cantidad de boletas con `status = 'pagado'` donde `user_id` es el supervisor

### Tabla Ranking Top 5

Reutilizar la logica del componente `RankingTable` existente pero limitado a 5 resultados. Se creara un prop `limit` en `RankingTable` para controlar cuantos resultados mostrar (default 10 para superadmin, 5 para supervisor).

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/dashboard/SupervisorDashboard.tsx` | Reescribir con queries reales usando `useAuth` para obtener el `user.id`, consultar `event_accreditors` + `events` para eventos hoy/mes/total, consultar `invoices` para boletas pagadas. Incluir `RankingTable` con limite de 5. |
| `src/components/dashboard/RankingTable.tsx` | Agregar prop opcional `limit` (default 10) para controlar `.slice(0, limit)` |

### Detalle tecnico

**Queries del supervisor:**

```text
// Eventos asignados al supervisor
const { data: assignments } = await supabase
  .from('event_accreditors')
  .select('event_id, events(event_date)')
  .eq('user_id', userId);

// Filtrar en frontend: hoy, mes, total
const today = new Date().toISOString().split('T')[0];
const eventsToday = assignments.filter(a => a.events?.event_date === today);
const eventsMonth = assignments.filter(a => {
  const d = a.events?.event_date;
  return d && d >= monthStart && d <= monthEnd;
});
const totalEvents = assignments.length;

// Boletas pagadas
const { count } = await supabase
  .from('invoices')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('status', 'pagado');
```

**Layout:**
- 4 tarjetas de metricas arriba (grid 4 columnas)
- Tabla de ranking top 5 abajo (ancho completo)

