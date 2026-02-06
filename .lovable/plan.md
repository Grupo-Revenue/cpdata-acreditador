

## Plan: Carga Masiva de Usuarios

### Objetivo
Agregar un boton en la pagina de Gestion de Usuarios que permita cargar multiples usuarios de manera simultanea mediante un archivo CSV o Excel.

---

### Flujo de Usuario

1. El superadmin hace clic en "Cargar Usuarios" (nuevo boton junto a "Crear Usuario")
2. Se abre un dialogo modal con instrucciones y zona para subir archivo
3. El usuario descarga una plantilla CSV de ejemplo (opcional)
4. El usuario sube un archivo CSV con los datos de usuarios
5. El sistema valida los datos y muestra una vista previa
6. El usuario confirma la carga
7. Los usuarios se crean en lote y se muestra el resultado

---

### Estructura del Archivo CSV

| Columna | Requerido | Descripcion |
|---------|-----------|-------------|
| nombre | Si | Nombre del usuario |
| apellido | Si | Apellido del usuario |
| rut | Si | RUT chileno (se validara formato y digito verificador) |
| telefono | Si | Numero de telefono |
| email | Si | Correo electronico (debe ser unico) |

**Notas del CSV:**
- Primera fila: encabezados (se ignora)
- Separador: coma (,) o punto y coma (;)
- Encoding: UTF-8

---

### Validaciones

**Por cada fila del archivo:**
- Nombre y apellido no vacios
- RUT con formato valido y digito verificador correcto
- Email con formato valido
- Telefono no vacio
- RUT y Email no duplicados (en archivo ni en BD)

**Resultado de validacion:**
- Filas validas: listas para crear
- Filas con errores: se muestran los errores especificos

---

### Diseno Visual del Dialogo

```text
+----------------------------------------------------------+
|  Carga Masiva de Usuarios                          [X]   |
|----------------------------------------------------------|
|                                                          |
|  Instrucciones:                                          |
|  Suba un archivo CSV con los datos de los usuarios.      |
|  [Descargar plantilla de ejemplo]                        |
|                                                          |
|  +----------------------------------------------------+  |
|  |                                                    |  |
|  |     Arrastre el archivo aqui o haga clic para     |  |
|  |              seleccionar archivo                   |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Vista previa: (aparece despues de cargar archivo)       |
|  +----------------------------------------------------+  |
|  | Validos: 15  |  Con errores: 3                     |  |
|  +----------------------------------------------------+  |
|  | # | Nombre | Apellido | RUT | Tel | Email | Estado |  |
|  |---|--------|----------|-----|-----|-------|--------|  |
|  | 1 | Juan   | Perez    | ... | ... | ...   | OK     |  |
|  | 2 | Maria  | Lopez    | ... | ... | ...   | Error  |  |
|  |   |        |          | RUT invalido               |  |
|  +----------------------------------------------------+  |
|                                                          |
|                     [Cancelar]  [Crear 15 usuarios]      |
+----------------------------------------------------------+
```

---

### Componentes a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/users/UserBulkUploadDialog.tsx` | Dialogo principal con dropzone y vista previa |
| `src/lib/csv-parser.ts` | Utilidad para parsear CSV y validar datos |
| `supabase/functions/create-users-bulk/index.ts` | Edge Function para creacion masiva |

---

### Modificaciones a Archivos Existentes

| Archivo | Cambio |
|---------|--------|
| `src/pages/app/Users.tsx` | Agregar boton "Cargar Usuarios" y estado del dialogo |

---

### Detalles Tecnicos

**Edge Function `create-users-bulk`:**
- Recibe array de usuarios a crear
- Valida permisos (solo superadmin)
- Procesa usuarios en lote
- Retorna resumen: creados exitosamente, fallidos con errores

**Configuracion por defecto para usuarios creados masivamente:**
- Estado de aprobacion: `approved` (pre-aprobados)
- Rol inicial: `acreditador`
- Contrasena: generada automaticamente (se puede enviar por email o mostrar al final)

---

### Manejo de Contrasenas

Para la carga masiva, las contrasenas se manejaran asi:
- Se genera una contrasena temporal automatica para cada usuario
- Al finalizar la carga, se muestra una tabla descargable con usuario + contrasena temporal
- Los usuarios deberan cambiar su contrasena en el primer inicio de sesion

---

### Ejemplo de Archivo CSV

```text
nombre,apellido,rut,telefono,email
Juan,Perez,12345678-5,+56912345678,juan.perez@ejemplo.com
Maria,Lopez,98765432-1,+56987654321,maria.lopez@ejemplo.com
Pedro,Gonzalez,11222333-4,+56911223344,pedro.gonzalez@ejemplo.com
```

---

### Resumen de Cambios

1. **Nueva Edge Function** para creacion masiva con validaciones
2. **Nuevo dialogo** con dropzone, validacion y vista previa
3. **Utilidad CSV** para parsear y validar datos
4. **Integracion** en la pagina de usuarios existente

