

## Plan: Corregir alineación de columnas en tabla de asignación de equipo

### Problema
La tabla tiene 8 encabezados pero 9 celdas por fila. Falta el encabezado "Ranking" entre "Idioma" y "Turno", lo que causa que las columnas Turno y Monto se vean corridas respecto a sus datos.

### Cambio

**Archivo: `src/components/events/EventTeamDialog.tsx`**

Agregar `<TableHead>Ranking</TableHead>` después de `<TableHead>Idioma</TableHead>` en ambas tablas (supervisores línea ~515 y acreditadores línea ~614).

Además, asignar anchos fijos a las columnas para mantener todo alineado:
- Checkbox: `w-10`
- Nombre: `w-[140px]`
- RUT: `w-[100px]`
- Teléfono: `w-[110px]`
- Estatura: `w-[80px]`
- Idioma: `w-[90px]`
- Ranking: `w-[70px]`
- Turno: `w-[160px]`
- Monto: `w-[100px]`

Aumentar `min-w` de las tablas a `min-w-[900px]` para acomodar todas las columnas sin apretarlas.

