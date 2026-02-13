

## Mejorar el diseño del editor de FAQs

### Problema

El boton de eliminar (icono de basura) esta posicionado de forma absoluta (`absolute top-2 right-2`) sobre cada tarjeta de FAQ, lo que causa que se superponga con los campos de texto y se vea desordenado.

### Solucion

Redisenar cada tarjeta de FAQ para usar un layout con header organizado que incluya un numero de pregunta y el boton de eliminar alineados en la misma fila, seguido de los campos de entrada.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/settings/FaqSettings.tsx` | Redisenar el layout de cada FAQ card |

### Detalle tecnico

En `FaqSettings.tsx`, reemplazar el layout actual de cada FAQ (div con `relative` y boton `absolute`) por:

1. Un **header** con `flex items-center justify-between` que contenga:
   - Etiqueta "Pregunta N" a la izquierda (texto pequeno en muted)
   - Boton de eliminar a la derecha, alineado naturalmente en el flow
2. Los campos `Input` (pregunta) y `Textarea` (respuesta) debajo, sin necesidad de padding extra para evitar el boton
3. Eliminar `relative` del contenedor y `absolute` del boton

Esto mantiene el boton de eliminar visible y accesible sin superponerse a los campos de texto.

