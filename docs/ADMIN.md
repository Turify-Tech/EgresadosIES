# Manual de Administrador - Sistema de Gestión de Egresados IES

Guía completa para administradores del Sistema de Gestión de Egresados del Instituto de Educación Superior.

## 🎯 Introducción

Este manual está dirigido a los administradores del sistema, quienes son responsables de:

- Gestionar usuarios (egresados y otros administradores)
- Supervisar el contenido del sistema
- Generar reportes y estadísticas
- Configurar parámetros del sistema
- Mantener la seguridad y funcionamiento

## 🔐 Acceso al Sistema

### Inicio de Sesión

1. **Acceder al sistema:** Navegar a la URL principal
2. **Ir al login:** Hacer clic en "Iniciar Sesión"
3. **Seleccionar tipo:** Elegir "Administrador"
4. **Credenciales:** Ingresar email y contraseña de administrador
5. **Acceso:** Automáticamente serás redirigido al panel administrativo

### Primer Acceso

Si es tu primer acceso al sistema:

1. Usar las credenciales proporcionadas por el administrador principal
2. Cambiar la contraseña inmediatamente
3. Verificar que tu perfil tenga los permisos correctos
4. Familiarizarte con el panel de administración

## 🏠 Panel de Administración

### Dashboard Principal

El dashboard muestra un resumen ejecutivo del sistema:

#### Métricas Principales
- **Total de Egresados:** Número total de usuarios registrados
- **Egresados Activos:** Usuarios que han accedido en los últimos 30 días
- **Perfiles Completos:** Egresados con información completa
- **CVs Subidos:** Egresados que han cargado su currículum

#### Gráficos y Estadísticas
- **Registros por Mes:** Evolución de nuevos registros
- **Egresados por Carrera:** Distribución por programa académico
- **Actividad Reciente:** Últimas acciones realizadas en el sistema

#### Alertas y Notificaciones
- Usuarios pendientes de activación
- Reportes de problemas técnicos
- Alertas de seguridad

### Navegación

El menú principal incluye:

```
📊 Dashboard
👥 Gestión de Usuarios
   ├── Lista de Egresados
   ├── Lista de Administradores
   ├── Usuarios Pendientes
   └── Usuarios Inactivos

📈 Reportes y Estadísticas
   ├── Estadísticas Generales
   ├── Reportes de Empleabilidad
   ├── Análisis por Carrera
   └── Exportar Datos

⚙️ Configuración
   ├── Configuración General
   ├── Gestión de Carreras
   ├── Configuración de Email
   └── Configuración de Seguridad

🔧 Herramientas
   ├── Carga Masiva de DNIs
   ├── Backup y Restauración
   ├── Logs del Sistema
   └── Mantenimiento
```

## 👥 Gestión de Usuarios

### Lista de Egresados

#### Visualización
- **Tabla principal:** Muestra nombre, email, carrera, año de egreso, estado
- **Filtros disponibles:**
  - Por carrera
  - Por año de egreso
  - Por estado (activo/inactivo)
  - Por completitud del perfil
- **Búsqueda:** Por nombre, email o DNI
- **Paginación:** 20 usuarios por página (configurable)

#### Acciones Disponibles

**Ver Perfil:**
```
1. Hacer clic en el nombre del egresado
2. Se abre el perfil completo con todas las secciones:
   - Datos personales
   - Experiencia laboral
   - Formación académica
   - Cursos y certificaciones
   - CV descargable (si está disponible)
```

**Editar Usuario:**
```
1. Hacer clic en el ícono de edición
2. Modificar campos permitidos:
   - Nombre completo
   - Email (verificar que no esté duplicado)
   - Teléfono
   - Estado (activo/inactivo)
3. Guardar cambios
```

**Activar/Desactivar:**
```
1. Usar el toggle de estado en la lista
2. Confirmar la acción
3. El usuario recibirá notificación del cambio de estado
```

