

## Agregar indicador de accion en la tarjeta de FAQs

### Problema

La tarjeta de Preguntas Frecuentes en el dashboard de acreditador es visualmente llamativa, pero no tiene un texto claro que indique al usuario que debe hacer clic para ver las FAQs.

### Solucion

Agregar un texto de llamada a la accion debajo de la descripcion existente, como "Haz clic para ver" con un icono de flecha, para que el usuario entienda que la tarjeta es interactiva.

### Cambio

| Archivo | Cambio |
|---|---|
| `src/pages/dashboard/AcreditadorDashboard.tsx` | Agregar un texto/boton de accion debajo de "Revisa las respuestas a las dudas mas comunes" |

### Detalle tecnico

En `AcreditadorDashboard.tsx`, dentro del `CardContent` de la tarjeta de FAQs, agregar despues del `<p>` existente:

- Un elemento con texto "Haz clic para ver" o "Ver preguntas" con un icono de flecha (`ChevronRight` o `ArrowRight`) al lado
- Estilo: fondo semi-transparente (`bg-white/20 rounded-full px-4 py-2`), texto blanco, con efecto hover sutil
- Esto refuerza visualmente que la tarjeta es clickeable sin cambiar el diseno general

