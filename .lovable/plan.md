

## Corregir variable HORARIO en el contrato

### Problema

La variable `{{HORARIO}}` aparece como "_______________" en el contrato porque el `useEffect` que procesa las variables del contrato tiene como dependencias `[open, eventId, userId]` pero no incluye `horario`. Si la prop `horario` llega despues de que el efecto ya se ejecuto, el texto no se reprocesa con el valor correcto.

### Solucion

Agregar `horario` al array de dependencias del `useEffect` en `DigitalSignatureDialog.tsx` (linea 107), para que el contrato se reprocese si la prop cambia.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/DigitalSignatureDialog.tsx` | Cambiar la linea 107 de `[open, eventId, userId]` a `[open, eventId, userId, horario]` |

### Nota

Si el campo `hora_de_inicio_y_fin_del_evento` en HubSpot esta vacio para este evento, el horario seguira apareciendo como "_______________" (placeholder por defecto). En ese caso, seria necesario completar ese campo en HubSpot para que aparezca en el contrato.

