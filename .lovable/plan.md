

## Actualizar URLs de Accesos Rapidos en Dashboard Superadmin

### Resumen

Actualizar las tres URLs de los botones de accesos rapidos en el dashboard de superadmin para que redirijan a los enlaces correctos proporcionados por el usuario.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/dashboard/SuperadminDashboard.tsx` | Actualizar las 3 URLs y convertir Cotizacion a enlace externo |

### Detalle tecnico

Modificar las constantes y el arreglo `quickLinks` en el archivo:

1. **Trello**: Cambiar `TRELLO_URL` de `https://trello.com` a `https://id.atlassian.com/login?application=trello&continue=https%3A%2F%2Ftrello.com%2Fauth%2Fatlassian%2Fcallback%3Fdisplay%3DeyJ2ZXJpZmljYXRpb25TdHJhdGVneSI6InNvZnQifQ%253D%253D&display=eyJ2ZXJpZmljYXRpb25TdHJhdGVneSI6InNvZnQifQ%3D%3D`
2. **HubSpot**: Cambiar `HUBSPOT_URL` de `https://app.hubspot.com` a `https://app.hubspot.com/login/`
3. **Cotizacion**: Cambiar de enlace interno (`/app/quotes`, `isExternal: false`) a enlace externo (`https://cpdata.lovable.app`, `isExternal: true`)

