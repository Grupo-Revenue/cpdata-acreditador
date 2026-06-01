## Objetivo
Agregar un card/cuadrado en los dashboards de **acreditador** y **supervisor** que muestre la cantidad de eventos pendientes para postular (aquellos donde `application_status = 'asignado'`), con la posibilidad de hacer clic para ir a la página de eventos.

## Archivos a modificar

### 1. `src/pages/dashboard/AcreditadorDashboard.tsx`
- Agregar una nueva query que cuente los `event_accreditors` del usuario actual donde `application_status = 'asignado'`.
- Insertar un nuevo card en el grid de stats con:
  - Título: "Postulaciones Pendientes" o "Eventos para Postular"
  - Icono: `Send` (lucide-react)
  - Color: warning o accent (destacado para llamar la atención)
  - Valor: cantidad de eventos con `application_status = 'asignado'`
  - Hacer el card clickeable para navegar a `/app/events`

### 2. `src/pages/dashboard/SupervisorDashboard.tsx`
- Agregar la misma query de eventos pendientes para postular (conteo de `event_accreditors` donde `application_status = 'asignado'`).
- Insertar el mismo card en el grid de stats, con las mismas características.
- El card debe ser clickeable y llevar a `/app/events`.

## Detalles técnicos
- La query debe usar `supabase.from('event_accreditors').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('application_status', 'asignado')`.
- Se debe mantener el estilo visual consistente con los cards existentes (colores semanticos, animaciones, etc.).
- No se requieren cambios de backend ni de base de datos.