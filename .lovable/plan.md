

## Boton "Ver Perfil" en tabla de Postulantes

### Resumen

Agregar un boton con icono de "ojo" en la columna de Acciones de la tabla de Postulantes que abre un dialogo de solo lectura mostrando toda la informacion del perfil del usuario, incluyendo su foto de perfil (avatar).

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/EventApplicantsDialog.tsx` | Agregar boton "Ver perfil", estado para el dialogo de perfil, y un nuevo sub-dialogo de visualizacion |

### Detalle tecnico

**1. Ampliar la query de profiles** para traer todos los campos necesarios:
- Cambiar el select de `'id, nombre, apellido, ranking'` a `'id, nombre, apellido, ranking, rut, email, telefono, referencia_contacto, idioma, altura, universidad, carrera, banco, numero_cuenta, tipo_cuenta, foto_url'`

**2. Agregar estado para el perfil seleccionado:**
- `const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null)`

**3. Ampliar la interfaz Applicant** (o crear una interfaz separada para el perfil completo) para incluir todos los campos del perfil que se almacenan en el profileMap.

**4. Agregar boton "Ver perfil"** en la columna Acciones (junto a Aceptar y Rechazar):
- Icono `Eye` de lucide-react
- Al hacer clic, busca el perfil completo en el profileMap y abre el dialogo

**5. Crear sub-dialogo de perfil** (dentro del mismo archivo, como un segundo `Dialog`):
- Avatar con foto de perfil (usando componentes `Avatar`, `AvatarImage`, `AvatarFallback`)
- Nombre completo y rol como encabezado
- Secciones organizadas en grilla de solo lectura:
  - **Cuenta**: RUT, Email
  - **Personal**: Telefono, Referencia de contacto, Idioma, Altura
  - **Academico**: Universidad, Carrera
  - **Bancario**: Banco, Numero de cuenta, Tipo de cuenta
  - **Ranking**: Valor numerico
- Todos los campos son de solo lectura (texto con fondo muted, sin inputs editables)
- Boton "Cerrar" en el footer

### Flujo

```text
Tabla Postulantes
  |-- Columna Acciones
        |-- Boton Eye (Ver perfil)
              |-- Abre Dialog con info completa del usuario
              |-- Avatar + Nombre + Rol
              |-- Datos personales, academicos, bancarios (solo lectura)
              |-- Boton Cerrar
```

