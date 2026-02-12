

## Dashboard de Administracion igual al de Superadmin

### Problema

El dashboard de administracion (`AdminDashboard`) muestra contenido estatico basico (stats hardcodeados y una card vacia de "Proximos Eventos"), mientras que el de superadmin (`SuperadminDashboard`) tiene metricas reales desde HubSpot, conteo de usuarios pendientes, ranking de acreditadores y accesos rapidos.

### Solucion

Reemplazar el contenido de `AdminDashboard` para que reutilice el mismo componente `SuperadminDashboard`, simplemente cambiando el titulo del PageHeader.

| Archivo | Cambio |
|---------|--------|
| `src/pages/dashboard/AdminDashboard.tsx` | Reemplazar todo el contenido actual por una importacion y renderizado de `SuperadminDashboard`, pasando un prop opcional para cambiar el titulo a "Dashboard Administracion". Alternativamente, hacer que `AdminDashboard` importe y renderice directamente la misma logica. |
| `src/pages/dashboard/SuperadminDashboard.tsx` | Agregar un prop opcional `title` y `description` para permitir que el componente sea reutilizado con diferentes titulos. Por defecto mantiene "Dashboard Superadmin". |

### Detalle tecnico

**SuperadminDashboard.tsx** - Agregar props opcionales:

```text
interface SuperadminDashboardProps {
  title?: string;
  description?: string;
}

export default function SuperadminDashboard({
  title = 'Dashboard Superadmin',
  description = 'Vista general del sistema',
}: SuperadminDashboardProps) {
  // ... resto del componente sin cambios, usando title y description en PageHeader
}
```

**AdminDashboard.tsx** - Simplificar a:

```text
import SuperadminDashboard from './SuperadminDashboard';

export default function AdminDashboard() {
  return (
    <SuperadminDashboard
      title="Dashboard Administracion"
      description="Gestion de eventos y personal"
    />
  );
}
```

Esto elimina toda la duplicacion y asegura que ambos dashboards se mantengan sincronizados automaticamente ante futuros cambios.

