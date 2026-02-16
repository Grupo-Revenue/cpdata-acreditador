

## Permisos por Rol - Nueva seccion en Configuracion

### Resumen

Crear un sistema de permisos configurable donde el superadmin pueda controlar que elementos del menu y que acciones dentro de las tablas son visibles para cada rol (administracion, supervisor, acreditador). Los permisos se almacenan en una nueva tabla de base de datos y se consultan al cargar la aplicacion. Por defecto, todos los permisos estaran habilitados con la configuracion actual del sistema.

### 1. Migracion de base de datos

Crear una tabla `role_permissions` que almacene los permisos por rol:

```sql
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Solo superadmins pueden leer y modificar permisos
CREATE POLICY "Superadmins can manage permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Todos los usuarios autenticados pueden leer los permisos (necesario para que el frontend aplique las restricciones)
CREATE POLICY "Authenticated users can read permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);
```

Insertar los permisos por defecto para los 3 roles configurables (administracion, supervisor, acreditador) con todas las opciones habilitadas:

**Permisos de menu (navigation):**
- `nav.dashboard` - Dashboard
- `nav.users` - Usuarios
- `nav.events` - Eventos
- `nav.invoices` - Boletas
- `nav.reimbursements` - Rendiciones
- `nav.support` - Soporte
- `nav.ranking` - Ranking

**Permisos de acciones (actions):**
- `action.invoices.edit` - Editar boletas
- `action.invoices.whatsapp` - Enviar WhatsApp desde boletas
- `action.invoices.upload` - Subir archivo de boleta
- `action.events.edit` - Editar eventos
- `action.events.team` - Gestionar equipo de eventos
- `action.events.contract` - Descargar contrato
- `action.support.create` - Crear ticket de soporte
- `action.support.edit` - Editar ticket de soporte

Se insertaran filas para cada combinacion de rol x permiso, todas con `enabled = true`.

### 2. Hook `usePermissions`

Crear `src/hooks/usePermissions.ts`:

- Consulta `role_permissions` filtrando por el `activeRole` del usuario actual.
- Retorna un objeto con funciones helper:
  - `canAccess(permissionKey: string): boolean` - verifica si el permiso esta habilitado.
  - `permissions` - mapa completo de permisos cargados.
  - `isLoading` - estado de carga.
- Para el rol `superadmin`, todos los permisos retornan `true` siempre (el superadmin no se restringe a si mismo).

### 3. Componente `PermissionsSettings`

Crear `src/components/settings/PermissionsSettings.tsx`:

- Muestra una Card con titulo "Permisos por Rol".
- Tabs para cada rol configurable: Administracion, Supervisor, Acreditador.
- Dentro de cada tab, dos secciones:
  - **Menu de navegacion**: lista de checkboxes con los items del sidebar, cada uno con un Switch para activar/desactivar.
  - **Acciones en tablas**: lista agrupada por modulo (Boletas, Eventos, Soporte) con switches para cada accion.
- Al cambiar un switch, se actualiza la fila correspondiente en `role_permissions` via Supabase.
- El estado por defecto (cuando no hay fila en la tabla) es `enabled = true`.

### 4. Integrar en Settings.tsx

Agregar una nueva pestana "Permisos" en la pagina de configuracion, entre "General" e "Integraciones":

```
<TabsTrigger value="permisos">Permisos</TabsTrigger>
...
<TabsContent value="permisos">
  <PermissionsSettings />
</TabsContent>
```

### 5. Aplicar permisos en el Sidebar

Modificar `src/components/layout/Sidebar.tsx`:

- Importar y usar `usePermissions`.
- Agregar un campo `permissionKey` a cada `NavItem`.
- En `filteredNavItems`, ademas del filtro por `roles`, verificar que `canAccess(item.permissionKey)` sea `true`.

### 6. Aplicar permisos en componentes de tablas

Modificar las tablas principales para consultar permisos antes de mostrar acciones:

- **InvoicesTable.tsx**: verificar `action.invoices.edit`, `action.invoices.whatsapp`, `action.invoices.upload` antes de renderizar los botones correspondientes.
- **EventsAdminTable.tsx**: verificar `action.events.edit`, `action.events.team`, `action.events.contract`.
- **Support.tsx / TicketsTable.tsx**: verificar `action.support.create`, `action.support.edit`.

En cada caso, el hook `usePermissions` se usa para condicionar la visibilidad del boton. Si el permiso esta deshabilitado, el boton no se renderiza.

### Detalle tecnico

| Archivo | Cambio |
|---|---|
| Migracion SQL | Crear tabla `role_permissions` con RLS y datos por defecto |
| `src/hooks/usePermissions.ts` | Nuevo hook que consulta permisos del rol activo |
| `src/components/settings/PermissionsSettings.tsx` | Nuevo componente con UI de gestion de permisos |
| `src/pages/app/Settings.tsx` | Agregar pestana "Permisos" |
| `src/components/layout/Sidebar.tsx` | Filtrar items de navegacion segun permisos |
| `src/components/invoices/InvoicesTable.tsx` | Condicionar acciones segun permisos |
| `src/components/events/EventsAdminTable.tsx` | Condicionar acciones segun permisos |
| `src/pages/app/Support.tsx` | Condicionar boton crear ticket segun permisos |
| `src/components/support/TicketsTable.tsx` | Condicionar acciones segun permisos |

### Comportamiento esperado

- El superadmin ve y puede hacer todo, siempre.
- En Configuracion > Permisos, el superadmin ve tabs por cada rol con switches para cada permiso.
- Al desactivar un permiso (ej: `nav.ranking` para acreditador), ese item desaparece del sidebar para los usuarios con ese rol.
- Al desactivar una accion (ej: `action.invoices.whatsapp` para administracion), el boton de WhatsApp no aparece en la tabla de boletas para administradores.
- Por defecto, todo esta habilitado, replicando el comportamiento actual.

