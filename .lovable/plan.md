

# Plan: Sistema de Acreditación - Bootstrap Completo

## 🎯 Visión General
Crear la base sólida del sistema de acreditación con autenticación, RBAC multi-rol, design system aplicado globalmente, y estructura modular lista para iterar por fases.

---

## Fase 1: Design System y Base Visual

### 1.1 Variables CSS y Tipografía
- Actualizar `index.css` con el sistema de colores definido (primary azul, accent cyan)
- Agregar gradientes (`gradient-primary`, `gradient-secondary`)
- Configurar sombras elegantes (`shadow-sm`, `shadow-md`, `shadow-lg`)
- Agregar la fuente Inter como tipografía principal

### 1.2 Clases Utilitarias
- Crear clases: `.glass`, `.smooth-transition`, `.hover-lift`, `.hover-glow`
- Crear clases de tarjetas: `.modern-card`, `.feature-card`
- Configurar animaciones: `fadeInUp`, `fadeInScale`, `slideInRight`
- Añadir clases de animación: `.animate-fade-in-up`, `.animate-fade-in-scale`

### 1.3 Configuración Tailwind
- Actualizar `tailwind.config.ts` con nuevos colores y keyframes
- Agregar familia tipográfica Inter

---

## Fase 2: Base de Datos Supabase

### 2.1 Tablas de Usuarios y Roles
- **profiles**: id, rut (único, validado), nombre, apellido, telefono, email, referencia_contacto, foto_url, approval_status (pending/preapproved/approved), is_active
- **roles**: id, name (superadmin, administracion, supervisor, acreditador), description
- **user_roles**: user_id, role_id (permite múltiples roles por usuario)

### 2.2 Tabla de Configuración
- **settings**: key, value, description (para parámetros del sistema)

### 2.3 Seguridad (RLS)
- Políticas para que usuarios solo lean su propio perfil
- Políticas para que admins gestionen usuarios
- Función `has_role()` para verificar roles sin recursión

### 2.4 Seed Inicial
- Crear los 4 roles base
- Crear superadmin de prueba (email: admin@sistema.cl, contraseña conocida)
- Configuraciones iniciales del sistema

---

## Fase 3: Autenticación

### 3.1 Páginas de Auth
- **Login** (`/auth/login`): Email + contraseña, link a registro y recuperación
- **Registro** (`/auth/register`): 
  - Campos: RUT, nombre, apellido, email, teléfono, referencia de contacto
  - Validación completa de RUT chileno (formato + dígito verificador)
  - El usuario queda en estado `pending` al registrarse
- **Recuperar contraseña** (`/auth/recover`): Envío de email para reset

### 3.2 Flujo de Aprobación
- Usuario registrado → estado `pending`
- Pantalla "Pendiente de aprobación" para usuarios no aprobados
- Solo usuarios `approved` + `is_active` acceden al sistema

---

## Fase 4: Layout y Navegación

### 4.1 Layouts
- **AuthLayout**: Para páginas de login/register (centrado, branding)
- **AppShell**: Sidebar + Topbar para área privada
  - Sidebar colapsable con navegación por módulos
  - Topbar con usuario, notificaciones, cerrar sesión

### 4.2 Protección de Rutas
- Verificación de sesión activa
- Verificación de estado de aprobación
- Redirección según rol al dashboard correspondiente

---

## Fase 5: Componentes UI Reutilizables

### 5.1 Componentes de Layout
- **PageHeader**: Título h1 + área de acciones + breadcrumbs
- **PageContainer**: Wrapper con padding y max-width consistente

### 5.2 Componentes de Datos
- **DataTable**: Tabla con filtros, ordenamiento y paginación (preparada para backend)
- **StatusBadge**: Badges de colores según estado (pending=amarillo, approved=verde, etc.)
- **EmptyState**: Ilustración + mensaje cuando no hay datos

### 5.3 Componentes de Interacción
- **ConfirmDialog**: Modal de confirmación de acciones destructivas
- **FileUploader**: Subida de archivos (integrado con Supabase Storage)
- **LoadingState**: Spinners y skeletons consistentes

### 5.4 Utilidades
- **RUTInput**: Input con formato automático y validación de RUT
- **Toast notifications**: Configuración de sonner/toast para mensajes

---

## Fase 6: Dashboards por Rol (Placeholder)

### 6.1 Dashboard Superadmin
- Card: Eventos hoy/semana/mes (placeholder)
- Card: Alertas de tickets pendientes
- Card: Top 5 ranking de acreditadores
- Acceso rápido: Rendiciones, Enlaces externos

### 6.2 Panel de Gestión de Usuarios (Superadmin)
- Lista de usuarios pendientes de aprobación
- Botones: Aprobar / Rechazar usuario
- Asignación de roles al aprobar

### 6.3 Dashboard Administración
- Vista de eventos asignados
- Resumen de acreditadores activos
- Acceso a reportes

### 6.4 Dashboard Supervisor
- Eventos bajo supervisión
- Estado de acreditadores asignados

### 6.5 Dashboard Acreditador
- Eventos asignados
- Mis boletas pendientes
- Mi ranking

---

## Fase 7: Estructura de Rutas

### Rutas Públicas (`/auth/*`)
```
/auth/login
/auth/register
/auth/recover
```

### Rutas Privadas (`/app/*`)
```
/app/dashboard          → Redirige según rol
/app/users              → Gestión de usuarios (admin)
/app/events             → Eventos (placeholder)
/app/invoices           → Boletas (placeholder)
/app/reimbursements     → Rendiciones (placeholder)
/app/support            → Tickets soporte (placeholder)
/app/ranking            → Ranking (placeholder)
/app/settings           → Configuración del sistema
```

---

## Fase 8: Helpers y Utilidades

### 8.1 Validación de RUT
- Función `validateRUT(rut)`: Valida formato y dígito verificador
- Función `formatRUT(rut)`: Formatea con puntos y guión
- Función `cleanRUT(rut)`: Limpia caracteres no numéricos

### 8.2 Role Resolver
- Hook `useUserRoles()`: Obtiene roles del usuario actual
- Hook `useHasRole(role)`: Verifica si tiene un rol específico
- Función `getDefaultDashboard(roles)`: Determina dashboard por rol

### 8.3 Contexto de Autenticación
- `AuthProvider`: Contexto global de autenticación
- Estado de sesión, perfil y roles del usuario
- Funciones de login, logout, registro

---

## 📋 Criterios de Éxito del Bootstrap

1. ✅ Design system aplicado globalmente (colores, tipografía, animaciones)
2. ✅ Conexión funcional a Supabase Auth
3. ✅ Registro con validación de RUT chileno completo
4. ✅ Login funcional
5. ✅ Usuario pendiente ve pantalla de espera
6. ✅ Superadmin seed creado automáticamente
7. ✅ Panel para aprobar usuarios pendientes
8. ✅ Navegación por rol implementada
9. ✅ Estructura modular lista para iterar
10. ✅ Componentes UI base listos

---

## 🔐 Credenciales del Superadmin Seed
- **Email**: admin@sistema.cl
- **Contraseña**: Admin123!
- **Rol**: superadmin (aprobado automáticamente)

