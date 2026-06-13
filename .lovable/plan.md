## Objetivo

Agregar evaluaciones configurables por acreditador en la gestión de eventos (además de asistencia), y un panel en Configuración para que el superadmin administre los ítems y sus opciones/puntajes.

## Alcance funcional

**En el dialog de Gestión de Evento (supervisor/admin)**, junto a "Asistencia" se mostrarán nuevos selects, uno por cada ítem de evaluación activo. Por defecto vendrán precargados:

- **Desempeño** — Excelente (7), Bueno (5), Malo (0)
- **Presentación personal** — Excelente (7), Bueno (5), Regular (3)

Cada select muestra el puntaje de la opción elegida y se guarda junto con el resto del registro al presionar "Guardar". Los puntos del ranking pasan a ser la suma de asistencia + todos los ítems de evaluación.

**En Configuración → General** (solo superadmin), nueva sección **"Ítems de Evaluación"**:
- Listar ítems existentes
- Crear/editar/eliminar un ítem (nombre, activo sí/no, orden)
- Por ítem: agregar/editar/eliminar opciones (label + puntos)
- ConfirmDialog antes de eliminar ítems u opciones (consistente con la regla del proyecto)

## Cambios en base de datos

Dos tablas nuevas + una de registros:

- `evaluation_items` — id, name, is_active, sort_order, created_at, updated_at
- `evaluation_options` — id, item_id (FK), label, points (int), sort_order
- `evaluation_records` — id, event_id, user_id, item_id, option_id, points (snapshot), recorded_by, created_at, updated_at; UNIQUE(event_id, user_id, item_id)

RLS:
- `evaluation_items` / `evaluation_options`: SELECT para `authenticated`; INSERT/UPDATE/DELETE solo superadmin (via `has_role`).
- `evaluation_records`: SELECT/INSERT/UPDATE para miembros del evento (`is_event_member`) y admins; nadie anon.

GRANTs explícitos para `authenticated` y `service_role` en las tres tablas.

Seed inicial con los dos ítems y sus opciones por defecto.

**Ranking**: actualizar `get_accreditor_ranking` para sumar `attendance_records.ranking_points` + `evaluation_records.points` por usuario.

## Cambios en frontend

- `src/components/events/EventManagementDialog.tsx`: cargar `evaluation_items` activos con sus `evaluation_options`; agregar al estado de cada fila un map `{ itemId → optionId }`; renderizar un `<Select>` por ítem mostrando opciones + puntos; al guardar fila, upsert en `evaluation_records` por cada ítem seleccionado.
- `src/components/settings/EvaluationItemsSettings.tsx` (nuevo): CRUD de ítems y opciones con ConfirmDialog.
- `src/pages/app/Settings.tsx`: montar `<EvaluationItemsSettings />` dentro de la pestaña **General** (visible solo si `activeRole === 'superadmin'`).
- `RankingTable` no requiere cambios (consume el RPC actualizado).

## Notas técnicas

- Las opciones del select se cargan desde DB; no se hardcodean puntajes en el cliente.
- El select sigue el patrón visual existente (igual que el de Asistencia: select + cajita de puntos al lado).
- Idioma UI 100% en español, color primario azul existente — sin cambios de diseño.
- Sidebar y permisos no requieren entrada nueva (es una pestaña dentro de Configuración existente, ya restringida).

## Fuera de alcance

- No se modifica la lógica de boletas ni de gastos.
- No se notifica por WhatsApp.
- No se reabren eventos cerrados (mismo bloqueo `isClosed` aplica a los nuevos selects).