## Arreglar diálogo "Registrar pago" en Rendiciones

El popup se ve mal porque el contenido excede el ancho del cuadro: el texto de cada gasto no se ajusta y los campos de "Fecha de pago" y "Comprobante" quedan apretados/sobresalen.

### Cambios en `src/pages/app/Reimbursements.tsx` (bloque del diálogo, líneas ~1012-1069)

1. **Resumen de gastos (líneas 1021-1035)**
   - Quitar `truncate` y `whitespace-nowrap` del texto principal.
   - Permitir wrap en varias líneas con `break-words` y `flex-wrap` para que el nombre del evento + usuario + gasto se ajuste completo dentro del cuadro.
   - Mantener el monto alineado a la derecha con `shrink-0`.

2. **Grid de campos (línea 1036)**
   - Cambiar a una sola columna en todos los tamaños (`grid-cols-1`) para evitar que los inputs se compriman dentro de un diálogo `max-w-lg`. Así "Fecha de pago" y "Comprobante" tendrán ancho completo y se verán cómodos.

3. **DialogContent**
   - Asegurar buen comportamiento en móvil añadiendo `max-h-[90vh] overflow-y-auto` para que nada se corte si el listado crece.

No se cambia lógica de pago, sólo la presentación del diálogo.
