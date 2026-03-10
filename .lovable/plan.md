

## Plan: Scroll y paginacion en dialogo de comentarios

### Cambios en `src/components/events/AttendanceCommentsDialog.tsx`

1. Agregar estado de paginacion (`page`, `ITEMS_PER_PAGE = 5`)
2. Resetear pagina a 1 cuando cambia el `userId`
3. Calcular `paginatedComments` como slice del array total
4. Envolver la lista de comentarios en un `ScrollArea` con altura maxima fija (~400px)
5. Mostrar controles de paginacion debajo: contador "Mostrando X-Y de Z" + botones Anterior/Siguiente
6. Importar `ScrollArea` y `Button`

