## Plan: Simplificar flujo de postulación con pestañas por etapa

### Problema actual
El flujo tiene "doble vuelta": el admin asigna el equipo → el usuario debe postular → el admin acepta → el admin envía mensaje de firma pendiente → el usuario firma. Además todo está mezclado en una sola tabla del diálogo "Postulantes", lo que dificulta ver en qué etapa va cada uno.

### Solución
Reorganizar el diálogo **Postulantes** con 4 pestañas que reflejan el ciclo de vida, sin tocar el flujo de "Asignar Equipo" (se conserva como caso manual).

```text
[ Postulantes ] [ Por aceptar ] [ Pendiente firma ] [ Firmados ]
```

### Pestañas

1. **Postulantes** (`application_status = 'pendiente'`)
   - Muestra a quienes ya postularon y esperan respuesta del admin.
   - Acciones: Ver perfil, Aceptar (con monto), Rechazar.

2. **Por aceptar** (`application_status = 'asignado'`)
   - Asignados manualmente vía "Asignar Equipo" que aún no han postulado.
   - Acciones: Ver perfil, Aceptar directo (con monto, sin esperar postulación), Rechazar.
   - Botón masivo: "Recordar postulación" (WhatsApp `msg_postular` si existe, o reutiliza una plantilla actual).

3. **Pendiente firma** (`application_status = 'aceptado'` y `contract_status = 'pendiente'`)
   - Aceptados que aún no firman el contrato.
   - Acciones: Ver perfil, Ver monto, Cancelar aceptación.
   - Botón masivo: "Recordar firma" (mantiene el actual `msg_firma_pendiente`, hoy en la cabecera).

4. **Firmados** (`contract_status = 'firmado'`)
   - Aceptados que ya firmaron — listos para asistencia.
   - Acciones: Ver perfil, Descargar contrato.

### Filtros
La grilla de filtros actual (nombre, evento, rol, ranking) se mantiene **arriba de las pestañas** y se aplica a la pestaña activa. Se eliminan los filtros redundantes de "Postulación" y "Contrato" porque la pestaña ya define ese estado.

### Contadores
Cada pestaña muestra un badge con el número de registros en esa etapa, para que el admin vea de un vistazo dónde hay trabajo pendiente.

### Aceptación directa desde "Por aceptar"
Hoy el admin solo puede aceptar a quienes ya postularon. Se agregará la posibilidad de aceptar directamente a un asignado (sin pasar por postulación), abriendo el mismo diálogo de monto. Esto elimina la "doble vuelta" para casos de asignación manual.

### Lo que NO cambia
- El diálogo "Asignar Equipo" se mantiene tal cual.
- La firma sigue desde la tabla del usuario (`EventsUserTable`), con el trigger `sync_contract_signed` ya implementado.
- Las plantillas WhatsApp y la lógica de boletas no se modifican.
- El esquema de base de datos no cambia.

### Detalles técnicos

**Archivo a modificar:** `src/components/events/EventApplicantsDialog.tsx`

- Envolver el contenido en `<Tabs>` (shadcn) con 4 `TabsTrigger` + `TabsContent`.
- Derivar 4 listas filtradas desde `applicants` con los criterios indicados.
- Cada `TabsContent` reusa el mismo bloque `<Table>` y paginación, parametrizado por la lista activa y por las acciones disponibles según etapa.
- Mover el botón "Firma Pendiente" actual a la pestaña **Pendiente firma** y el nuevo "Recordar postulación" a la pestaña **Por aceptar**.
- Agregar `handleAcceptDirect` que reutiliza `handleConfirmAccept` (validación de conflicto + update + sync invoice + WhatsApp `msg_seleccionado`) pero parte desde estado `asignado` en vez de `pendiente`.

### Archivos
- **Modificar**: `src/components/events/EventApplicantsDialog.tsx`
