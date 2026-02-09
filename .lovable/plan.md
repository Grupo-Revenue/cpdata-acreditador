

## Plan: Integración HubSpot en Configuración

### Objetivo
Agregar una sección en la página de Configuración para que el superadmin pueda ingresar y gestionar el token de HubSpot. Este token se almacenará de forma segura en la tabla `settings` de la base de datos y será accesible para futuras integraciones del sistema.

---

### Diseño Visual

La página de Configuración tendrá una nueva card debajo de la gestión de roles:

```text
+----------------------------------------------------------+
|  Configuración                                           |
|  Parámetros del sistema                                  |
+----------------------------------------------------------+
|                                                          |
|  [Card: Gestión de Roles]  (existente, sin cambios)      |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  Integración HubSpot                                     |
|  Configura la conexión con HubSpot para todo el sistema  |
|                                                          |
|  Token de acceso:                                        |
|  [pat-na1-xxxx****xxxx]              [Mostrar/Ocultar]   |
|                                                          |
|  Estado: Conectado / No configurado                      |
|                                                          |
|              [Guardar Token]  [Eliminar Token]           |
|                                                          |
+----------------------------------------------------------+
```

---

### Funcionamiento

1. **Sin token configurado**: Se muestra un input vacío con placeholder e indicador "No configurado"
2. **Con token guardado**: Se muestra el token enmascarado (solo últimos 4 caracteres visibles), con opción de mostrar/ocultar
3. **Guardar**: Inserta o actualiza el registro `hubspot_token` en la tabla `settings`
4. **Eliminar**: Borra el valor del token de la tabla `settings`

---

### Almacenamiento

Se utilizará la tabla `settings` existente con:
- `key`: `hubspot_token`
- `value`: el token de HubSpot
- `description`: "Token de acceso privado de HubSpot"

La tabla `settings` ya tiene RLS configurado:
- Lectura: todos los usuarios autenticados
- Escritura: solo superadmin (política existente)

**Nota de seguridad**: El token se almacena en la tabla `settings` que es legible por todos los usuarios autenticados. Para esta primera versión es funcional, pero en el futuro se podría migrar a Supabase Vault o secrets para mayor seguridad.

---

### Archivos a Crear/Modificar

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/settings/HubspotIntegration.tsx` | Nuevo | Componente con formulario para gestionar el token |
| `src/pages/app/Settings.tsx` | Modificar | Agregar el componente HubspotIntegration debajo de RolesManager |

---

### Detalles Técnicos

**Componente `HubspotIntegration`:**
- Usa `useQuery` para leer el setting `hubspot_token` de la tabla `settings`
- Usa `useMutation` para guardar/eliminar el token
- Input de tipo password con toggle de visibilidad
- Indicador visual del estado de conexión (badge verde "Conectado" o gris "No configurado")
- Diálogo de confirmación al eliminar el token
- Toast de confirmación al guardar/eliminar exitosamente

**Consultas:**
- Lectura: `SELECT value FROM settings WHERE key = 'hubspot_token'`
- Escritura: `UPSERT` en settings con key `hubspot_token`
- Eliminación: `UPDATE settings SET value = NULL WHERE key = 'hubspot_token'` o `DELETE`

