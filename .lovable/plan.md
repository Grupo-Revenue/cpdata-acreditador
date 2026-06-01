## Problema

El diálogo `InvoiceEditDialog` no limita su alto al viewport, por lo que en pantallas normales el contenido se corta y no se puede hacer scroll dentro del modal (solo bajando el zoom del navegador se ve completo).

## Solución

Editar `src/components/invoices/InvoiceEditDialog.tsx` (línea 160):

- Cambiar `DialogContent` para que tenga alto máximo y scroll vertical interno:
  - `className="max-w-lg max-h-[90vh] overflow-y-auto"`
- Mantener `DialogFooter` dentro del flujo (scrolleable junto con el contenido) para mantener la solución mínima. Si se prefiere footer fijo, se puede convertir luego a layout flex con `flex flex-col` + body `overflow-y-auto` + footer sticky, pero no es necesario para resolver el problema.

## Verificación

Abrir una boleta → botón Editar → el panel debe verse completo a zoom normal y permitir scroll interno hasta los botones de acción.

No hay cambios de lógica ni de backend.