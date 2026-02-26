

## Problema: Formato de fecha incompatible

### Causa raiz

Los datos de HubSpot devuelven `fecha_inicio_del_evento` en formato **DD-MM-YYYY** (ejemplo: `"12-03-2026"`, `"23-02-2026"`), pero los dashboards comparan estas fechas contra strings en formato **YYYY-MM-DD** (ejemplo: `"2026-02-01"`).

La comparacion de strings `"23-02-2026" >= "2026-02-01"` falla porque alfabeticamente `"2" < "2026"`, por lo que ningun evento coincide.

Evidencia directa del response de HubSpot:
- `"fecha_inicio_del_evento": "23-02-2026"` (DD-MM-YYYY)
- `"fecha_inicio_del_evento": "12-03-2026"` (DD-MM-YYYY)

### Solucion

Crear una funcion helper que convierta `"DD-MM-YYYY"` a `"YYYY-MM-DD"` antes de comparar. Aplicar en los 3 dashboards que filtran por fecha:

1. `src/pages/dashboard/SuperadminDashboard.tsx`
2. `src/pages/dashboard/AdminDashboard.tsx`
3. `src/pages/dashboard/AcreditadorDashboard.tsx`

La funcion:
```typescript
const parseDate = (d: string | null | undefined): string | null => {
  if (!d) return null;
  const parts = d.split('-');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
  }
  return d; // already YYYY-MM-DD
};
```

Luego reemplazar cada `d.fecha_inicio_del_evento` por `parseDate(d.fecha_inicio_del_evento)` en los filtros de today/week/month.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `SuperadminDashboard.tsx` | Agregar parseDate, usarla en filtros |
| `AdminDashboard.tsx` | Agregar parseDate, usarla en filtros |
| `AcreditadorDashboard.tsx` | Verificar si tiene el mismo patron y corregir |

