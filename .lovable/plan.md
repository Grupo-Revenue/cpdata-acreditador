

## Plan: Rediseño del Dashboard Superadmin

### Objetivo
Actualizar el dashboard de superadmin con las siguientes modificaciones:
1. Mantener 4 cards de estadisticas: Eventos Hoy, Eventos Mes, Eventos Dia, Usuarios Pendientes
2. Reemplazar la seccion de "Usuarios Pendientes de Aprobacion" por una tabla de ranking de acreditadores
3. Actualizar accesos rapidos con: Cotizacion, Trello y Hubspot

---

### Requisitos Previos

Actualmente NO existe una tabla de eventos en la base de datos. Para mostrar:
- Eventos Hoy/Mes/Dia con datos reales
- Ranking de acreditadores por eventos completados

Se necesita crear la estructura de datos de eventos.

---

### Cambios en Base de Datos

#### Nueva Tabla: `events`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | Identificador unico |
| name | text | Nombre del evento |
| description | text | Descripcion opcional |
| event_date | date | Fecha del evento |
| location | text | Ubicacion del evento |
| status | enum | Estado: pending, in_progress, completed, cancelled |
| created_at | timestamp | Fecha de creacion |
| updated_at | timestamp | Fecha de actualizacion |

#### Nueva Tabla: `event_accreditors`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | Identificador unico |
| event_id | uuid | Referencia al evento |
| user_id | uuid | Referencia al acreditador |
| status | enum | Estado: assigned, completed |
| created_at | timestamp | Fecha de asignacion |

Esta estructura permitira:
- Contar eventos por fecha (hoy, mes)
- Calcular ranking por cantidad de eventos completados por acreditador

---

### Cambios en el Dashboard

#### Cards de Estadisticas (4 tarjetas superiores)

| Card | Fuente de Datos |
|------|-----------------|
| Eventos Hoy | COUNT de `events` donde `event_date = today` |
| Eventos del Mes | COUNT de `events` donde `event_date` en mes actual |
| Eventos del Dia | COUNT de `events` donde `event_date = today` (duplicado de Eventos Hoy, confirmar diferencia) |
| Usuarios Pendientes | COUNT de `profiles` donde `approval_status = 'pending'` |

#### Seccion Principal: Tabla de Ranking

Reemplaza la lista de usuarios pendientes por una tabla que muestra:

| Columna | Descripcion |
|---------|-------------|
| Posicion | Numero de ranking (1, 2, 3...) |
| Acreditador | Nombre completo del usuario |
| Eventos Completados | Cantidad de eventos donde participo |
| Ultimo Evento | Fecha del ultimo evento completado |

La tabla mostrara los top 10 acreditadores ordenados por eventos completados.

#### Accesos Rapidos Actualizados

| Boton | Accion |
|-------|--------|
| Cotizacion | Navega a `/app/quotes` (pagina interna) |
| Trello | Abre enlace externo a Trello (configurable) |
| Hubspot | Abre enlace externo a Hubspot (configurable) |

---

### Diseno Visual

```text
+------------------------------------------------------------------+
|  Dashboard Superadmin                                            |
+------------------------------------------------------------------+
|  [Eventos Hoy]  [Eventos Mes]  [Eventos Dia]  [Pendientes]       |
|       5              28            5              3              |
+------------------------------------------------------------------+
|                                           |                      |
|  Ranking de Acreditadores                 | Accesos Rapidos      |
|  +-------------------------------------+  |                      |
|  | #  | Nombre      | Eventos | Ultimo |  | [Cotizacion]         |
|  |----|-------------|---------|--------|  | [Trello]             |
|  | 1  | Juan Perez  |   45    | 05/02  |  | [Hubspot]            |
|  | 2  | Maria Lopez |   38    | 04/02  |  |                      |
|  | 3  | Pedro Diaz  |   32    | 03/02  |  |                      |
|  +-------------------------------------+  |                      |
|                                           |                      |
+-------------------------------------------+----------------------+
```

---

### Archivos a Crear/Modificar

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| Migracion SQL | Nuevo | Crear tablas events y event_accreditors |
| `src/pages/dashboard/SuperadminDashboard.tsx` | Modificar | Implementar nuevo layout con ranking y accesos |
| `src/components/dashboard/RankingTable.tsx` | Nuevo | Componente de tabla de ranking reutilizable |

---

### Consultas a Implementar

```text
Eventos Hoy:
  SELECT COUNT(*) FROM events 
  WHERE event_date = CURRENT_DATE

Eventos del Mes:
  SELECT COUNT(*) FROM events 
  WHERE EXTRACT(MONTH FROM event_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM event_date) = EXTRACT(YEAR FROM CURRENT_DATE)

Ranking de Acreditadores:
  SELECT 
    p.id,
    p.nombre,
    p.apellido,
    COUNT(ea.id) as eventos_completados,
    MAX(e.event_date) as ultimo_evento
  FROM profiles p
  JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'acreditador'
  LEFT JOIN event_accreditors ea ON p.id = ea.user_id AND ea.status = 'completed'
  LEFT JOIN events e ON ea.event_id = e.id
  GROUP BY p.id, p.nombre, p.apellido
  ORDER BY eventos_completados DESC
  LIMIT 10
```

---

### URLs Externas

Los enlaces a Trello y Hubspot se manejaran como:
- URLs configurables en la tabla `settings` del sistema
- O como constantes en el codigo (mas simple para empezar)

---

### Notas Importantes

1. **Eventos Hoy vs Eventos Dia**: Parecen ser lo mismo. Si hay diferencia (ej: Eventos Dia = eventos donde el usuario actual participa), necesito aclaracion.

2. **Datos Iniciales**: Como no hay eventos en la BD, el ranking mostrara todos los acreditadores con 0 eventos hasta que se agreguen datos.

3. **Pagina de Cotizacion**: El boton de Cotizacion navegara a una ruta interna. Si la pagina no existe, se creara un placeholder.

