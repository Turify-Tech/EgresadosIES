# Guía de Deploy en Vercel

## Problemas Identificados y Soluciones

### 🔴 Problema 1: CORS Bloqueando Requests
**Causa:** El backend solo acepta requests desde localhost, no desde las URLs de Vercel.

**Solución:** ✅ Ya corregido en `backend/src/app.js` - ahora permite dominios `.vercel.app`

---

### 🔴 Problema 2: Variables de Entorno No Configuradas

## Configuración de Variables de Entorno en Vercel

### **BACKEND (API)**

Ve a: **Vercel Dashboard** → **Tu proyecto backend** → **Settings** → **Environment Variables**

Agrega las siguientes variables (toma los valores de `backend/.env`):

```bash
# Base de datos
DATABASE_URL=libsql://egresadosies-turify.aws-us-east-1.turso.io
DATABASE_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=tu-super-secreto-jwt-muy-seguro-aqui
JWT_EXPIRES_IN=7d

# CORS - ⚠️ IMPORTANTE: Cambia esta URL por la URL real de tu frontend en Vercel
FRONTEND_URL=https://tu-app-frontend.vercel.app

# Email (Brevo)
BREVO_API_KEY=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
EMAIL_FROM_NAME=Egresados IES
EMAIL_FROM_ADDRESS=institutoies9012@gmail.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=djgrfq6oi
CLOUDINARY_API_KEY=975256742522911
CLOUDINARY_API_SECRET=tu-api-secret-aqui

# Admin por defecto
DEFAULT_ADMIN_DNI=00000000
DEFAULT_ADMIN_EMAIL=admin@ies.edu.ar
DEFAULT_ADMIN_PASSWORD=temporal123
DEFAULT_ADMIN_NAME=Administrador

# Entorno
NODE_ENV=production
PORT=3000
```

---

### **FRONTEND**

Ve a: **Vercel Dashboard** → **Tu proyecto frontend** → **Settings** → **Environment Variables**

⚠️ **IMPORTANTE:** En Astro, las variables públicas DEBEN empezar con `PUBLIC_`

```bash
# ⚠️ CAMBIA ESTA URL POR LA URL REAL DE TU BACKEND EN VERCEL
PUBLIC_API_URL=https://tu-app-backend.vercel.app/api

# Configuración del sitio
PUBLIC_SITE_NAME=Sistema de Gestión de Egresados IES
PUBLIC_SITE_DESCRIPTION=Plataforma para gestión y seguimiento de egresados

# ImgBB
PUBLIC_IMGBB_API_KEY=a0d050547832d68853fc714d2b5b41ba

# Configuración
PUBLIC_DEBUG_MODE=false
PUBLIC_SHOW_API_ERRORS=true
PUBLIC_MAX_FILE_SIZE=10485760
PUBLIC_ALLOWED_FILE_EXTENSIONS=pdf,doc,docx
```

---

## Pasos para Deploy Exitoso

### 1. **Backend (API)**

```bash
# 1. Ve al proyecto backend
cd backend

# 2. Asegúrate que los cambios de CORS estén commiteados
git add src/app.js
git commit -m "fix: configurar CORS para producción en Vercel"
git push

# 3. En Vercel:
#    - Ve a tu proyecto backend
#    - Settings → Environment Variables
#    - Agrega TODAS las variables listadas arriba
#    - Deployments → Redeploy el último deployment
```

### 2. **Frontend**

```bash
# 1. Ve al proyecto frontend
cd frontend

# 2. En Vercel:
#    - Ve a tu proyecto frontend
#    - Settings → Environment Variables
#    - Agrega TODAS las variables listadas arriba
#    - ⚠️ ASEGÚRATE que PUBLIC_API_URL apunte a tu backend en Vercel
#    - Deployments → Redeploy el último deployment
```

---

## Verificación Post-Deploy

### 1. **Verificar Backend**

Abre en tu navegador:
```
https://tu-backend.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "OK",
  "message": "Sistema de Gestión de Egresados IES - API funcionando",
  "timestamp": "2026-02-22T...",
  "version": "1.0.0",
  "database": "connected"
}
```

### 2. **Verificar Frontend**

Abre la consola del navegador en tu frontend desplegado:
```
https://tu-frontend.vercel.app
```

Verifica:
- ✅ No hay errores de CORS
- ✅ Las imágenes cargan correctamente
- ✅ Puedes iniciar sesión
- ✅ Las menciones funcionan
- ✅ Los comentarios se muestran

---

## Solución si Siguen los Errores

### Error: "Not allowed by CORS"

1. Verifica en el backend los logs de Vercel
2. Busca líneas como: `⚠️  Origen bloqueado por CORS: https://...`
3. Agrega esa URL específica a `allowedOrigins` en `backend/src/app.js`
4. Redeploy el backend

### Error: "PUBLIC_API_URL is not defined"

1. Ve a Vercel → Frontend → Settings → Environment Variables
2. Asegúrate que `PUBLIC_API_URL` esté configurada
3. El valor debe ser: `https://tu-backend.vercel.app/api` (CON `/api` al final)
4. Redeploy el frontend

### Error: "Failed to fetch"

1. Verifica que el backend esté funcionando: `/api/health`
2. Verifica las variables de entorno del frontend
3. Abre DevTools → Network → Ve qué URL está intentando llamar
4. Compara con tu backend real en Vercel

---

## URLs Importantes

**Backend:** `https://egresados-ies-api.vercel.app`  
**Frontend:** `https://egresados-ies.vercel.app` ← Cambia por tu URL real

**Nota:** Estas URLs son ejemplos, usa las URLs reales que te dio Vercel.

---

## Checklist Final ✅

- [ ] Variables de entorno configuradas en backend
- [ ] Variables de entorno configuradas en frontend
- [ ] `FRONTEND_URL` en backend apunta al frontend real
- [ ] `PUBLIC_API_URL` en frontend apunta al backend real
- [ ] Backend desplegado y `/api/health` responde OK
- [ ] Frontend desplegado y no hay errores de CORS
- [ ] Login funciona
- [ ] Menciones se convierten correctamente
- [ ] Comentarios cargan correctamente