**Eliminar Usuario:**
```
⚠️ ACCIÓN IRREVERSIBLE
1. Hacer clic en el ícono de eliminación
2. Confirmar escribiendo "ELIMINAR"
3. Todos los datos asociados serán eliminados permanentemente
```

### Crear Nuevo Usuario

#### Proceso Manual

1. **Acceder:** Botón "Nuevo Usuario" en la lista de egresados
2. **Datos básicos:**
   ```
   - Nombre completo (obligatorio)
   - Email único (obligatorio)
   - DNI (verificar en lista de DNIs válidos)
   - Carrera (seleccionar de lista)
   - Año de egreso
   ```

3. **Configuración inicial:**
   ```
   - Generar contraseña temporal
   - Enviar email de bienvenida (opcional)
   - Estado inicial: Activo
   ```

4. **Confirmación:** El sistema enviará credenciales al email proporcionado

#### Carga Masiva

Para crear múltiples usuarios simultáneamente:

1. **Preparar archivo CSV:**
   ```csv
   nombre,email,dni,carrera,anio_egreso
   Juan Pérez,juan@email.com,12345678,Desarrollo de Software,2023
   María García,maria@email.com,87654321,Diseño Gráfico,2023
   ```

2. **Subir archivo:**
   - Ir a "Herramientas" → "Carga Masiva"
   - Seleccionar archivo CSV
   - Validar datos preliminares
   - Confirmar importación

3. **Revisión:** Verificar usuarios creados y resolver errores si los hay

### Gestión de DNIs Válidos

#### Importar Lista de DNIs

El sistema requiere que los DNIs estén en una lista autorizada para registro:

1. **Preparar archivo de DNIs:**
   ```
   - Formato: Un DNI por línea
   - Sin puntos ni espacios
   - Ejemplo:
     12345678
     87654321
     11223344
   ```

2. **Cargar archivo:**
   ```
   1. Ir a "Herramientas" → "Carga Masiva de DNIs"
   2. Seleccionar archivo de texto
   3. Revisar DNIs a importar
   4. Confirmar importación
   ```

3. **Gestión de la lista:**
   - Ver lista actual de DNIs válidos
   - Agregar DNIs individuales
   - Eliminar DNIs (solo si no están asociados a usuarios)
   - Buscar DNI específico

#### Validación de DNIs

Cuando un egresado intenta registrarse:
1. El sistema verifica que el DNI esté en la lista autorizada
2. Si no está, muestra mensaje de error
3. El egresado debe contactar administración para ser agregado

## 📊 Reportes y Estadísticas

### Estadísticas Generales

#### Dashboard de Métricas

**Métricas de Usuarios:**
- Total de egresados registrados
- Usuarios activos (último mes)
- Nuevos registros (período seleccionado)
- Perfiles completados

**Métricas Académicas:**
- Distribución por carreras
- Egresados por año
- Tasa de completitud de perfiles

**Métricas de Actividad:**
- Logins por período
- CVs subidos
- Perfiles actualizados

#### Filtros y Períodos

```
Períodos disponibles:
- Último mes
- Últimos 3 meses
- Último año
- Período personalizado

Filtros aplicables:
- Por carrera específica
- Por año de egreso
- Por estado del usuario
- Por ubicación geográfica
```

### Reportes de Empleabilidad

#### Datos de Empleo

**Información recopilada:**
- Estado laboral actual
- Sector de empleo
- Tipo de empresa (pública/privada)
- Rango salarial
- Ubicación del trabajo
- Relación con la carrera estudiada

**Visualizaciones:**
- Gráfico de torta: Empleados vs. Desempleados
- Gráfico de barras: Sectores laborales
- Mapa: Distribución geográfica
- Línea de tiempo: Evolución del empleo

#### Generar Reportes

1. **Configurar parámetros:**
   ```
   - Período a analizar
   - Carreras a incluir
   - Formato de salida (PDF/Excel)
   - Nivel de detalle
   ```

