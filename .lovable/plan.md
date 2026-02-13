

## Corregir el ancho del RankingTable en todos los dashboards

### Problema

Al eliminar `lg:col-span-2` del componente `RankingTable`, se arreglo el dashboard de acreditador pero se rompio el layout en los dashboards de superadmin y admin, donde el ranking necesita ocupar 2 de 3 columnas.

### Solucion

Agregar una prop `className` al componente `RankingTable` para que cada dashboard pueda controlar el ancho segun su grid.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/dashboard/RankingTable.tsx` | Agregar prop `className` y aplicarla al Card raiz |
| `src/pages/dashboard/SuperadminDashboard.tsx` | Pasar `className="lg:col-span-2"` al RankingTable |
| `src/pages/dashboard/AdminDashboard.tsx` | Pasar `className="lg:col-span-2"` al RankingTable |

### Detalle tecnico

1. En `RankingTable.tsx`, agregar `className?: string` a la interfaz `RankingTableProps` y aplicarla al `<Card>` con `cn()` para combinar con las clases existentes.

2. En los dashboards de superadmin y admin (grid de 3 columnas), pasar `className="lg:col-span-2"` para que el ranking ocupe 2 columnas.

3. En el dashboard de acreditador y supervisor (grid de 2 columnas), no se pasa className, asi que el ranking ocupa 1 columna naturalmente.

