

## Plan: Filtrar acreditadores por estado y agregar búsqueda en Gestión de Evento

### Problema
El diálogo de Gestión de Evento muestra todos los acreditadores asignados sin importar su estado de postulación o contrato. Debería mostrar solo los aceptados y los que firmaron contrato. Además, no hay filtro de búsqueda, lo cual es problemático con más de 10 acreditadores.

### Cambios en `src/components/events/EventManagementDialog.tsx`

1. **Modificar el query de acreditadores** (líneas 84-101): incluir `application_status` y `contract_status` en el select de `event_accreditors`, y también `rut, telefono` del perfil para el filtro de búsqueda.

2. **Filtrar solo acreditadores aceptados o con contrato firmado**: en el mapeo, incluir solo registros donde `application_status = 'aceptado'` o `contract_status = 'firmado'`.

3. **Agregar estado de filtro de búsqueda**: nuevo state `searchFilter` que filtre por nombre, apellido, RUT o teléfono.

4. **Agregar campo de búsqueda en la UI**: un `Input` con placeholder de búsqueda sobre la sección de asistencia, siguiendo el patrón de filtros en cuadrícula externa.

5. **Mostrar badges de estado**: indicar visualmente si el acreditador está "Aceptado" o "Contrato Firmado" junto a su nombre.

### Detalle técnico

- Query modificado: `.select('user_id, application_status, contract_status')` + filtro `.in('application_status', ['aceptado'])` o filtro en JS post-fetch para incluir también `contract_status = 'firmado'`
- Perfil: `.select('id, nombre, apellido, rut, telefono')`
- Filtro JS: `attendanceRows.filter(row => row.nombre.includes(search) || row.rut.includes(search) || ...)`
- Interfaces `AttendanceRow` extendida con `rut`, `telefono`, `applicationStatus`, `contractStatus`