2. **Personalizar contenido:**
   ```
   - Resumen ejecutivo
   - Gráficos estadísticos
   - Tablas de datos
   - Análisis comparativo
   ```

3. **Exportar y compartir:**
   ```
   - Descargar archivo generado
   - Enviar por email
   - Publicar en portal (opcional)
   ```

### Análisis por Carrera

#### Métricas Específicas

Para cada carrera se puede analizar:

**Rendimiento Académico:**
- Número de graduados por período
- Tiempo promedio de graduación
- Tasa de abandono

**Inserción Laboral:**
- Tiempo promedio para conseguir empleo
- Sectores de mayor demanda
- Salarios promedio por nivel de experiencia

**Satisfacción:**
- Encuestas de seguimiento
- Evaluación de la formación recibida
- Sugerencias de mejora

#### Comparativas

```
Comparar carreras por:
- Empleabilidad
- Salarios promedio
- Sectores laborales
- Distribución geográfica
- Satisfacción con la formación
```

### Exportación de Datos

#### Formatos Disponibles

**PDF (Reportes visuales):**
- Incluye gráficos y charts
- Diseño profesional
- Ideal para presentaciones

**Excel (Datos para análisis):**
- Datos en bruto
- Tablas pivotantes
- Fórmulas incluidas
- Ideal para análisis adicional

**CSV (Integración con otros sistemas):**
- Formato universal
- Fácil importación
- Procesamiento automatizado

#### Programación de Reportes

```
Configurar reportes automáticos:
1. Seleccionar tipo de reporte
2. Definir frecuencia (diaria/semanal/mensual)
3. Configurar destinatarios
4. Establecer filtros y parámetros
5. Activar programación
```

## ⚙️ Configuración del Sistema

### Configuración General

#### Parámetros Básicos

**Información de la Institución:**
```
- Nombre oficial
- Logo institucional
- Colores corporativos
- Información de contacto
- Redes sociales
```

**Configuración de Registro:**
```
- Requiere validación de DNI: Sí/No
- Registro abierto: Sí/No
- Campos obligatorios en registro
- Mensaje de bienvenida personalizado
```

**Límites del Sistema:**
```
- Tamaño máximo de archivos CV: 10MB
- Formatos permitidos: PDF, DOC, DOCX
- Máximo de intentos de login: 5
- Tiempo de sesión: 24 horas
```

### Gestión de Carreras

#### Agregar Nueva Carrera

```
1. Ir a "Configuración" → "Gestión de Carreras"
2. Hacer clic en "Nueva Carrera"
3. Completar información:
   - Nombre oficial
   - Código interno
   - Duración en años
   - Modalidad (presencial/virtual/mixta)
   - Estado (activa/inactiva)
4. Guardar cambios
```

#### Modificar Carrera Existente

```
⚠️ Cuidado: Los cambios afectan a todos los egresados asociados

Campos modificables:
- Nombre (se actualiza en todos los perfiles)
- Estado (activa/inactiva)
- Información descriptiva

Campos no modificables:
- Código interno (para mantener consistencia)
```

#### Desactivar Carrera

```
Casos de uso:
- Carrera discontinuada
- Fusión con otra carrera
- Cambio de denominación

Proceso:
1. Cambiar estado a "Inactiva"
2. La carrera no aparecerá para nuevos registros
3. Egresados existentes mantienen la asociación
4. Se puede reactivar si es necesario
```

### Configuración de Email

#### Servidor SMTP

**Configuración básica:**
```
Host SMTP: smtp.gmail.com (ejemplo)
Puerto: 587
Seguridad: STARTTLS
Usuario: email@ies.edu.ar
Contraseña: contraseña_de_aplicación
```

**Configuración avanzada:**
```
Pool de conexiones: Habilitado
Timeout: 30 segundos
Rate limiting: 100 emails/hora
Queue size: 50 emails
```

#### Plantillas de Email

