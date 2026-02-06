

## Plan: Dashboard Superadmin con Datos Reales

### Objetivo
Actualizar el dashboard de superadmin para mostrar datos reales de usuarios pendientes, reemplazando los valores estáticos actuales con información en tiempo real desde la base de datos.

---

### Cambios en el Dashboard

#### Estadísticas a Mostrar (Cards Superiores)
| Card | Fuente de Datos |
|------|-----------------|
| Usuarios Pendientes | `profiles` donde `approval_status = 'pending'` |
| Eventos Hoy | Placeholder: "0" (pendiente tabla de eventos) |
| Eventos del Mes | Placeholder: "0" (pendiente tabla de eventos) |
| Total Usuarios Activos | `profiles` donde `is_active = true` AND `approval_status = 'approved'` |

#### Secciones Principales
1. **Cards de Estadísticas**: 4 tarjetas con contadores en tiempo real
2. **Lista de Usuarios Pendientes**: Reemplaza "Top Acreditadores" con la lista real de usuarios que requieren aprobación
3. **Accesos Rápidos**: Enlace directo a gestión de usuarios

---

### Implementación Técnica

#### 1. Modificar SuperadminDashboard.tsx
- Agregar hooks de React Query para obtener datos
- Consultar `profiles` para contar usuarios pendientes y activos
- Mostrar lista de usuarios pendientes con nombre, email y fecha de registro
- Agregar botón de acción para ir a la página de gestión de usuarios

#### 2. Consultas a Realizar
```text
Usuarios pendientes:
  SELECT * FROM profiles 
  WHERE approval_status = 'pending' 
  ORDER BY created_at DESC

Conteo de usuarios activos:
  SELECT count(*) FROM profiles 
  WHERE is_active = true AND approval_status = 'approved'
```

---

### Diseño Visual

```text
+--------------------------------------------------+
|  Dashboard Superadmin                            |
+--------------------------------------------------+
|  [Eventos Hoy]  [Eventos Mes]  [Pendientes]  [Activos]
|       0              0            5             12
+--------------------------------------------------+
|                                    |             |
|  Usuarios Pendientes de            | Accesos     |
|  Aprobación                        | Rápidos     |
|  +--------------------------+      |             |
|  | Test Tester              |      | [Usuarios]  |
|  | test@test.cl             |      | [Eventos]   |
|  | Hace 2 días              |      | [Config]    |
|  | [Aprobar] [Rechazar]     |      |             |
|  +--------------------------+      |             |
|                                    |             |
+------------------------------------+-------------+
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/dashboard/SuperadminDashboard.tsx` | Agregar React Query, consultas a Supabase, lista de usuarios pendientes |

---

### Funcionalidades

1. **Contadores en tiempo real**: Se actualizan automáticamente con los datos de la BD
2. **Lista de pendientes**: Muestra los últimos 5 usuarios pendientes con:
   - Nombre completo (o email si no tiene nombre)
   - Fecha de registro
   - Botones de acción rápida
3. **Navegación rápida**: Botón para ir a la página completa de gestión de usuarios
4. **Estados de carga**: Skeletons mientras se cargan los datos
5. **Manejo de vacíos**: Mensaje amigable si no hay usuarios pendientes

---

### Próximos Pasos (Futuros)

Los eventos se mostrarán como "0" hasta que se implemente la tabla de eventos. Una vez creada, se podrán agregar las consultas correspondientes:
- Eventos de hoy: Filtrar por fecha del día actual
- Eventos del mes: Filtrar por mes actual

