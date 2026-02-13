
## Colocar FAQ al lado del Ranking en el Dashboard Acreditador

### Problema

El componente `RankingTable` tiene la clase `lg:col-span-2` que hace que ocupe todo el ancho del grid, empujando la card de FAQs debajo en lugar de al lado.

### Cambio

| Archivo | Cambio |
|---|---|
| `src/components/dashboard/RankingTable.tsx` | Eliminar la clase `lg:col-span-2` del Card principal del ranking |

### Detalle tecnico

En `src/components/dashboard/RankingTable.tsx` (linea 84), el Card raiz tiene la clase `lg:col-span-2`. Al eliminarla, el ranking ocupara solo una columna del grid de 2 columnas definido en `AcreditadorDashboard.tsx`, permitiendo que la card de Preguntas Frecuentes se muestre a su lado en pantallas grandes.

**Nota**: Este cambio tambien afecta otros dashboards que usan `RankingTable`. Si se desea mantener el comportamiento de ancho completo en otros dashboards, se puede pasar la clase como prop en lugar de eliminarla directamente. Sin embargo, revisando los dashboards existentes (Admin, Supervisor), el ranking siempre esta en un grid de 2 columnas, por lo que eliminar `col-span-2` es consistente.
