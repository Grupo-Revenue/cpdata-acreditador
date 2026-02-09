

## Plan: Agregar paginacion a la tabla de Eventos (5 por pagina)

### Cambios

**Archivo: `src/pages/app/Events.tsx`**

- Agregar estado local `currentPage` (iniciando en 1)
- Calcular el slice de deals a mostrar segun la pagina actual (5 por pagina)
- Debajo de la tabla, agregar controles de paginacion usando los componentes `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`, `PaginationLink` y `PaginationEllipsis` ya existentes en el proyecto
- Mostrar numeros de pagina con ellipsis cuando haya muchas paginas
- Deshabilitar/ocultar boton "Previous" en la primera pagina y "Next" en la ultima
- Resetear a pagina 1 si los datos cambian

### Detalle tecnico

```tsx
const PAGE_SIZE = 5;
const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.ceil(deals.length / PAGE_SIZE);
const paginatedDeals = deals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
```

Se renderizara `paginatedDeals` en lugar de `deals` en el `TableBody`, y se agregara el componente de paginacion debajo del `Card`.

Solo se modifica un archivo: `src/pages/app/Events.tsx`.

