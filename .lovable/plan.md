

## Plan: Agregar filtros de Teléfono y Ranking en la pestaña de Supervisores

### Cambio en `src/components/events/EventTeamDialog.tsx`

#### 1. Nuevos estados de filtro

Agregar `supFilterTelefono` y `supFilterRanking` (strings, inicializados en '').

#### 2. Logica de filtrado

Agregar las condiciones al `useMemo` de `filteredSupervisors`:
- `supFilterTelefono`: filtrar por coincidencia parcial en `s.telefono`
- `supFilterRanking`: filtrar por coincidencia exacta con `s.ranking?.toString()`

#### 3. Reset de pagina

Agregar ambos estados al `useEffect` que resetea `supPage` a 1 cuando cambian los filtros, y al bloque de reset al cerrar el dialogo.

#### 4. UI - Inputs de filtro

Cambiar el grid de filtros de supervisores de 3 columnas a 2x3 (o grid adaptable) agregando dos inputs mas:
- Input "Teléfono" para `supFilterTelefono`
- Input "Ranking (1-7)" para `supFilterRanking`

#### Archivo afectado

| Archivo | Accion |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` | Agregar estados, logica de filtrado y inputs para Teléfono y Ranking en supervisores |

No se requieren cambios en base de datos.

