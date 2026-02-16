
## Corregir valores por defecto de permisos

### Problema

Todos los permisos se insertaron como `enabled: true`, pero el codigo tiene restricciones adicionales por rol que hacen que muchos de esos permisos no apliquen. Esto genera confusion porque la UI de Configuracion > Permisos muestra permisos habilitados que en la practica no funcionan.

### Permisos correctos por rol

**Administracion** - todo habilitado (correcto como esta):
- Todos los `nav.*`: habilitados
- Todos los `action.*`: habilitados

**Supervisor** - cambios necesarios:
| Permiso | Actual | Correcto | Razon |
|---|---|---|---|
| nav.users | true | **false** | Solo superadmin/administracion ven Usuarios en el sidebar |
| action.events.edit | true | **false** | Solo admins ven la tabla de eventos admin |
| action.events.team | true | **false** | Solo admins ven la tabla de eventos admin |
| action.events.contract | true | **false** | Solo admins ven la tabla de eventos admin |
| action.invoices.edit | true | **false** | Solo admins pueden editar boletas |
| action.invoices.whatsapp | true | **false** | Solo admins pueden enviar WhatsApp |
| action.support.edit | true | **false** | Solo admins pueden editar tickets |

**Acreditador** - mismos cambios que supervisor:
| Permiso | Actual | Correcto | Razon |
|---|---|---|---|
| nav.users | true | **false** | Solo superadmin/administracion |
| action.events.edit | true | **false** | Solo admins |
| action.events.team | true | **false** | Solo admins |
| action.events.contract | true | **false** | Solo admins |
| action.invoices.edit | true | **false** | Solo admins |
| action.invoices.whatsapp | true | **false** | Solo admins |
| action.support.edit | true | **false** | Solo admins |

### Cambio tecnico

**1. Nueva migracion SQL**

Ejecutar UPDATEs para corregir los valores:

```sql
UPDATE role_permissions SET enabled = false
WHERE role IN ('supervisor', 'acreditador')
AND permission_key IN (
  'nav.users',
  'action.events.edit',
  'action.events.team',
  'action.events.contract',
  'action.invoices.edit',
  'action.invoices.whatsapp',
  'action.support.edit'
);
```

Esto es un unico UPDATE que corrige 14 filas (7 permisos x 2 roles).

No se requieren cambios en el frontend ni en los componentes, solo la correccion de datos en la base de datos.
