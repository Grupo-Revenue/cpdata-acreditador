

## Formato profesional del contrato de prestacion de servicios

### Resumen

Actualizar el sistema de firma digital para que el texto del contrato siga el formato del documento "ACUERDO DE PRESTACION DE SERVICIOS OCASIONALES" proporcionado. El contrato usara variables/placeholders que se reemplazan automaticamente con los datos del usuario y del evento al momento de mostrar y firmar.

### Cambios principales

**1. Variables dinamicas en el contrato**

El superadmin escribira el texto del contrato usando placeholders entre llaves dobles que se reemplazan automaticamente:

| Variable | Se reemplaza con |
|---|---|
| `{{NOMBRE_ESTUDIANTE}}` | Nombre y apellido del usuario |
| `{{RUT_ESTUDIANTE}}` | RUT del usuario |
| `{{CARRERA}}` | Carrera del usuario |
| `{{UNIVERSIDAD}}` | Universidad del usuario |
| `{{TELEFONO}}` | Telefono del usuario |
| `{{EVENTO}}` | Nombre del evento |
| `{{LOCACION}}` | Ubicacion del evento |
| `{{FECHA_EVENTO}}` | Fecha del evento |
| `{{HORARIO}}` | Horario del evento |
| `{{FECHA_FIRMA}}` | Fecha actual al firmar |

**2. Texto por defecto del contrato**

En la configuracion de firma digital, agregar un boton "Cargar plantilla por defecto" que precargue el textarea con el texto del documento proporcionado (adaptado con los placeholders).

**3. PDF con formato profesional**

Mejorar la generacion del PDF para que se vea como un documento legal formal:
- Encabezado centrado "CP DATA OPTIMUM"
- Titulo centrado "ACUERDO DE PRESTACION DE SERVICIOS OCASIONALES"
- Subtitulo con el nombre del estudiante
- Cuerpo del contrato con clausulas numeradas
- Bloque de firmas al final con dos columnas (empresa y estudiante)
- Seccion "Importante" al pie

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/settings/DigitalSignatureSettings.tsx` | Agregar boton "Cargar plantilla por defecto", agregar lista de variables disponibles como referencia visual |
| `src/components/events/DigitalSignatureDialog.tsx` | Implementar funcion de reemplazo de placeholders con datos reales del perfil y evento. Mejorar generacion de PDF con formato profesional (encabezado, titulo, clausulas, bloque de firmas) |
| `src/components/events/EventsAdminTable.tsx` | Aplicar el mismo formato profesional de PDF en las descargas de admin |

### Detalle tecnico

**Funcion de reemplazo de variables:**

Se creara una funcion `replaceContractVariables` que recibe el texto del contrato y un objeto con los datos del usuario/evento, y reemplaza todos los `{{VARIABLE}}` con sus valores correspondientes. Los datos se obtienen del perfil del usuario (`profiles`) y del evento (`events`).

**Formato del PDF mejorado:**

```text
[Centrado] CP DATA OPTIMUM
[Centrado] ACUERDO DE PRESTACION DE SERVICIOS OCASIONALES
[Centrado] [NOMBRE DEL ESTUDIANTE]

[Cuerpo del contrato con texto justificado y clausulas numeradas]

[Linea]                    [Linea]
pp. CP DATA OPTIMUM       ESTUDIANTE
CHILE S.A

[Seccion Importante si existe]

---
Firmado digitalmente el [fecha] a las [hora]
```

**Datos del perfil necesarios para los placeholders:**

Se ampliara la consulta al perfil del usuario para incluir: `nombre`, `apellido`, `rut`, `carrera`, `universidad`, `telefono`.

Los datos del evento se obtendran de la tabla `events` usando el `hubspot_deal_id`: `name`, `location`, `event_date`, y del deal de HubSpot: `hora_de_inicio_y_fin_del_evento`, `locacion_del_evento`.

