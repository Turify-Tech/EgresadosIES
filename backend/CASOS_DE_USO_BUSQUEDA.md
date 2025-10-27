# 🧪 Casos de Uso para Probar el Motor de Búsqueda

## 📋 **Prerequisitos**
1. Servidor corriendo: `npm run dev` (puerto 3000)
2. Base de datos con datos de prueba cargados

---

## 🔍 **Casos de Uso Básicos**

### **1. Búsqueda sin filtros (todos los perfiles)**
```http
GET http://localhost:3000/api/buscar
```

**Resultado esperado:** Todos los egresados en la BD
**Propósito:** Verificar que la consulta base funciona

---

### **2. Búsqueda por texto libre - Nombre**
```http
GET http://localhost:3000/api/buscar?query=María
```

**Resultado esperado:** Perfiles que contengan "María" en el nombre
**Propósito:** Probar búsqueda en campo nombre

---

### **3. Búsqueda por texto libre - Profesión**
```http
GET http://localhost:3000/api/buscar?query=desarrollador
```

**Resultado esperado:** Perfiles con "desarrollador" en resumen o experiencia
**Propósito:** Probar búsqueda cross-field

---

### **4. Búsqueda por texto libre - Empresa**
```http
GET http://localhost:3000/api/buscar?query=Mercado Libre
```

**Resultado esperado:** Perfiles que trabajaron en Mercado Libre
**Propósito:** Probar búsqueda en experiencias laborales

---

## 🎯 **Casos de Uso con Filtros Específicos**

### **5. Filtro por carrera**
```http
GET http://localhost:3000/api/buscar?carrera=Ingeniería en Sistemas
```

**Resultado esperado:** Solo egresados de Ingeniería en Sistemas
**Propósito:** Probar filtro exacto por carrera

---

### **6. Filtro por situación laboral**
```http
GET http://localhost:3000/api/buscar?situacionLaboral=Empleado
```

**Resultado esperado:** Solo perfiles con situación "Empleado"
**Propósito:** Probar filtro de estado laboral

---

### **7. Filtro por empresa (parcial)**
```http
GET http://localhost:3000/api/buscar?empresa=Microsoft
```

**Resultado esperado:** Perfiles que trabajaron en empresas con "Microsoft"
**Propósito:** Probar búsqueda parcial en empresa

---

### **8. Filtro por puesto**
```http
GET http://localhost:3000/api/buscar?puesto=Frontend
```

**Resultado esperado:** Perfiles con puestos que contengan "Frontend"
**Propósito:** Probar filtro de puesto de trabajo

---

## 🔥 **Casos de Uso Combinados (Avanzados)**

### **9. Búsqueda + Filtro de carrera**
```http
GET http://localhost:3000/api/buscar?query=desarrollador&carrera=Tecnicatura en Programación
```

**Resultado esperado:** Desarrolladores que estudiaron Tecnicatura
**Propósito:** Probar combinación texto + filtro

---

### **10. Múltiples filtros**
```http
GET http://localhost:3000/api/buscar?carrera=Ingeniería en Sistemas&situacionLaboral=Empleado
```

**Resultado esperado:** Ingenieros en Sistemas que están empleados
**Propósito:** Probar múltiples filtros simultáneos

---

### **11. Búsqueda compleja**
```http
GET http://localhost:3000/api/buscar?query=React&empresa=Globant&situacionLaboral=Empleado
```

**Resultado esperado:** Empleados en Globant que trabajen con React
**Propósito:** Probar búsqueda compleja multi-criterio

---

## 🚫 **Casos de Uso de Límites y Errores**

### **12. Búsqueda sin resultados**
```http
GET http://localhost:3000/api/buscar?query=TecnologíaQueNoExiste
```

**Resultado esperado:** Array vacío `{"perfiles": [], "total": 0}`
**Propósito:** Verificar manejo de búsquedas sin resultados

---

### **13. Carrera inexistente**
```http
GET http://localhost:3000/api/buscar?carrera=Carrera Inexistente
```

**Resultado esperado:** Array vacío
**Propósito:** Probar filtros con valores que no existen

---

### **14. Parámetros vacíos**
```http
GET http://localhost:3000/api/buscar?query=&carrera=&empresa=
```

**Resultado esperado:** Todos los perfiles (ignora parámetros vacíos)
**Propósito:** Verificar manejo de parámetros vacíos

---

### **15. Caracteres especiales**
```http
GET http://localhost:3000/api/buscar?query=C%2B%2B
```
*(Nota: %2B%2B = ++ encoded)*

**Resultado esperado:** Búsqueda de "C++" sin errores
**Propósito:** Probar caracteres especiales en URL

---

## 🛠️ **Herramientas para Probar**

### **Opción 1: PowerShell**
```powershell
# Caso básico
Invoke-RestMethod -Uri "http://localhost:3000/api/buscar" -Method GET

# Con parámetros
Invoke-RestMethod -Uri "http://localhost:3000/api/buscar?query=desarrollador" -Method GET
```

### **Opción 2: curl (si está instalado)**
```bash
curl "http://localhost:3000/api/buscar"
curl "http://localhost:3000/api/buscar?query=María&carrera=Ingeniería%20en%20Sistemas"
```

### **Opción 3: Navegador Web**
Simplemente pegar las URLs en el navegador

### **Opción 4: VS Code REST Client**
Crear archivo `test-busqueda.http` con los casos de uso

---

## ✅ **Checklist de Verificación**

Para cada caso de uso, verificar:

- [ ] **Status 200** - La respuesta es exitosa
- [ ] **Estructura correcta** - Tiene `perfiles`, `total`, `parametrosBusqueda`, `timestamp`
- [ ] **Datos coherentes** - Los resultados coinciden con los filtros aplicados
- [ ] **Sin duplicados** - Cada egresado aparece solo una vez
- [ ] **Experiencias agregadas** - Campo `experiencias` muestra todas las experiencias concatenadas
- [ ] **Performance** - Respuesta en tiempo razonable

---

## 🎯 **Casos de Uso por Prioridad**

**Alta prioridad (probar primero):**
- Casos 1, 2, 5, 9

**Media prioridad:**
- Casos 3, 4, 6, 7, 10

**Baja prioridad (edge cases):**
- Casos 12, 13, 14, 15