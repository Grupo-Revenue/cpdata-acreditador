

## Mover "Campos del Perfil" a la pestaña Permisos

Mover el componente `ProfileFieldsSettings` desde la pestaña "General" a la pestaña "Permisos" en la página de Configuración, ya que conceptualmente controla la visibilidad de campos para los usuarios.

### Cambio

**`src/pages/app/Settings.tsx`**
- Quitar `<ProfileFieldsSettings />` del `TabsContent` de "general"
- Agregarlo dentro del `TabsContent` de "permisos", debajo de `<PermissionsSettings />`

