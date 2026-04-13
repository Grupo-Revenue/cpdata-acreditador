

## Plan: Botón "Adicionales" en tabla de eventos para superadmin y administración

### Problema
Los roles superadmin y administración necesitan un botón directo en la tabla de eventos (EventsAdminTable) para agregar gastos generales del evento, sin entrar al diálogo completo de Gestión de Evento.

### Cambios

#### 1. Crear `src/components/events/EventGeneralExpensesDialog.tsx`
- Diálogo que recibe `hubspotDealId` y `dealName`.
- Resuelve el `event_id` interno desde `hubspot_deal_id` (upsert si no existe).
- Lista gastos generales existentes (`event_expenses` donde `user_id IS NULL`).
- Formulario: nombre, monto, comprobante (file upload opcional al bucket `expense-receipts`).
- Botón eliminar para gastos creados por el usuario actual.

#### 2. Modificar `src/components/events/EventsAdminTable.tsx`
- Importar el nuevo diálogo y el icono `DollarSign`.
- Agregar estado para controlar apertura del diálogo y el deal seleccionado.
- Agregar botón `DollarSign` en la columna Acciones (junto a Pencil, Users, Download).
- Renderizar `EventGeneralExpensesDialog` al final del componente.

### Archivos
- **Nuevo**: `src/components/events/EventGeneralExpensesDialog.tsx`
- **Modificar**: `src/components/events/EventsAdminTable.tsx`

