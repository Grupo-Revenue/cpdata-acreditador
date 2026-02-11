

## Plan: Agregar campo "Numero de Boleta" ingresado por el usuario

### Contexto

Actualmente existe un `invoice_number` auto-generado (B001, B002...) que sirve como ID interno. El usuario necesita un campo adicional donde el supervisor o acreditador ingrese el numero real de su boleta de honorarios al momento de subirla.

### Cambios

#### 1. Base de datos - Nueva columna

Agregar columna `numero_boleta` (text, nullable) a la tabla `invoices`. Inicia vacia y se llena cuando el usuario sube su boleta.

```text
ALTER TABLE invoices ADD COLUMN numero_boleta text DEFAULT NULL;
```

Actualizar la politica RLS existente "Users can update own file_url" para permitir que los usuarios tambien actualicen `numero_boleta` (la politica actual ya permite UPDATE en la fila completa, solo el codigo frontend limita los campos).

#### 2. InvoicesTable.tsx - Mostrar columna

- Agregar columna "N Boleta" en la tabla entre "ID Boleta" y "Estado"
- Mostrar el valor de `numero_boleta` o "-" si esta vacio
- Agregar el campo al tipo `InvoiceRow`

#### 3. InvoiceEditDialog.tsx - Campo editable

- Agregar estado `numeroBoleta` al dialogo
- Para **supervisores/acreditadores** (no admin): mostrar campo de texto "Numero de boleta" junto al campo de archivo, obligatorio al subir
- Para **admin**: mostrar el campo como editable tambien
- Incluir `numero_boleta` en el payload de update tanto para admin como para no-admin

#### 4. EventTeamDialog.tsx - Sin cambios

La creacion automatica de boletas al asignar equipo ya dejara `numero_boleta` como `null` por defecto, que es el comportamiento deseado.

### Flujo resultante

1. Admin asigna equipo al evento -> se crea registro de boleta con `numero_boleta = null`
2. Supervisor/acreditador abre su boleta -> ve campo "Numero de boleta" + campo archivo
3. Ingresa el numero y sube el archivo -> se actualiza `numero_boleta` y `file_url`
4. En la tabla se muestra el numero ingresado en la columna "N Boleta"