**Email de bienvenida:**
```html
Asunto: Bienvenido al Sistema de Egresados IES

Hola {{nombre}},

Tu cuenta ha sido creada exitosamente.

Credenciales de acceso:
Email: {{email}}
Contraseña temporal: {{password}}

Ingresa en: {{url_sistema}}

Saludos,
Equipo IES
```

**Reset de contraseña:**
```html
Asunto: Recuperación de contraseña

Hola {{nombre}},

Haz clic en el siguiente enlace para restablecer tu contraseña:
{{url_reset}}

El enlace expira en 1 hora.

Si no solicitaste este cambio, ignora este email.
```

**Notificaciones administrativas:**
```html
Asunto: Nuevo usuario registrado

Se ha registrado un nuevo usuario:

Nombre: {{nombre}}
Email: {{email}}
Carrera: {{carrera}}
Fecha: {{fecha}}

Revisar en: {{url_admin}}
```

#### Configurar Notificaciones

```
Eventos que generan emails:
☑️ Nuevo usuario registrado
☑️ Perfil completado
☑️ CV subido
☑️ Usuario inactivo por 30 días
☑️ Errores del sistema
☐ Login desde nueva ubicación
☐ Cambios en el perfil
☐ Backup completado
```

### Configuración de Seguridad

#### Políticas de Contraseña

```
Configuración actual:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 número
- Al menos 1 carácter especial
- No debe coincidir con datos personales
- Expiración: 90 días (configurable)
```

#### Rate Limiting

```
Límites por IP:
- API: 100 requests/15 minutos
- Login: 5 intentos/15 minutos
- Upload: 10 archivos/hora
- Registro: 3 intentos/día
```

#### Sesiones

```
Configuración de sesiones:
- Duración: 24 horas
- Renovación automática: Habilitada
- Logout automático por inactividad: 2 horas
- Sesiones concurrentes: 3 por usuario
```

#### Logs de Seguridad

```
Eventos registrados:
- Intentos de login fallidos
- Cambios de contraseña
- Accesos desde IPs no reconocidas
- Modificaciones de perfiles por admin
- Eliminación de usuarios
- Cambios en configuración
```

## 🔧 Herramientas de Administración

### Backup y Restauración

#### Backup Automático

```
Configuración actual:
- Frecuencia: Diario a las 2:00 AM
- Retención: 30 días
- Incluye: Base de datos + archivos subidos
- Ubicación: Almacenamiento en la nube
- Notificación: Email al completar
```

#### Backup Manual

```
Proceso:
1. Ir a "Herramientas" → "Backup y Restauración"
2. Hacer clic en "Crear Backup"
3. Seleccionar componentes:
   ☑️ Base de datos
   ☑️ Archivos CV
   ☑️ Configuración
4. Confirmar operación
5. Descargar archivo de backup
```

#### Restauración

```
⚠️ PROCESO CRÍTICO - Requiere confirmación adicional

Pasos:
1. Detener servicios (automático)
2. Seleccionar archivo de backup
3. Validar integridad
4. Confirmar restauración
5. Reiniciar servicios
6. Verificar funcionamiento
```

### Logs del Sistema

#### Tipos de Logs

**Logs de Aplicación:**
```
- Errores de ejecución
- Warnings de rendimiento
- Información de debug
- Transacciones importantes
```

**Logs de Acceso:**
```
- Requests HTTP
- Endpoints utilizados
- Tiempos de respuesta
- IPs de origen
```

**Logs de Seguridad:**
```
- Intentos de autenticación
- Cambios de permisos
- Accesos no autorizados
- Modificaciones de datos sensibles
```

#### Visualización de Logs

```
Filtros disponibles:
- Por fecha/hora
- Por nivel (Error/Warning/Info/Debug)
- Por usuario
- Por IP
- Por endpoint

Funciones:
- Búsqueda de texto
- Exportar a archivo
- Alerta en tiempo real
- Gráficos de tendencias
```

