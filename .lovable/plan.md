

## Problema: "Eventos del Mes" muestra cero

### Causa raiz

La Edge Function `hubspot-deals` tiene `limit: 100` en la busqueda de HubSpot y **no implementa paginacion**. Si hay mas de 100 deals en el pipeline/stage filtrado, los deals restantes nunca se obtienen. Ademas, si los eventos de este mes caen fuera de los primeros 100 resultados (ordenados por HubSpot internamente), el conteo en el dashboard sera 0.

### Solucion

Modificar `supabase/functions/hubspot-deals/index.ts` para implementar **paginacion con cursor `after`** del API de HubSpot Search, iterando hasta obtener todos los deals.

#### Cambios en `hubspot-deals/index.ts`:

1. Envolver la llamada a HubSpot Search en un loop que use el campo `paging.next.after` de la respuesta para solicitar la siguiente pagina
2. Acumular todos los results en un array antes de procesarlos
3. Mantener el `limit: 100` por pagina (maximo permitido por HubSpot)

```text
Loop:
  POST /crm/v3/objects/deals/search  (with after cursor if not first page)
  Append results to allResults[]
  If paging.next.after exists → continue
  Else → break
```

No se requieren cambios en los dashboards (`SuperadminDashboard.tsx`, `AdminDashboard.tsx`, `AcreditadorDashboard.tsx`) ya que la logica de filtrado por fecha es correcta; solo necesitan recibir todos los deals.

