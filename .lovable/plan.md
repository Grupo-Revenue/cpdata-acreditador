

## Plan: Simplificar filtro y eliminar badges en Gestión de Evento

### Cambios en `src/components/events/EventManagementDialog.tsx`

1. **Filtro más estricto** (líneas 99-102): Cambiar la condición OR a AND — solo mostrar acreditadores con `application_status === 'aceptado'` **Y** `contract_status === 'firmado'`.

2. **Eliminar badges** (líneas 406-411): Remover los dos `<Badge>` de "Contrato Firmado" y "Aceptado", dejando solo el nombre.

3. **Limpiar interfaz** (líneas 40-41): Eliminar `applicationStatus` y `contractStatus` de `AttendanceRow` y del mapeo, ya que no se usarán más en la UI.

4. **Actualizar mensaje vacío** (línea 394): Cambiar texto a "No hay acreditadores aceptados con contrato firmado."