### Mantenimiento

#### Tareas de Mantenimiento

**Limpieza Automática:**
```
Programada semanalmente:
- Eliminar archivos temporales
- Limpiar logs antiguos (>90 días)
- Optimizar base de datos
- Verificar integridad de archivos
```

**Limpieza Manual:**
```
Herramientas disponibles:
- Eliminar usuarios inactivos (>1 año)
- Limpiar archivos huérfanos
- Reindexar base de datos
- Verificar enlaces rotos
```

#### Monitoreo del Sistema

**Métricas de Rendimiento:**
```
Dashboard en tiempo real:
- CPU usage
- Memoria RAM
- Espacio en disco
- Conexiones de BD
- Tiempo de respuesta promedio
```

**Alertas Configuradas:**
```
Se envía notificación cuando:
- CPU > 80% por 5 minutos
- RAM > 85% por 10 minutos
- Disco < 10% libre
- BD con >100 conexiones concurrentes
- Tiempo de respuesta > 5 segundos
```

## 🚨 Procedimientos de Emergencia

### Problemas Comunes

#### Usuario No Puede Acceder

**Diagnóstico:**
```
1. Verificar estado del usuario (activo/inactivo)
2. Revisar bloqueos por intentos fallidos
3. Confirmar email registrado
4. Verificar configuración de servidor
```

**Soluciones:**
```
- Reactivar usuario si está inactivo
- Desbloquear IP si tiene rate limiting
- Generar nueva contraseña temporal
- Verificar logs de errores
```

#### Sistema Lento

**Causas posibles:**
```
- Alto volumen de usuarios concurrentes
- Consultas de BD ineficientes
- Archivos grandes siendo procesados
- Problemas de conectividad
```

**Acciones inmediatas:**
```
1. Revisar métricas de rendimiento
2. Identificar consultas lentas en BD
3. Verificar espacio en disco
4. Reiniciar servicios si es necesario
```

#### Error en Subida de Archivos

**Verificaciones:**
```
- Espacio disponible en servidor
- Permisos de directorio uploads
- Configuración de límites de archivo
- Conectividad del usuario
```

### Contacto de Soporte

#### Soporte Técnico Interno

```
Administrador Principal:
Email: admin@ies.edu.ar
Teléfono: +54 11 1234-5678
Horario: Lunes a Viernes 9-18hs

Soporte Técnico:
Email: soporte@ies.edu.ar
Horario: 24/7 para emergencias críticas
```

#### Escalamiento de Problemas

```
Nivel 1 - Problemas menores:
- Resolver según procedimientos
- Documentar en sistema de tickets

Nivel 2 - Problemas moderados:
- Contactar soporte técnico
- Implementar soluciones temporales

Nivel 3 - Problemas críticos:
- Sistema inaccesible
- Pérdida de datos
- Brecha de seguridad
→ Contacto inmediato con desarrollo
```

## 📚 Recursos Adicionales

### Documentación Técnica

- [Documentación de API](API.md)
- [Guía de Instalación](INSTALACION.md)
- [Manual de Usuario](USER.md)
- [Guía de Deployment](DEPLOYMENT.md)

### Capacitación

#### Para Nuevos Administradores

```
Programa de inducción:
1. Familiarización con el sistema (2 horas)
2. Gestión básica de usuarios (1 hora)
3. Generación de reportes (1 hora)
4. Procedimientos de seguridad (30 min)
5. Manejo de emergencias (30 min)
```

#### Actualizaciones

```
Cuando hay nuevas versiones:
- Revisión de changelog
- Demostración de nuevas funcionalidades
- Actualización de procedimientos
- Preguntas y respuestas
```

### Contacto

- **Email de soporte:** soporte@ies.edu.ar
- **Documentación:** [GitHub Repository](https://github.com/Turify-Tech/EgresadosIES)
- **Issues técnicos:** [GitHub Issues](https://github.com/Turify-Tech/EgresadosIES/issues)