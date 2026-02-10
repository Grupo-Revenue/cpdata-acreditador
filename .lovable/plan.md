

## Plan: Permitir guardar al deseleccionar usuarios

### Problema

El boton "Guardar Asignacion" esta deshabilitado cuando no hay ningun supervisor ni acreditador seleccionado (linea 441). Esto impide desasignar a todos los usuarios de un evento, ya que el boton queda en estado `disabled`.

### Solucion

Eliminar la condicion `selectedSupervisors.size === 0 && selectedAccreditors.size === 0` del atributo `disabled` del boton. Solo debe quedarse `disabled={saving}`.

Esto permitira guardar incluso con 0 seleccionados, lo cual ejecutara correctamente:
- La eliminacion de todas las asignaciones en `event_accreditors`
- La eliminacion de las boletas correspondientes en `invoices`

### Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` (linea 441) | Quitar la validacion que deshabilita el boton cuando no hay seleccion |

### Detalle tecnico

Cambio en linea 441:

Antes:
```
disabled={saving || (selectedSupervisors.size === 0 && selectedAccreditors.size === 0)}
```

Despues:
```
disabled={saving}
```

