

## Descarga de rendiciones en Excel para Admin y Superadmin

### Resumen

Agregar un boton "Descargar Excel" visible solo para administradores y superadmins en la pagina de Rendiciones. Al hacer clic, se generara un archivo `.csv` (compatible con Excel) con todos los gastos visibles, incluyendo la informacion del evento, asignado, monto, estado y comprobante.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/app/Reimbursements.tsx` | Agregar boton de descarga y funcion de exportacion a CSV |

### Detalle tecnico

**1. Funcion de exportacion**

Se creara una funcion `downloadExpensesAsCSV` dentro del componente que:
- Recorra todos los eventos filtrados y sus gastos
- Genere filas con las columnas: Evento, Asignado a, Adicional, Monto, Comprobante (URL), Estado
- Construya un string CSV con separador `;` (mejor compatibilidad con Excel en espanol)
- Use BOM UTF-8 para caracteres especiales
- Descargue el archivo como `rendiciones_YYYY-MM-DD.csv`

**2. Boton en la interfaz**

- Ubicado junto al campo de busqueda, alineado a la derecha
- Solo visible cuando `isAdmin` es `true`
- Icono `Download` de lucide-react con texto "Descargar Excel"
- Variante `outline`, tamano `sm`
- Deshabilitado si no hay datos para descargar

**3. Estructura del CSV exportado**

```text
Evento;Asignado a;Adicional;Monto;Comprobante;Estado
Evento ABC;Juan Perez;Transporte;15000;https://...;Aprobado
Evento ABC;Evento;Almuerzo;8000;;Pendiente
```

Se reutiliza la funcion `downloadFile` existente en `src/lib/csv-parser.ts` para la descarga del archivo.

