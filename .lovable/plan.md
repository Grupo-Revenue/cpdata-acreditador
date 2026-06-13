# Plan: eliminar "Asistencia" del diálogo de gestión de evento

## Cambios

### 1) `src/components/events/EventManagementDialog.tsx`
- Eliminar el `<Select>` "Asistencia" (presente / atrasado / ausente) y la cajita de puntos asociada.
- Mantener "Fecha" y "Hora de llegada" en su mismo lugar.
- En `saveAttendance`: seguir guardando el registro en `attendance_records` (para conservar fecha/hora/comentario), pero con `status = 'presente'` fijo y `ranking_points = 0` para que no aporte al ranking.
- Eliminar el uso de `POINTS_MAP` para el cálculo de puntos (queda en 0). La constante puede borrarse.
- `Puntualidad` sigue funcionando vía `evaluation_records` (ya existe, suma 7/5/0).

### 2) `get_accreditor_ranking` (migration SQL)
Actualizar el RPC para que el total ya no sume `attendance_records.ranking_points` y sume únicamente `evaluation_records.points`:

```sql
total_points = COALESCE(SUM(evaluation_records.points), 0)
events_count = COUNT(*) FROM attendance_records  -- se mantiene como conteo de eventos asistidos
```

### 3) Memoria de proyecto
Actualizar `mem://logica/ranking-puntos-asistencia` para reflejar que los puntos provienen de Puntualidad (ítem de evaluación), no de `attendance_records.ranking_points`.

## Fuera de alcance
- No se tocan tablas `attendance_records` ni `evaluation_*` (estructura).
- No se modifica Configuración → Ítems de Evaluación (Puntualidad ya está creada con 7/5/0).
- No se borran registros históricos: los `ranking_points` viejos quedan en la tabla pero dejan de contar en el ranking.
