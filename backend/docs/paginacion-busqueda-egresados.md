# Paginación en Búsqueda de Egresados - Backend

## Descripción
Implementación de sistema de paginación para el endpoint de búsqueda de egresados, permitiendo cargar resultados en páginas de 10 registros.

## Cambios Realizados

### `src/controllers/busquedaController.js`

#### 1. Parámetros de Paginación
Se agregaron los parámetros `pagina` y `limite` al endpoint `/api/buscar`:

```javascript
const { pagina = 1, limite = 10 } = req.query;
```

#### 2. Validación y Cálculo
- **Validación**: Página mínima 1, límite mínimo 1 y máximo 50
- **Cálculo de offset**: `(paginaNum - 1) * limiteNum`

```javascript
const paginaNum = Math.max(1, parseInt(pagina) || 1);
const limiteNum = Math.min(50, Math.max(1, parseInt(limite) || 10));
const offset = (paginaNum - 1) * limiteNum;
```

#### 3. Query SQL Optimizada
Se removió `SELECT DISTINCT` que causaba problemas con `OFFSET`, optimizando la consulta:

```sql
SELECT u.id, u.nombre, u.apellido, u.email, u.tipo_usuario,
       e.dni, e.carrera_id, e.año_egreso, e.situacion_laboral,
       p.telefono, p.ubicacion, p.linkedin, p.github, p.portfolio,
       p.biografia, p.foto_perfil, p.empresa_actual, p.puesto_actual,
       p.disponibilidad_laboral, p.visibilidad_perfil,
       c.nombre_carrera
FROM Usuario u
LEFT JOIN Egresado e ON u.id = e.id_usuario
LEFT JOIN Perfil p ON u.id = p.id_usuario
LEFT JOIN Carrera c ON e.carrera_id = c.id
WHERE u.tipo_usuario = 'Egresado'
ORDER BY ${orderClause}
LIMIT ${limiteNum} OFFSET ${offset}
```

#### 4. Respuesta con Metadatos
Se agregaron metadatos de paginación a la respuesta:

```javascript
{
    success: true,
    data: {
        perfiles: [...],
        total: 13,
        paginaActual: 1,
        limite: 10,
        totalPaginas: 2
    }
}
```

## Resultados

- ✅ Consultas optimizadas con LIMIT/OFFSET funcional
- ✅ Máximo de 50 resultados por página para prevenir sobrecarga
- ✅ Paginación correcta sin duplicados ni saltos
- ✅ Metadatos completos para UI de paginación

## Testing

Total de registros en base de datos: 13 egresados
- Página 1: 10 resultados
- Página 2: 3 resultados

Verificado con scripts de prueba exitosamente.
