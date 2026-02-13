

## Dashboard Administracion: Boletas pendientes y accesos rapidos de rendiciones

### Resumen

Crear un componente dedicado para el dashboard de administracion que reemplace "Usuarios Pendientes" por "Boletas Pendientes" (conteo real desde la tabla `invoices`) y cambie los accesos rapidos a tres botones relacionados con rendiciones.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/dashboard/AdminDashboard.tsx` | Reescribir completamente: dejar de reusar `SuperadminDashboard` y crear un dashboard propio con las metricas y accesos rapidos especificos |

### Detalle tecnico

**1. Metricas (stats cards):**
- Mantener las 3 tarjetas de eventos (Hoy, Mes, Semana) identicas al superadmin (misma query a `hubspot-deals`)
- Reemplazar "Usuarios Pendientes" por **"Boletas Pendientes"**: query a `invoices` con filtro `status = 'pendiente'`, usando `count: 'exact', head: true`
- Icono: `FileText` en vez de `UserPlus`, color warning

**2. Accesos rapidos:**
Reemplazar los 3 botones actuales (Cotizacion, Trello, Hubspot) por:
- **Rendiciones** (icono `Wallet`) - navega a `/app/reimbursements`
- **Detalle de Rendiciones** (icono `FileText`) - navega a `/app/reimbursements` (por ahora, funcionalidad pendiente)
- **Descargar Excel Rendiciones** (icono `Download`) - sin funcionalidad por ahora (boton deshabilitado o con toast informativo)

Los tres botones son internos (no externos), sin icono de `ExternalLink`.

**3. Ranking:**
Se mantiene el componente `RankingTable` igual que en el superadmin.

**4. Estructura general:**
Se replica la misma estructura visual del superadmin (grid de stats, grid de ranking + accesos rapidos) pero con el contenido especifico para administracion.

### Flujo

```text
Dashboard Administracion
  |-- Stats Grid (4 tarjetas)
  |     |-- Eventos Hoy (hubspot-deals)
  |     |-- Eventos del Mes (hubspot-deals)
  |     |-- Eventos Semanales (hubspot-deals)
  |     |-- Boletas Pendientes (query invoices where status='pendiente')
  |
  |-- Grid inferior
        |-- RankingTable (col-span-2)
        |-- Accesos Rapidos
              |-- Rendiciones
              |-- Detalle de Rendiciones
              |-- Descargar Excel Rendiciones
```

