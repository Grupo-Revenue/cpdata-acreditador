## Filtros y pago masivo en Rendiciones

### 1. Migración DB (`event_expenses`)
- Agregar `'pagado'` al enum `expense_approval_status`.
- Agregar columnas: `payment_date date NULL`, `paid_by uuid NULL`.

### 2. Página `src/pages/app/Reimbursements.tsx`

**Filtros** (sobre la lista actual agrupada por evento, fila debajo del buscador):
- **Persona**: `Select` con todos los usuarios que tengan gastos (incluye "Evento" para gastos generales).
- **Fecha de pago**: rango `desde/hasta` (DatePicker).
- **Estado**: `Select` (Todos / Pendiente / Aprobado / Rechazado / Pagado).

La lógica de filtrado se aplica a `expenses` antes del agrupado; un evento se oculta si no le quedan gastos visibles.

**Selección múltiple de gastos (admin)**:
- Checkbox por fila de gasto y checkbox "Seleccionar todo" sobre los gastos visibles filtrados.
- Solo seleccionables gastos con `approval_status = 'aprobado'` y no `pagado`.
- Barra flotante/encabezado al haber selección: muestra `N gastos · Total $XXX · Usuarios involucrados` + botón **"Marcar como pagado"**.

**Diálogo "Registrar pago"** (`ConfirmDialog` extendido o nuevo Dialog):
- DatePicker obligatorio: fecha de pago.
- Input file opcional: comprobante único.
- Lista resumen de gastos seleccionados (evento, persona, monto) + total.
- Al confirmar:
  1. Si hay archivo, subir UNA vez a `expense-receipts/payments/{timestamp}_{file}` y obtener URL pública.
  2. `UPDATE event_expenses SET approval_status='pagado', payment_date=..., paid_by=auth.uid(), receipt_url=COALESCE(<nueva url>, receipt_url) WHERE id IN (...)`.
  3. Invalidate queries, toast resultado, limpiar selección.

**Badge "Pagado"**: extender `getStatusBadge` con variante success/primary.

**Columna**: agregar "Fecha pago" en la tabla cuando el estado lo amerite (mostrar `payment_date` formateada o "—").

**CSV export**: incluir columna `Fecha pago` y el nuevo estado.

### 3. Notas
- Permisos sin cambios: solo `isAdmin` ve checkboxes/botón de pago masivo.
- No se toca el flujo de supervisor.
- Fechas locales: usar `parseLocalDate` (sufijo `T00:00:00`) al renderizar `payment_date`.