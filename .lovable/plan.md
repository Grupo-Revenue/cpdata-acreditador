

## Agregar columna "Estado" en la vista de eventos del acreditador

### Resumen

Agregar una columna de estado en la tabla de eventos del acreditador que muestre el estado de su postulacion (pendiente, aceptado, rechazado) o si el evento ya finalizo. El boton de firma digital solo se habilitara cuando el acreditador haya sido aceptado.

### Logica de estados

El estado que vera el acreditador se determina combinando dos fuentes de datos:

| Condicion | Estado mostrado | Color |
|---|---|---|
| Evento con status `completed` | **Evento Finalizado** | Gris |
| `application_status` = `pendiente` | **Pendiente** | Amarillo |
| `application_status` = `aceptado` | **Aceptado** | Verde |
| `application_status` = `rechazado` | **Rechazado** | Rojo |

Prioridad: si el evento esta finalizado, se muestra "Evento Finalizado" independientemente del `application_status`.

### Boton de firma digital

- **Habilitado**: solo cuando `application_status` = `aceptado` y el evento NO esta finalizado
- **Deshabilitado**: en cualquier otro caso (pendiente, rechazado o evento finalizado)

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/EventsUserTable.tsx` | Agregar columna "Estado", consultar `event_accreditors` para obtener el estado de postulacion del usuario, consultar `events` para el estado del evento, condicionar el boton de firma |
| `src/pages/app/Events.tsx` | Pasar `userId` como prop a `EventsUserTable` para la consulta |

### Detalle tecnico

**En `Events.tsx`:**
- Pasar `userId={user?.id}` como prop a `EventsUserTable`

**En `EventsUserTable.tsx`:**
1. Agregar prop `userId` a la interfaz
2. Crear una query con `useQuery` que obtenga los registros de `event_accreditors` del usuario actual, incluyendo `application_status` y la relacion `events(hubspot_deal_id, status)`
3. Crear un mapa `dealId -> { applicationStatus, eventStatus }` para busqueda rapida
4. Agregar columna "Estado" en la tabla (entre "Horario" y "Acciones")
5. Renderizar un `StatusBadge` o `Badge` con el estado calculado segun la logica de prioridad
6. Condicionar `disabled` en el boton de firma digital: deshabilitado si `applicationStatus !== 'aceptado'` o `eventStatus === 'completed'`
7. Agregar un filtro de estado en la cuadricula de filtros (grid pasa a 7 columnas en desktop)
8. Actualizar el `colSpan` de la fila vacia de 7 a 8

