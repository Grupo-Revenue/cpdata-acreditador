

## Dashboard de Acreditador con datos reales y sistema de FAQs

### Resumen

Reemplazar el dashboard estatico del acreditador con metricas reales (eventos semana, mes, total participados y monto ganado), incluir la tabla de ranking top 5, y agregar un sistema de FAQs editable desde Configuracion (superadmin) que se muestre con un boton de acceso directo en el dashboard.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/dashboard/AcreditadorDashboard.tsx` | Reescribir con queries reales a `event_accreditors`, `invoices` y `settings`. Agregar `RankingTable` con limit 5 y boton/dialogo de FAQs |
| `src/components/settings/FaqSettings.tsx` | Nuevo componente para gestionar FAQs (CRUD con Accordion) guardado en `settings` con key `faqs` como JSON |
| `src/pages/app/Settings.tsx` | Agregar `FaqSettings` en la pestana General |
| `src/components/dashboard/FaqDialog.tsx` | Nuevo dialogo que muestra las FAQs en formato Accordion para los acreditadores |

### Detalle tecnico

#### 1. AcreditadorDashboard.tsx

Consultas con `useQuery`:
- **Eventos semana**: Filtrar `event_accreditors` del usuario donde `events.event_date` este entre el lunes y domingo de la semana actual
- **Eventos mes**: Filtrar donde `events.event_date` este en el mes actual
- **Total participados**: Contar todos los registros en `event_accreditors` del usuario
- **Monto ganado**: Sumar `amount` de `invoices` del usuario con status `pagado`

Tarjetas de estadisticas:
1. Eventos Semana (Calendar)
2. Eventos Mes (CalendarDays)
3. Total Participados (CheckCircle)
4. Monto Ganado (DollarSign) - formateado como moneda CLP

Debajo de las tarjetas:
- `RankingTable` con `limit={5}` (componente existente reutilizado)
- Boton "Preguntas Frecuentes" con icono `HelpCircle` que abre el `FaqDialog`

#### 2. FaqSettings.tsx (nuevo)

Similar a `GlosaModelSettings`:
- Card con titulo "Preguntas Frecuentes (FAQs)"
- Almacena en `settings` con key `faqs`, valor como JSON string: `[{ pregunta: "...", respuesta: "..." }]`
- Interfaz para agregar, editar y eliminar pares pregunta/respuesta
- Cada FAQ tiene dos campos: Input para pregunta, Textarea para respuesta
- Botones para agregar nueva FAQ y eliminar existentes
- Boton "Guardar" que hace upsert

#### 3. Settings.tsx

Importar y renderizar `FaqSettings` en la pestana General, despues de `RolesManager`.

#### 4. FaqDialog.tsx (nuevo)

- Dialog con titulo "Preguntas Frecuentes"
- Lee las FAQs de `settings` con key `faqs`
- Renderiza cada par pregunta/respuesta usando el componente `Accordion` existente
- Si no hay FAQs configuradas, muestra mensaje vacio

No se requieren migraciones de base de datos ya que se reutiliza la tabla `settings` existente con nuevos keys.
