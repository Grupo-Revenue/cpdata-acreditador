

## Plan: Agregar filtros de estatura, idioma y ranking en asignación de equipo

### Resumen
Agregar filtros adicionales (estatura, idioma, ranking mínimo) en ambas pestañas (supervisores y acreditadores) del diálogo de asignación de equipo, como inputs compactos junto al buscador existente.

### Cambios en `src/components/events/EventTeamDialog.tsx`

1. **Agregar estados de filtro** (6 nuevos estados: 3 por pestaña):
   - `supAlturaMin`, `supIdioma`, `supRankingMin` para supervisores
   - `accAlturaMin`, `accIdioma`, `accRankingMin` para acreditadores

2. **Incluir `idioma` y `altura` en la query de supervisores** (línea 141): agregar estos campos al select de profiles, igual que ya se hace para acreditadores.

3. **Actualizar `filteredSupervisors` y `filteredAccreditors`** para aplicar los filtros adicionales:
   - **Estatura**: filtrar usuarios cuya `altura` (parseada a número) sea >= al valor ingresado
   - **Idioma**: filtrar usuarios cuyo campo `idioma` contenga el texto buscado (case-insensitive)
   - **Ranking**: filtrar usuarios cuyo `ranking` sea >= al valor ingresado

4. **Agregar fila de filtros** debajo del buscador en ambas pestañas: una grilla compacta con 3 inputs (Estatura mín., Idioma, Ranking mín.) usando el patrón de filtros en grilla del proyecto.

5. **Mostrar columna Estatura** en las tablas de ambas pestañas (acreditadores ya tiene Idioma; supervisores necesita Idioma y Estatura).

6. **Reset de filtros** al cerrar el diálogo (en el useEffect existente de `!open`).

### Diseño visual
- Fila de filtros: `grid grid-cols-3 gap-2` debajo del buscador
- Inputs pequeños con placeholder descriptivo: "Estatura mín. (cm)", "Idioma", "Ranking mín."
- Consistente con el patrón de filtrado existente del proyecto

### Archivos a modificar
- `src/components/events/EventTeamDialog.tsx` (único archivo)

