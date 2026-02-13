

## Ajuste de vista "Gestion de Evento" para escritorio y movil

### Problema

El dialogo actual usa una tabla con 7 columnas (Acreditador, Asistencia, Puntos, Comentarios, Fecha, Hora Ingreso, Accion) dentro de un `max-w-4xl`. Esto causa que el contenido se corte horizontalmente, especialmente en pantallas pequenas.

### Solucion

Reemplazar el layout de tabla por un diseno basado en tarjetas (cards) responsivas que se adapten correctamente a cualquier pantalla.

| Archivo | Cambio |
|---|---|
| `src/components/events/EventManagementDialog.tsx` | Redisenar la seccion de asistencia y gastos con layout responsivo |

### Detalle tecnico

**1. Seccion de Asistencia - Layout responsivo:**
- Reemplazar la `Table` de asistencia por tarjetas individuales por acreditador
- Cada tarjeta mostrara:
  - Nombre del acreditador como titulo
  - Grid responsivo (`grid-cols-2 sm:grid-cols-3`) con los campos: Asistencia (Select), Puntos, Fecha, Hora Ingreso
  - Textarea de comentarios ocupando el ancho completo debajo
  - Boton de guardar individual
- En escritorio se vera como una lista ordenada de tarjetas con campos en linea
- En movil cada campo se apilara verticalmente

**2. Dialog container:**
- Cambiar `max-w-4xl` a `max-w-3xl w-[95vw]` para mejor adaptacion
- Mantener `max-h-[90vh] overflow-y-auto`

**3. Seccion de Gastos:**
- Ya usa `flex-wrap` por lo que funciona razonablemente, pero ajustar los inputs para que se apilen en movil usando clases responsivas

**4. Botones de accion:**
- "Guardar toda la asistencia" y "Cerrar proyecto" se mantienen al final con ancho completo en movil

