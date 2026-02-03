
# Plan: Corrección del Diseño del Login

## Problema Identificado

Los estilos globales de tipografía en `index.css` están aplicando tamaños demasiado grandes a los elementos `h1`, `h2`, `h3`, etc. de forma global. Esto causa que el título "Iniciar sesión" (que es un `h2` con clase `text-2xl`) se vea enorme porque los estilos base lo sobreescriben a `text-3xl lg:text-4xl`.

### Código problemático actual (index.css, líneas 124-147):
```css
h1 {
  @apply text-4xl lg:text-5xl font-semibold tracking-tight;
}
h2 {
  @apply text-3xl lg:text-4xl font-semibold tracking-tight;
}
h3 {
  @apply text-2xl lg:text-3xl font-semibold tracking-tight;
}
...
```

Estos estilos se aplican a **todos** los encabezados del sitio sin posibilidad de personalización, lo cual rompe layouts específicos como el formulario de autenticación.

---

## Solución

Eliminar los estilos globales de tipografía del `@layer base` y en su lugar crear clases utilitarias opcionales que se puedan aplicar cuando se necesiten tamaños grandes.

### Cambios a realizar:

**1. Actualizar `src/index.css`:**
- Eliminar las reglas globales de `h1` a `h6` del `@layer base`
- Crear clases utilitarias opcionales como `.heading-1`, `.heading-2`, etc. en `@layer utilities`

**2. Resultado esperado:**
- Los títulos de formularios mantendrán sus tamaños definidos (`text-2xl`)
- Las páginas que necesiten títulos grandes pueden usar las clases `.heading-1`, `.heading-2`
- El panel izquierdo del `AuthLayout` ya tiene su propio `text-4xl lg:text-5xl` definido inline

---

## Detalles Técnicos

### Archivo: `src/index.css`

**Eliminar** (líneas 124-147):
```css
/* Tipografía */
h1 {
  @apply text-4xl lg:text-5xl font-semibold tracking-tight;
}
h2 {
  @apply text-3xl lg:text-4xl font-semibold tracking-tight;
}
h3 {
  @apply text-2xl lg:text-3xl font-semibold tracking-tight;
}
h4 {
  @apply text-xl lg:text-2xl font-semibold tracking-tight;
}
h5 {
  @apply text-lg lg:text-xl font-medium;
}
h6 {
  @apply text-base lg:text-lg font-medium;
}
```

**Agregar** (en `@layer utilities`):
```css
/* Tipografía - Clases opcionales para headings grandes */
.heading-1 {
  @apply text-4xl lg:text-5xl font-semibold tracking-tight;
}
.heading-2 {
  @apply text-3xl lg:text-4xl font-semibold tracking-tight;
}
.heading-3 {
  @apply text-2xl lg:text-3xl font-semibold tracking-tight;
}
.heading-4 {
  @apply text-xl lg:text-2xl font-semibold tracking-tight;
}
.heading-5 {
  @apply text-lg lg:text-xl font-medium;
}
.heading-6 {
  @apply text-base lg:text-lg font-medium;
}
```

---

## Impacto

- **Login/Register/Recover**: Se verán correctamente con títulos de tamaño `text-2xl`
- **Panel izquierdo de Auth**: Mantiene su estilo porque tiene clases inline
- **Dashboards y otras páginas**: Pueden usar `.heading-1`, `.heading-2` si necesitan títulos grandes

---

## Verificación

Después del cambio, el formulario de login debería mostrar:
- El título "Iniciar sesión" en un tamaño apropiado
- El subtítulo debajo del título
- Los campos de email y contraseña bien espaciados
- El botón de login alineado correctamente
