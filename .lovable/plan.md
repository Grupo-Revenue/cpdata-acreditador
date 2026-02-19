

## Configurar visibilidad de campos del perfil desde Configuracion

### Objetivo

Permitir al superadmin activar/desactivar campos del perfil de usuario desde la seccion de Configuracion. Los campos desactivados no se mostraran en la pagina de perfil para ningun usuario.

### Enfoque

Usar la tabla `settings` existente para almacenar un registro con key `profile_visible_fields` y value como JSON con la lista de campos y su estado (visible/oculto). No se necesitan cambios en la base de datos (solo insertar un registro inicial).

### Campos configurables

Se organizaran por categoria, igual que en el perfil:

**Informacion personal**: telefono, referencia_contacto

**Informacion adicional**: idioma, altura, talla_polera, fecha_nacimiento, comuna, disponibilidad_horaria, instagram, facebook, universidad, carrera, semestre

**Contacto de emergencia**: contacto_emergencia_nombre, contacto_emergencia_email, contacto_emergencia_telefono

**Datos bancarios**: banco, tipo_cuenta, numero_cuenta

Los campos nombre y apellido siempre estaran visibles (no configurables).

### Cambios

**1. Insertar registro inicial en `settings`**
- Key: `profile_visible_fields`
- Value: JSON con todos los campos activados por defecto

**2. Nuevo componente: `src/components/settings/ProfileFieldsSettings.tsx`**
- Card con titulo "Campos del Perfil"
- Lista de campos agrupados por categoria con switches para activar/desactivar
- Al cambiar un switch, actualiza el JSON en la tabla `settings`

**3. `src/pages/app/Settings.tsx`**
- Agregar `ProfileFieldsSettings` dentro de la pestana "General"

**4. `src/pages/app/Profile.tsx`**
- Consultar el setting `profile_visible_fields` al cargar
- Condicionar la renderizacion de cada FormField segun el estado del campo
- Si todos los campos de una seccion estan ocultos, ocultar la Card completa

### Estructura del JSON en settings

```text
{
  "telefono": true,
  "referencia_contacto": true,
  "idioma": true,
  "altura": false,
  ...
}
```

Archivos modificados:
- `src/components/settings/ProfileFieldsSettings.tsx` (nuevo)
- `src/pages/app/Settings.tsx`
- `src/pages/app/Profile.tsx`

