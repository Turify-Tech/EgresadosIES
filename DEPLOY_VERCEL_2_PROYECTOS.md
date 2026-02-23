# 🚀 Guía para Deploy con 2 Proyectos en Vercel

## ❌ Problema Actual

Vercel está desplegando **solo el frontend** porque:
- Vercel detectó Astro automáticamente
- El backend Express **NO se ejecuta**
- Por eso los requests a `/api` fallan con CORS

---

## ✅ Solución: 2 Proyectos Separados

### Proyecto 1: **Frontend** (ya lo tienes)
- Carpeta: `/frontend`
- URL: `https://egresados-ies.vercel.app`
- Sirve la interfaz de usuario

### Proyecto 2: **Backend** (NUEVO - necesitas crear)
- Carpeta: `/backend`
- URL: `https://egresados-ies-api.vercel.app` (o similar)
- Sirve la API REST

---

## 📋 PASOS PARA CONFIGURAR

### **PASO 1: Configurar el Proyecto Frontend Actual**

1. Ve a Vercel Dashboard → `egresados-ies` → Settings → General
2. En **Root Directory** configura: `frontend`
3. En **Build & Development Settings**:
   - Framework Preset: **Astro**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Ve a **Environment Variables** y agrega:
   ```bash
   PUBLIC_API_URL=https://egresados-ies-api.vercel.app/api
   PUBLIC_IMGBB_API_KEY=a0d050547832d68853fc714d2b5b41ba
   PUBLIC_SITE_NAME=Sistema de Gestión de Egresados IES
   ```

5. Click en **Save** y luego **Redeploy**

---

### **PASO 2: Crear el Proyecto Backend**

1. En Vercel Dashboard, click en **"Add New..."** → **Project**

2. Selecciona tu repositorio `EgresadosIES` OTRA VEZ

3. En la configuración:
   - **Project Name:** `egresados-ies-api` (o el nombre que prefieras)
   - **Framework Preset:** Other
   - **Root Directory:** `backend` ⚠️ **MUY IMPORTANTE**

4. En **Build & Development Settings**:
   - Build Command: (dejar vacío)
   - Output Directory: (dejar vacío)  
   - Install Command: `npm install`
   - Development Command: `npm run dev`

5. En **Environment Variables**, agrega TODAS estas:
   ```bash
   # Base de datos
   DATABASE_URL=libsql://egresadosies-turify.aws-us-east-1.turso.io
   DATABASE_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
   
   # JWT
   JWT_SECRET=tu-super-secreto-jwt-muy-seguro-aqui
   JWT_EXPIRES_IN=7d
   
   # CORS - ⚠️ URL del FRONTEND
   FRONTEND_URL=https://egresados-ies.vercel.app
   
   # Email
   BREVO_API_KEY=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
   EMAIL_FROM_NAME=Egresados IES
   EMAIL_FROM_ADDRESS=institutoies9012@gmail.com
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=djgrfq6oi
   CLOUDINARY_API_KEY=975256742522911
   CLOUDINARY_API_SECRET=(tu secret de cloudinary)
   
   # Admin
   DEFAULT_ADMIN_DNI=00000000
   DEFAULT_ADMIN_EMAIL=admin@ies.edu.ar
   DEFAULT_ADMIN_PASSWORD=temporal123
   DEFAULT_ADMIN_NAME=Administrador
   
   # Entorno
   NODE_ENV=production
   PORT=3000
   ```

6. Click en **Deploy**

---

### **PASO 3: Verificar URLs**

Después del deploy, tendrás:

- **Frontend:** `https://egresados-ies.vercel.app`
- **Backend:** `https://egresados-ies-api.vercel.app` (o similar)

**COPIA LA URL DEL BACKEND** que Vercel te asignó.

---

### **PASO 4: Actualizar URL del Backend en el Frontend**

1. Ve al proyecto FRONTEND en Vercel
2. Settings → Environment Variables
3. **Edita** `PUBLIC_API_URL`:
   ```bash
   PUBLIC_API_URL=https://TU-URL-BACKEND.vercel.app/api
   ```
   ⚠️ Usa la URL que copiaste en el paso anterior + `/api` al final

4. Redeploy el frontend

---

### **PASO 5: Verificar que Funciona**

#### Verifica el Backend:
```
https://TU-BACKEND.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "OK",
  "message": "Sistema de Gestión de Egresados IES - API funcionando",
  "database": "Connected"
}
```

#### Verifica el Frontend:
1. Abre `https://egresados-ies.vercel.app`
2. Abre la consola del navegador (F12)
3. **NO** deberías ver errores de CORS
4. El login debería funcionar

---

## 🆘 Si Algo Falla

### Backend no responde en `/api/health`

1. Ve a Vercel → proyecto backend → Deployments
2. Click en el último deployment
3. Ve a **Runtime Logs**
4. Busca errores (especialmente de base de datos)

### Frontend sigue con CORS errors

1. Verifica que `PUBLIC_API_URL` tenga la URL correcta
2. Verifica que `FRONTEND_URL` en el backend tenga la URL del frontend
3. Redeploy ambos proyectos

### Error: "módulo no encontrado"

En el backend, verifica que `package.json` tenga:
```json
{
  "type": "module",
  "main": "src/app.js"
}
```

---

## 📊 Diagrama de Cómo Funciona

```
Usuario
   ↓
Frontend (egresados-ies.vercel.app)
   ↓ fetch a /api
Backend (egresados-ies-api.vercel.app/api)
   ↓
Base de datos Turso
```

---

## ✅ Checklist Final

- [ ] Proyecto frontend configurado con Root Directory = `frontend`
- [ ] Proyecto backend NUEVO creado con Root Directory = `backend`
- [ ] Variables de entorno configuradas en AMBOS proyectos
- [ ] `PUBLIC_API_URL` en frontend apunta al backend correcto
- [ ] `FRONTEND_URL` en backend apunta al frontend correcto
- [ ] `/api/health` responde OK en el backend
- [ ] Frontend carga sin errores de CORS
- [ ] Login funciona correctamente

---

## 💡 Ventajas de Esta Configuración

✅ Cada parte se despliega independientemente
✅ Puedes actualizar frontend sin tocar backend y viceversa
✅ Logs separados para debugging  
✅ Variables de entorno aisladas
✅ Escalabilidad independiente

---

## 🔧 Comandos Git

Después de hacer estos cambios:

```bash
git add .
git commit -m "fix: configurar estructura para deploy separado en Vercel"
git push
```

Vercel detectará el push y redesplegará automáticamente.
