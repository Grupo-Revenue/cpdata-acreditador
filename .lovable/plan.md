

## Corregir caracteres "%%" en el PDF

### Problema

Los separadores `─────────────────────────────────────` usan el caracter Unicode U+2500 (box-drawing), que no es soportado por la fuente por defecto de jsPDF. Al no poder renderizarlo, lo muestra como `%%`.

### Solucion

Reemplazar los caracteres `─` por guiones simples `-` o guiones bajos `_` que si son soportados por la fuente por defecto, o mejor aun, usar `doc.line()` para dibujar una linea grafica real en el PDF.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/DigitalSignatureDialog.tsx` | Reemplazar `doc.text('─────...')` por `doc.line()` para dibujar una linea horizontal |
| `src/components/events/EventsAdminTable.tsx` | Mismo cambio en `downloadContractsForDeal` y `downloadAllContracts` |

### Detalle tecnico

En ambos archivos, reemplazar las lineas:
```text
doc.text('─────────────────────────────────────', 20, y);
```

Por lineas graficas usando la API de dibujo de jsPDF:
```text
doc.setDrawColor(0);
doc.setLineWidth(0.5);
doc.line(20, y, 190, y);
```

Esto dibuja una linea horizontal real en el PDF, que se ve profesional y no depende de caracteres Unicode.

