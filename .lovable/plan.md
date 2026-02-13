

## Crear FAQs de ejemplo

### Resumen

Insertar preguntas frecuentes de ejemplo en la tabla `settings` con key `faqs` para visualizar como se ven en el dashboard del acreditador.

### Cambio

Ejecutar un upsert en la tabla `settings` con el key `faqs` y un JSON con 5 preguntas frecuentes de ejemplo relevantes al contexto de acreditadores:

1. **Como me asignan a un evento?** - Explicacion del proceso de asignacion por parte de supervisores/administradores.
2. **Cuando recibo mi pago?** - Informacion sobre el proceso y tiempos de pago.
3. **Que hago si no puedo asistir a un evento asignado?** - Instrucciones para notificar con anticipacion.
4. **Como emito mi boleta de honorarios?** - Pasos para emitir la boleta en el SII siguiendo el modelo de glosa configurado.
5. **Como funciona el ranking?** - Explicacion de como se calcula y que beneficios tiene estar en las primeras posiciones.

### Detalle tecnico

Se usara una migracion SQL para insertar los datos:

```sql
INSERT INTO settings (key, value, description)
VALUES (
  'faqs',
  '[{"pregunta":"¿Cómo me asignan a un evento?","respuesta":"Los supervisores y administradores asignan acreditadores a los eventos según disponibilidad y ubicación. Recibirás una notificación cuando seas asignado a un nuevo evento."},{"pregunta":"¿Cuándo recibo mi pago?","respuesta":"Los pagos se procesan una vez que el evento ha sido completado y tu asistencia ha sido confirmada. El monto se refleja en tu sección de boletas y el pago se realiza según el día de pago configurado por la administración."},{"pregunta":"¿Qué hago si no puedo asistir a un evento asignado?","respuesta":"Debes notificar con la mayor anticipación posible a tu supervisor o al administrador del evento. Puedes hacerlo a través del sistema de soporte creando un ticket o contactando directamente a tu supervisor."},{"pregunta":"¿Cómo emito mi boleta de honorarios?","respuesta":"Ingresa al sitio del SII (sii.cl), emite una boleta de honorarios electrónica usando el modelo de glosa que aparece en tu perfil. Luego sube el comprobante en la sección de Boletas del sistema."},{"pregunta":"¿Cómo funciona el ranking?","respuesta":"El ranking se calcula en base a la cantidad de eventos en los que has participado y tu desempeño general. Estar en las primeras posiciones te da mayor visibilidad y prioridad para ser asignado a futuros eventos."}]',
  'Preguntas frecuentes para acreditadores'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
```

No se requieren cambios en el codigo frontend, solo datos de ejemplo.

