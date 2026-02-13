

## Agregar tabla de tickets recientes al Dashboard Superadmin

### Resumen

Agregar una nueva seccion en el dashboard de superadmin que muestre los tickets de soporte mas recientes, separados en dos pestanas: pendientes y resueltos.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/dashboard/RecentTicketsTable.tsx` | Crear nuevo componente reutilizable que consulta los ultimos tickets y los muestra con tabs Pendientes/Resueltos |
| `src/pages/dashboard/SuperadminDashboard.tsx` | Importar y agregar el componente debajo del grid actual (ranking + accesos rapidos) |

### Detalle tecnico

**Nuevo componente `RecentTicketsTable`:**
- Query con `useQuery` a `support_tickets` ordenado por `created_at desc`, limite de 10 registros
- Usa `Tabs` con dos pestanas: "Pendientes" (status = pendiente) y "Resueltos" (status = resuelto o inactivo)
- Tabla compacta con columnas: #ID, Motivo (truncado), Creado por, Prioridad (badge), Fecha
- Badges de prioridad con los mismos estilos del modulo de soporte (alta=destructive, media=warning, baja=muted)
- Estado de carga con Skeleton, estado vacio con icono y mensaje
- Card con `lg:col-span-3` para ocupar todo el ancho debajo del grid existente

**Modificacion en `SuperadminDashboard`:**
- Importar `RecentTicketsTable`
- Agregar debajo del grid de ranking/accesos rapidos:

```text
Layout resultante:
  Stats Grid (4 tarjetas)
  Grid 3 cols:
    |-- RankingTable (col-span-2)
    |-- Accesos Rapidos (col-span-1)
  RecentTicketsTable (ancho completo)
```

