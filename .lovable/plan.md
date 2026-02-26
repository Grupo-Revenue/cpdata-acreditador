

## Diagnóstico: RLS bloquea la visibilidad de acreditadores en Gestión de Evento

### Problema
La tabla `event_accreditors` tiene estas políticas RLS de SELECT:
- **Admins can view all event_accreditors**: solo para admins
- **Users can view own assignments**: solo `user_id = auth.uid()`

Cuando un supervisor abre "Gestión de Evento", el query busca TODOS los acreditadores del evento, pero RLS solo le devuelve su propia fila. Por eso aparece "No hay acreditadores aceptados con contrato firmado" aunque existan.

### Solución

**Migración SQL**: Agregar una política RLS que permita a usuarios asignados a un evento ver a todos los demás asignados del mismo evento:

```sql
CREATE POLICY "Event members can view co-assigned accreditors"
  ON event_accreditors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_accreditors ea
      WHERE ea.event_id = event_accreditors.event_id
        AND ea.user_id = auth.uid()
    )
  );
```

Esto permite que si estás asignado a un evento (como supervisor), puedas ver a todos los acreditadores de ese mismo evento. No se requieren cambios en el código frontend.

### Impacto en seguridad
- Solo usuarios ya asignados al evento pueden ver a los co-asignados
- No expone datos de otros eventos
- Consistente con las políticas existentes de `attendance_records` y `event_expenses`

