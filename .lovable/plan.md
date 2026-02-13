

## Modelo de Glosa para boletas

### Resumen

Agregar un campo "Modelo Glosa" en la seccion General de Configuracion (solo superadmin) que almacene un texto largo con instrucciones sobre que deben escribir los usuarios en la glosa al generar una boleta en SII. Este texto se mostrara como informacion de ayuda cuando un supervisor o acreditador abra el dialogo para subir su boleta.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/settings/GlosaModelSettings.tsx` | Nuevo componente Card con Textarea para editar el modelo de glosa, guardado en tabla `settings` con key `modelo_glosa` |
| `src/pages/app/Settings.tsx` | Agregar `GlosaModelSettings` en la pestana General |
| `src/components/invoices/InvoiceEditDialog.tsx` | Cuando el usuario NO es admin, mostrar un bloque informativo con el texto del modelo de glosa (consulta a `settings`) |

### Detalle tecnico

**1. GlosaModelSettings.tsx (nuevo)**
- Card similar a `PaymentDaySettings` con icono `FileText`
- Titulo: "Modelo de Glosa"
- Descripcion: "Texto de referencia para que los usuarios sepan que escribir en la glosa al emitir su boleta en SII"
- Textarea con el valor actual, cargado desde `settings` donde `key = 'modelo_glosa'`
- Boton "Guardar" que hace upsert en `settings` con `onConflict: 'key'`

**2. Settings.tsx**
- Importar y renderizar `GlosaModelSettings` en la pestana General, debajo de `PaymentDaySettings`

**3. InvoiceEditDialog.tsx**
- Cuando `!isAdmin` (supervisor/acreditador subiendo boleta), hacer una query a `settings` para obtener `modelo_glosa`
- Mostrar un bloque informativo (fondo azul claro / `bg-blue-50 border-blue-200`) con titulo "Modelo de Glosa" y el texto del setting, ubicado antes de los campos de numero de boleta y archivo
- Si no hay modelo configurado, no mostrar nada

No se requieren migraciones de base de datos ya que se usa la tabla `settings` existente con un nuevo key.
