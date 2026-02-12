

## Vista de Eventos para Supervisor y Acreditador

### Contexto

Actualmente la pagina de Eventos muestra todos los deals de HubSpot con acciones de edicion y asignacion de equipo (solo para admin/superadmin). Para los roles supervisor y acreditador se necesita una vista diferente que muestre solo los eventos en los que estan asignados, con columnas reducidas, filtros por columna y botones de accion distintos.

### Enfoque

La pagina de Eventos detectara el rol del usuario y mostrara una vista diferente segun corresponda:
- **Superadmin / Administracion**: Vista actual sin cambios (tabla completa con edicion y asignacion de equipo)
- **Supervisor / Acreditador**: Vista nueva con solo sus eventos asignados, columnas reducidas, filtros y botones de accion

Para supervisor/acreditador, se obtienen los deals de HubSpot y se filtran cruzando con `event_accreditors` + `events` para mostrar solo los eventos asignados al usuario.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/app/Events.tsx` | Detectar rol y renderizar vista admin o vista supervisor/acreditador. La vista supervisor/acreditador filtra deals por asignacion del usuario. |
| `src/components/events/EventsUserTable.tsx` | **Nuevo componente** con la tabla para supervisor/acreditador: 6 columnas (Id, Nombre del Evento, Tipo, Locacion, Fecha Inicio, Horario), filtros de texto por columna, paginacion, y columna de acciones con botones "Firma digital" y "Gestion del evento" (solo supervisor). |

### Columnas de la tabla supervisor/acreditador

| Columna | Campo HubSpot | Filtro |
|---------|--------------|--------|
| Id | dealname | Texto |
| Nombre del Evento | nombre_del_evento | Texto |
| Tipo | tipo_de_evento | Texto |
| Locacion | locacion_del_evento | Texto |
| Fecha Inicio | fecha_inicio_del_evento | Texto |
| Horario | hora_de_inicio_y_fin_del_evento | Texto |
| Acciones | - | - |

### Acciones por rol

- **Firma digital**: Visible para supervisor y acreditador (funcionalidad pendiente, por ahora solo el boton)
- **Gestion del evento**: Visible solo para supervisor (funcionalidad pendiente, por ahora solo el boton)

### Detalle tecnico

**Filtrado de eventos asignados:**

```text
// 1. Obtener event_ids asignados al usuario
const { data: assignments } = await supabase
  .from('event_accreditors')
  .select('event_id, events(hubspot_deal_id)')
  .eq('user_id', user.id);

// 2. Extraer hubspot_deal_ids
const assignedDealIds = assignments
  .map(a => a.events?.hubspot_deal_id)
  .filter(Boolean);

// 3. Filtrar deals de HubSpot
const userDeals = allDeals.filter(d => assignedDealIds.includes(d.id));
```

**Filtros por columna:**
- Inputs de texto encima de cada columna en el header de la tabla
- Filtrado local en frontend (los datos ya estan cargados)
- Se resetea la paginacion al cambiar un filtro

**Botones de accion:**
- Icono de firma (PenTool) para "Firma digital"
- Icono de gestion (ClipboardList) para "Gestion del evento" (solo supervisor)
- Ambos sin funcionalidad por ahora (onClick placeholder con toast informativo)

