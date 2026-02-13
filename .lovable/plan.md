

## Sistema de Firma Digital y Contratos

### Resumen

Implementar un modulo completo de firma digital que permita:
1. Al **superadmin**: configurar el texto del contrato desde Configuracion
2. Al **acreditador/supervisor**: leer y firmar el contrato desde el boton en Eventos
3. Al **acreditador/supervisor**: descargar su contrato firmado
4. Al **superadmin/administrador**: descargar contratos individuales y masivos

### Nuevas tablas en la base de datos

Se necesita una tabla `digital_signatures` para almacenar las firmas:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid (PK) | Identificador |
| user_id | uuid (FK profiles) | Usuario que firma |
| event_id | uuid (FK events) | Evento asociado |
| contract_text | text | Texto del contrato al momento de firmar (snapshot) |
| signer_name | text | Nombre completo del firmante |
| signed_at | timestamptz | Fecha y hora de la firma |
| created_at | timestamptz | Fecha de creacion |

RLS: usuarios ven sus propias firmas, admins ven todas.

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| **Migracion SQL** | Crear tabla `digital_signatures` con RLS |
| `src/components/settings/DigitalSignatureSettings.tsx` | **Nuevo** - Editor del texto del contrato en settings |
| `src/pages/app/Settings.tsx` | Agregar pestana "Firma Digital" con el nuevo componente |
| `src/components/events/DigitalSignatureDialog.tsx` | **Nuevo** - Dialogo donde el usuario lee el contrato y firma |
| `src/components/events/EventsUserTable.tsx` | Conectar el boton de firma al nuevo dialogo, mostrar estado de firma |
| `src/components/events/EventsAdminTable.tsx` | Agregar boton de descarga de contratos (individual y masivo) |

### Detalle tecnico

**1. Migracion - Tabla `digital_signatures`**

```text
CREATE TABLE public.digital_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contract_text text NOT NULL,
  signer_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propias firmas
CREATE POLICY "Users can view own signatures"
  ON public.digital_signatures FOR SELECT
  USING (user_id = auth.uid());

-- Usuarios pueden insertar su propia firma
CREATE POLICY "Users can insert own signature"
  ON public.digital_signatures FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins acceso completo
CREATE POLICY "Admins full access signatures"
  ON public.digital_signatures FOR ALL
  USING (is_admin(auth.uid()));

-- Admins pueden ver todas
CREATE POLICY "Admins can view all signatures"
  ON public.digital_signatures FOR SELECT
  USING (is_admin(auth.uid()));
```

**2. `DigitalSignatureSettings.tsx`** (Configuracion del superadmin)

- Componente similar a `FaqSettings` pero con un solo campo `Textarea` grande
- Lee/escribe en la tabla `settings` con key `digital_signature_text`
- Permite al superadmin redactar el texto del contrato que veran los usuarios

**3. `Settings.tsx`**

- Agregar una nueva pestana "Firma Digital" en el `TabsList`
- Renderizar `DigitalSignatureSettings` en su `TabsContent`

**4. `DigitalSignatureDialog.tsx`** (Dialogo de firma)

- Recibe `eventId`, `dealName`, `userId` como props
- Carga el texto del contrato desde `settings` (key `digital_signature_text`)
- Muestra el texto en un area de lectura con scroll
- Boton "Firmar Contrato" que:
  - Obtiene nombre y apellido del perfil del usuario
  - Inserta en `digital_signatures` con el texto, nombre completo y timestamp
  - Muestra toast de exito
- Si ya esta firmado, muestra los datos de la firma (nombre, fecha/hora) y boton "Descargar Contrato"
- La descarga genera un archivo de texto/HTML con el contrato, nombre del firmante y fecha

**5. `EventsUserTable.tsx`**

- Reemplazar `handleFirmaDigital` (que solo muestra toast) por apertura del `DigitalSignatureDialog`
- Consultar `digital_signatures` para saber si el usuario ya firmo cada evento
- Si ya firmo: el boton cambia a icono de descarga en vez de firma

**6. `EventsAdminTable.tsx`**

- Agregar un boton de descarga de contrato por fila (icono `Download`) que descarga el contrato firmado del evento
- Agregar un boton global "Descargar Contratos" que genera una descarga masiva de todos los contratos firmados de un evento
- Los contratos se generan como archivos de texto/HTML con el contenido del contrato, nombre del firmante y fecha de firma

### Flujo del usuario

```text
SUPERADMIN                          ACREDITADOR/SUPERVISOR
    |                                       |
    | 1. Escribe texto del contrato         |
    |    en Configuracion > Firma Digital   |
    |                                       |
    |                                       | 2. Ve eventos, estado "Aceptado"
    |                                       |    boton firma habilitado
    |                                       |
    |                                       | 3. Click en boton firma
    |                                       |    Lee el contrato
    |                                       |    Click "Firmar"
    |                                       |    Se guarda: nombre, fecha, hora
    |                                       |
    |                                       | 4. Puede descargar su contrato
    |                                       |
    | 5. Puede descargar contratos          |
    |    individuales o masivos             |
```

