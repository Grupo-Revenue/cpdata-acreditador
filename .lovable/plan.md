

## Plan: Integracion Meta WhatsApp + Plantillas + Secciones en Configuracion

### Resumen
Reorganizar la pagina de Configuracion en secciones claras usando Tabs, agregar una seccion para la integracion con Meta (WhatsApp Business API) y un gestor de plantillas de mensaje con soporte para texto, imagenes y botones.

---

### 1. Reorganizar Settings en secciones con Tabs

**Archivo: `src/pages/app/Settings.tsx`**

Reemplazar el layout actual (lista vertical de cards) por un componente `Tabs` con 3 pestanas:

| Pestana | Contenido |
|---------|-----------|
| General | `RolesManager` (gestion de roles) |
| Integraciones | `HubspotIntegration` + nuevo `MetaIntegration` |
| Plantillas WhatsApp | Nuevo `WhatsappTemplatesManager` |

---

### 2. Integracion Meta (Token de acceso + Phone Number ID)

**Nuevo archivo: `src/components/settings/MetaIntegration.tsx`**

Componente siguiendo el mismo patron de `HubspotIntegration`:
- Card con icono, titulo "Integracion Meta / WhatsApp" y badge de estado (Conectado / No configurado)
- Dos campos:
  - **Token de acceso de Meta** (guardado en `settings` con key `meta_access_token`)
  - **Phone Number ID** (guardado en `settings` con key `meta_phone_number_id`)
- Botones para guardar, cambiar y eliminar
- Usa la tabla `settings` existente (no requiere migracion)

---

### 3. Gestor de Plantillas WhatsApp

**Nueva tabla: `whatsapp_templates`**

Se creara una migracion con la siguiente estructura:

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| name | text | Nombre interno de la plantilla (requerido, unico) |
| language | text | Codigo de idioma (ej: es, es_AR) default 'es' |
| category | text | Categoria Meta: MARKETING, UTILITY, AUTHENTICATION |
| header_type | text | Tipo de header: none, text, image |
| header_text | text | Texto del header (si aplica) |
| header_image_url | text | URL de imagen del header (si aplica) |
| body_text | text | Cuerpo del mensaje con variables {{1}}, {{2}}, etc. |
| footer_text | text | Texto del footer (opcional) |
| buttons | jsonb | Array de botones (tipo, texto, url/telefono) |
| status | text | Estado: draft, pending, approved, rejected |
| meta_template_id | text | ID retornado por Meta al enviar a aprobacion |
| created_at | timestamptz | Fecha creacion |
| updated_at | timestamptz | Fecha actualizacion |

RLS: Solo superadmins pueden gestionar, todos los autenticados pueden leer.

**Nuevo archivo: `src/components/settings/WhatsappTemplatesManager.tsx`**

- Tabla con las plantillas existentes mostrando nombre, categoria, idioma y estado (badge con colores)
- Boton "Crear Plantilla" que abre un dialogo

**Nuevo archivo: `src/components/settings/WhatsappTemplateDialog.tsx`**

Dialogo para crear/editar plantilla con formulario:
- Nombre de la plantilla
- Categoria (select: Marketing, Utilidad, Autenticacion)
- Idioma (select con opciones comunes)
- Tipo de header (select: Ninguno, Texto, Imagen)
  - Campo de texto para header si es tipo texto
  - Input de URL de imagen si es tipo imagen
- Cuerpo del mensaje (textarea con ayuda para variables {{1}}, {{2}})
- Footer (input opcional)
- Seccion de botones: agregar hasta 3 botones con tipo (URL, Telefono, Respuesta rapida) y contenido
- Boton "Guardar borrador" (guarda en BD con status draft)
- Boton "Enviar a aprobacion" (guardara y en el futuro llamara a la API de Meta; por ahora cambia status a pending)

Nota: Como el usuario indico que solo quiere la UI por ahora, los botones de "Enviar a aprobacion" solo cambiaran el status localmente. La Edge Function para enviar a Meta se implementara cuando tenga las credenciales.

---

### 4. Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/app/Settings.tsx` | Modificar: agregar Tabs con 3 secciones |
| `src/components/settings/MetaIntegration.tsx` | Crear: componente de integracion Meta |
| `src/components/settings/WhatsappTemplatesManager.tsx` | Crear: tabla de plantillas |
| `src/components/settings/WhatsappTemplateDialog.tsx` | Crear: dialogo crear/editar plantilla |
| Migracion SQL | Crear: tabla `whatsapp_templates` con RLS |

No se crean Edge Functions en esta fase (solo UI).

