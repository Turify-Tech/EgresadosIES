# Fix: Error en redirección al seleccionar "Contactar por Gmail"

**Fecha:** 26 de enero de 2026  
**Rama:** `fix/gmail-contact-body-encoding`

## 📝 Descripción del Problema

Al seleccionar la opción "Contactar por Gmail" en el perfil de un egresado, el sistema redirigía a Gmail con un correo que contenía caracteres inválidos `\n\n` en el cuerpo del mensaje en lugar de saltos de línea reales.

### Causa Raíz

En el archivo [perfil/[id].astro](../src/pages/perfil/[id].astro#L958), el enlace de Gmail estaba construido con un **doble escape** de caracteres de salto de línea (`\\n\\n`) en lugar de usar el escape simple (`\n\n`).

```javascript
// ❌ Código incorrecto
&body=${encodeURIComponent('Hola ' + (profile.nombre || '') + ',\\n\\n')}
```

Esto causaba que JavaScript no interpretara los saltos de línea correctamente, y en su lugar enviaba los caracteres literales `\n\n` al cuerpo del correo.

## 🔧 Solución Implementada

Se corrigió el escape de caracteres en la construcción del enlace de Gmail:

```javascript
// ✅ Código corregido
&body=${encodeURIComponent('Hola ' + (profile.nombre || '') + ',\n\n')}
```

### Cambios realizados

**Archivo modificado:** [frontend/src/pages/perfil/[id].astro](../src/pages/perfil/[id].astro#L958)

- **Línea 958:** Se cambió `\\n\\n` por `\n\n` en el parámetro `body` del enlace de Gmail
- Se mantiene el uso de `encodeURIComponent()` para asegurar el encoding correcto del URL
- No se realizaron cambios en la estructura ni en la lógica del componente

## ✅ Resultado

Ahora al hacer clic en "Contactar por Gmail":

1. ✅ Se abre correctamente el compositor de Gmail
2. ✅ El asunto se muestra como: "Contacto desde Portal de Egresados"
3. ✅ El cuerpo del correo contiene saltos de línea reales en lugar de `\n\n`
4. ✅ El mensaje se formatea correctamente: "Hola [Nombre]," seguido de dos saltos de línea
5. ✅ El comportamiento es consistente para todos los egresados

## 🔍 Verificación

Se verificó que no existen otros lugares en el código del frontend con el mismo problema de doble escape en caracteres de salto de línea.

## 📚 Notas Técnicas

### Diferencia entre `\n` y `\\n` en template literals

- **`\n`**: JavaScript interpreta esto como un salto de línea real (carácter ASCII 10)
- **`\\n`**: JavaScript interpreta esto como los dos caracteres literales: `\` seguido de `n`

### Encoding en URLs de Gmail

El uso de `encodeURIComponent()` es correcto y necesario para:
- Convertir saltos de línea (`\n`) en `%0A` para URLs
- Escapar caracteres especiales en el nombre y otros parámetros
- Asegurar compatibilidad con el estándar de URLs

### Formato del enlace de Gmail

```
https://mail.google.com/mail/?view=cm&fs=1&to={email}&su={subject}&body={body}
```

Parámetros:
- `view=cm`: Abre el compositor de mensajes
- `fs=1`: Fullscreen mode
- `to`: Dirección de email del destinatario
- `su`: Asunto del correo (debe estar encoded)
- `body`: Cuerpo del correo (debe estar encoded)

## 🎯 Alcance del Fix

✅ **Incluido:**
- Corrección del encoding de saltos de línea en enlace de Gmail
- Verificación de consistencia en todo el frontend

❌ **No incluido:**
- Cambios en datos del egresado
- Cambios en backend
- Envío automático de correos
- Modificaciones en otros sistemas de contacto

## 🧪 Testing

Para probar la corrección:

1. Acceder al perfil de un egresado con email configurado
2. Hacer clic en el botón "Contactar por Gmail"
3. Verificar que Gmail abre con el formato correcto del mensaje
4. Confirmar que no aparecen caracteres `\n\n` en el cuerpo del correo

---

**Estado:** ✅ Completado  
**Archivos modificados:** 1  
**Líneas modificadas:** 1
