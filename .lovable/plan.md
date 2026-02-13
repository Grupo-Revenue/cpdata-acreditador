

## Filtro por nombre de evento en Rendiciones

Agregar un campo de busqueda en la parte superior de la pagina de Rendiciones que filtre los eventos mostrados por nombre.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/app/Reimbursements.tsx` | Agregar un Input de busqueda entre el PageHeader y la lista de Cards, filtrando los eventos cuyo nombre contenga el texto ingresado (case-insensitive) |

### Detalle tecnico

- Nuevo estado `searchTerm` (string, default vacio)
- Input con placeholder "Buscar por nombre de evento..." e icono de Search (lucide-react), ubicado justo antes del listado de Cards
- Filtrar el array `events` con `event.name.toLowerCase().includes(searchTerm.toLowerCase())` antes del `.map()`
- Si no hay resultados tras filtrar, mostrar un mensaje "Sin resultados para la busqueda"
- El filtro se aplica en tiempo real mientras el usuario escribe

