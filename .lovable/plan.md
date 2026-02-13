

## Dos mejoras al sistema de firma digital

### 1. Confirmacion antes de firmar

Agregar un dialogo de confirmacion (`ConfirmDialog`) que aparezca cuando el usuario hace clic en "Firmar Contrato". El usuario debera confirmar explicitamente antes de que se registre la firma.

### 2. Descarga en formato PDF

Cambiar todas las descargas de contratos de formato `.txt` a `.pdf`, generando el PDF directamente en el navegador usando la API nativa de `jsPDF`.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/DigitalSignatureDialog.tsx` | Agregar estado `confirmOpen` y renderizar `ConfirmDialog` antes de ejecutar `handleSign`. Cambiar `handleDownload` para generar PDF con `jsPDF` |
| `src/components/events/EventsAdminTable.tsx` | Cambiar `downloadContractsForDeal` y `downloadAllContracts` para generar PDF con `jsPDF` |
| Dependencia nueva: `jspdf` | Instalar para generacion de PDF en el cliente |

### Detalle tecnico

**Confirmacion de firma (`DigitalSignatureDialog.tsx`):**
- Agregar estado `const [confirmOpen, setConfirmOpen] = useState(false)`
- El boton "Firmar Contrato" ahora abre el `ConfirmDialog` en vez de llamar `handleSign` directamente
- El `ConfirmDialog` usa `variant="default"`, titulo "Confirmar firma", descripcion "Esta seguro de que desea firmar este contrato? Esta accion no se puede deshacer."
- Al confirmar en el dialogo, se ejecuta `handleSign`

**Generacion de PDF (ambos archivos):**
- Usar `jsPDF` para crear un documento PDF con el texto del contrato
- Incluir titulo, texto del contrato con saltos de linea automaticos (`doc.splitTextToSize`), y al final los datos de firma (nombre, fecha, hora)
- Nombres de archivo cambian de `.txt` a `.pdf`
- En la descarga masiva del admin, se genera un solo PDF con separadores de pagina entre contratos

