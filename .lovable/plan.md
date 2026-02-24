

## Revision Completa de Responsive / Mobile

Despues de revisar todos los componentes de layout, paginas principales, tablas y formularios, estos son los hallazgos organizados por severidad.

---

### PROBLEMA 1 (Critico): Tablas sin scroll horizontal en movil

**Archivos afectados:**
- `src/components/events/EventsAdminTable.tsx` (10 columnas)
- `src/components/invoices/InvoicesTable.tsx` (10 columnas)
- `src/components/users/UsersTable.tsx` (6 columnas)
- `src/components/support/TicketsTable.tsx` (7-8 columnas)
- `src/components/dashboard/RecentTicketsTable.tsx` (5 columnas)
- `src/components/dashboard/RankingTable.tsx` (4-5 columnas)

Ninguna tabla tiene `overflow-x-auto` en su contenedor. En pantallas menores a ~768px, las tablas desbordan el viewport horizontalmente, rompiendo el layout completo de la pagina. Los usuarios en celular no pueden ver todas las columnas ni hacer scroll lateral.

**Solucion:** Envolver cada `<Table>` en un `<div className="overflow-x-auto">` y agregar `min-w-[600px]` o similar al `<Table>` para que el scroll horizontal funcione correctamente.

---

### PROBLEMA 2 (Critico): Filtros de InvoicesTable inutilizables en movil

**Archivo:** `src/components/invoices/InvoicesTable.tsx` linea 145

La grilla de filtros usa `grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9`. En movil se muestran 9 inputs/selects comprimidos en 2 columnas, ocupando mucho espacio vertical y con inputs demasiado pequenos (altura `h-8` y `text-xs`). Ademas, los inputs de fecha no tienen tipo `date`, son texto plano, lo que impide usar el datepicker nativo del celular.

**Solucion:** Reducir los filtros visibles en movil a los mas importantes (nombre, estado, evento) y colapsar los demas detras de un boton "Mas filtros" o usar un layout mas amigable para pantallas pequenas.

---

### PROBLEMA 3 (Importante): Formulario de registro con grid-cols-2 fijo

**Archivo:** `src/pages/auth/Register.tsx` lineas 117, 152, 192, 209, 226, 256, 294

Multiples secciones usan `grid grid-cols-2 gap-4` sin breakpoint responsive. En celular, esto comprime los campos a ~50% del ancho, haciendo que inputs como "Telefono" o "Fecha de nacimiento" sean demasiado estrechos y dificiles de usar.

**Solucion:** Cambiar a `grid grid-cols-1 sm:grid-cols-2 gap-4` en todas las instancias del formulario de registro.

---

### PROBLEMA 4 (Importante): PageHeader con acciones desborda en movil

**Archivo:** `src/pages/app/Users.tsx` lineas 420-438

El `PageHeader` de Usuarios tiene 3 botones de accion (Cargar Usuarios, Crear Usuario, Actualizar). En movil, estos botones se apilan pero pueden desbordar el ancho disponible. Ademas, los botones muestran texto + icono que ocupan mucho espacio.

**Solucion:** En movil, mostrar solo iconos sin texto en los botones de accion, o reducir a 2 botones visibles con un menu desplegable para las opciones secundarias.

---

### PROBLEMA 5 (Importante): Eventos - header con flex sin wrap

**Archivo:** `src/pages/app/Events.tsx` lineas 101-116

La pagina de Eventos usa `flex items-center justify-between` para el header + boton "Postulantes". En movil, el `PageHeader` y el boton compiten por espacio horizontal sin `flex-wrap`, lo que puede causar desbordamiento.

**Solucion:** Cambiar a `flex flex-wrap items-start justify-between gap-4` o mover el boton a las `actions` del `PageHeader`.

---

### PROBLEMA 6 (Moderado): Settings TabsList no hace wrap en movil

**Archivo:** `src/pages/app/Settings.tsx` linea 28

La lista de tabs tiene 6 opciones (General, Permisos, Integraciones, Plantillas WhatsApp, FAQs, Firma Digital) sin `flex-wrap`. En pantallas pequenas, las tabs se comprimen y el texto se trunca o desborda.

**Solucion:** Agregar `flex-wrap h-auto gap-1` al `TabsList` (como ya se hizo en Users.tsx) o usar un `Select` para navegar entre tabs en movil.

---

### PROBLEMA 7 (Moderado): Users TabsList ya tiene flex-wrap pero podria mejorar

**Archivo:** `src/pages/app/Users.tsx` linea 443

La `TabsList` ya usa `flex-wrap h-auto gap-1`, lo cual es correcto. Sin embargo, los contadores dentro de cada `TabsTrigger` agregan ancho extra que puede hacer que las tabs se vean apretadas en pantallas muy pequenas.

No requiere accion inmediata.

---

### PROBLEMA 8 (Menor): Sidebar movil no cierra al navegar

**Archivo:** `src/components/layout/AppShell.tsx` y `src/components/layout/Sidebar.tsx`

Cuando el usuario toca un enlace de navegacion en el sidebar movil, el sidebar no se cierra automaticamente. El usuario debe cerrar manualmente el menu despues de cada navegacion.

**Solucion:** Agregar un `useEffect` que escuche cambios en `location.pathname` y cierre el menu movil automaticamente, o pasar un callback `onNavigate` al Sidebar que cierre el overlay.

---

### LO QUE FUNCIONA BIEN

- **AuthLayout**: Panel izquierdo se oculta en movil (`hidden lg:flex`), logo movil aparece correctamente
- **AppShell**: Sidebar se oculta en desktop/movil correctamente, overlay funcional
- **Topbar**: Menu hamburguesa visible solo en movil, role badge oculto en pantallas pequenas (`hidden sm:inline-flex`)
- **Profile page**: Usa `sm:grid-cols-2` correctamente en la mayoria de secciones
- **PageHeader**: Usa `flex-col sm:flex-row` correctamente
- **Pending users cards**: Usan `flex-col sm:flex-row` correctamente

---

### Plan de implementacion recomendado

| Prioridad | Cambio | Archivos |
|---|---|---|
| 1 | Agregar `overflow-x-auto` a todas las tablas | 6 archivos de tablas |
| 2 | Hacer grid-cols responsive en Register.tsx | `Register.tsx` |
| 3 | Fix sidebar movil: cerrar al navegar | `AppShell.tsx` |
| 4 | Fix header de Events.tsx | `Events.tsx` |
| 5 | Fix Settings TabsList wrap | `Settings.tsx` |
| 6 | Simplificar filtros de InvoicesTable en movil | `InvoicesTable.tsx` |

Todos estos cambios son de CSS/layout y no afectan la logica de negocio.

