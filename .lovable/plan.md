

## Visibilidad de rendiciones para el rol Administracion

El rol `administracion` ya obtiene todos los eventos gracias a la variable `isAdmin`, pero actualmente los eventos sin gastos se ocultan para este rol. Ademas, es necesario verificar que no se muestren botones de accion (aprobar, rechazar, cerrar, reabrir, agregar, eliminar).

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/app/Reimbursements.tsx` | Ajustar la condicion de filtrado para que `administracion` vea todos los eventos (incluso sin gastos), y asegurar que no tenga acceso a ninguna accion |

### Detalle tecnico

**1. Filtrado de eventos sin gastos (linea ~259 aprox):**
- Cambiar `if (!isSuperadmin && !isSupervisor && eventExpenses.length === 0) return null;` para incluir `isAdmin` en la condicion, de modo que administracion tambien vea eventos sin gastos registrados

**2. Verificacion de acciones:**
- Los botones de aprobar/rechazar ya estan protegidos con `isSuperadmin`
- Los botones de agregar/eliminar ya estan protegidos con `isSupervisor`
- Los botones de cerrar rendiciones estan protegidos con `isSupervisor`
- Los botones de rehabilitar/reabrir estan protegidos con `isSuperadmin`
- No se requieren cambios adicionales en las acciones, solo en el filtrado de visibilidad

