## Agregar `title` a todos los botones de solo ícono que faltan

Tras revisar el proyecto encontré varios `<Button size="icon">` sin `title`. Para cada uno se agregará un texto descriptivo en español.

### Cambios

**`src/pages/app/Profile.tsx`**
- Botón cámara avatar → `title="Cambiar foto de perfil"`

**`src/components/support/TicketsTable.tsx`**
- Pencil → `title="Editar ticket"`
- Eye → `title="Ver ticket"`

**`src/components/support/TicketCreateDialog.tsx`**
- X archivo → `title="Quitar archivo"`

**`src/components/layout/Topbar.tsx`**
- Menú móvil → `title="Abrir menú"`

**`src/components/settings/FaqSettings.tsx`**
- Trash → `title="Eliminar pregunta"`

**`src/components/settings/HubspotIntegration.tsx`** (2 botones)
- Eye/EyeOff → `title="Mostrar/Ocultar token"`

**`src/components/settings/MetaIntegration.tsx`** (2 botones)
- Eye/EyeOff → `title="Mostrar/Ocultar token"`

**`src/components/settings/WhatsappTemplateDialog.tsx`**
- Trash botón → `title="Eliminar botón"`

**`src/components/settings/WhatsappTemplatesManager.tsx`** (3 botones)
- Refresh → `title="Verificar estado"`
- Pencil → `title="Editar plantilla"`
- Trash → `title="Eliminar plantilla"`

**`src/components/events/EventManagementDialog.tsx`** (3 botones)
- Save asistencia → `title="Guardar asistencia"`
- Trash gasto (x2) → `title="Eliminar gasto"`

**`src/components/events/EventGeneralExpensesDialog.tsx`**
- Trash → `title="Eliminar gasto"`

**`src/components/events/EventApplicantsDialog.tsx`** (6 botones)
- Ver perfil → `title="Ver perfil"`
- Aceptar (Check) → `title="Aceptar postulación"`
- Rechazar (X) → `title="Rechazar postulación"`
- Cancelar aceptación (Undo2) → `title="Anular aceptación"`
- ChevronLeft → `title="Página anterior"`
- ChevronRight → `title="Página siguiente"`

**`src/components/events/AttendanceCommentsDialog.tsx`** (2 botones)
- ChevronLeft → `title="Página anterior"`
- ChevronRight → `title="Página siguiente"`

**`src/components/ui/LanguageTagsInput.tsx`**
- Plus → `title="Agregar"`

### Detalle técnico
- Solo se agrega el atributo nativo `title` a cada `<Button>`. Sin cambios de lógica ni backend.
- Se omite el botón interno de `src/components/ui/sidebar.tsx` (componente de librería shadcn).