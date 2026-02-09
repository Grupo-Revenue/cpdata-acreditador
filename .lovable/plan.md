

## Plan: Agregar columnas Teléfono, Email y Ranking a la tabla de Supervisores

### Cambio en `src/components/events/EventTeamDialog.tsx`

Actualmente la tabla de supervisores solo muestra Nombre, RUT y Email. Se agregara Teléfono y Ranking (Email ya existe).

#### 1. Query de supervisores

Actualizar la consulta de perfiles de supervisores para incluir `ranking` (ya se obtiene `telefono` y `email`):

```
.select('id, nombre, apellido, rut, email, telefono, ranking')
```

#### 2. Tabla de supervisores

Agregar las columnas faltantes al header y body:

| Columna actual | Nueva |
|---|---|
| Nombre | (se mantiene) |
| RUT | (se mantiene) |
| Email | (se mantiene) |
| — | Teléfono (nuevo) |
| — | Ranking (nuevo) |

#### Archivo afectado

| Archivo | Accion |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` | Agregar columnas Teléfono y Ranking en la tabla de supervisores, actualizar query |

No se requieren cambios en base de datos.

