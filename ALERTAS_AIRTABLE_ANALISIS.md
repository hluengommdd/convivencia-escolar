# Análisis: Dinámica de Datos - Airtable y Páginas de la Plataforma

## 📊 PÁGINA: ALERTAS Y CONTROL DE PLAZOS

### 1. **Carga de Datos desde Airtable**

```javascript
// AlertasPlazos.jsx línea 9-14
const { data: seguimientos, loading, error } = useAirtable(
  'SEGUIMIENTOS',           // Tabla
  'Control de Plazos'       // Vista específica
)

const { data: casos } = useAirtable('CASOS_ACTIVOS', 'Grid view')
```

**Tablas consultadas:**
- `SEGUIMIENTOS` con vista "Control de Plazos"
- `CASOS_ACTIVOS` con vista "Grid view"

---

### 2. **Campos Utilizados de Airtable**

#### De tabla SEGUIMIENTOS:
- `Alerta_Urgencia` (campo calculado) - Determina la clasificación
- `Dias_Restantes` (campo calculado) - Para ordenamiento
- `Fecha` - Fecha del seguimiento
- `Tipo_Accion` - Tipo de acción realizada
- `Estado_Etapa` - Estado actual (Pendiente, En Proceso, Completada)
- `Responsable` - Persona responsable
- `Detalle` - Descripción del seguimiento
- `Etapa_Debido_Proceso` - Etapa del debido proceso
- `CASOS_ACTIVOS` - Relación con caso (array de IDs)

#### De tabla CASOS_ACTIVOS:
- `Estudiante_Responsable` - Nombre del estudiante
- `Curso_Incidente` - Curso del estudiante

---

### 3. **Lógica de Clasificación**

```javascript
// AlertasPlazos.jsx línea 21-48
const clasificados = useMemo(() => {
  const grupos = {
    rojos: [],      // 🔴 Vencidos
    naranjos: [],   // 🟠 Urgentes
    amarillos: [],  // 🟡 Próximos
    verdes: [],     // ✅ En plazo
    sin: [],        // ⏳ Sin plazo
  }

  seguimientos.forEach(s => {
    const alerta = s.fields?.Alerta_Urgencia || '⏳ SIN PLAZO'

    if (alerta.startsWith('🔴')) grupos.rojos.push(s)
    else if (alerta.startsWith('🟠')) grupos.naranjos.push(s)
    else if (alerta.startsWith('🟡')) grupos.amarillos.push(s)
    else if (alerta.startsWith('✅')) grupos.verdes.push(s)
    else grupos.sin.push(s)
  })

  // Ordenar por días restantes
  grupos.forEach(arr => arr.sort((a, b) => 
    (a.fields?.Dias_Restantes ?? Infinity) - (b.fields?.Dias_Restantes ?? Infinity)
  ))

  return grupos
}, [seguimientos])
```

**Dependencia crítica:** El campo `Alerta_Urgencia` debe estar calculado correctamente en Airtable.

---

### 4. **Problema Detectado**

**Síntoma:** 
- Página de Alertas muestra 0 vencidos
- ProcesoVisualizer (en Seguimientos) muestra etapas vencidas correctamente

**Causa raíz:**
- **AlertasPlazos** depende del campo calculado `Alerta_Urgencia` en Airtable
- **ProcesoVisualizer** calcula los plazos en el frontend basándose en:
  - `plazoMaxDias` por etapa (definido en el código)
  - Fecha del seguimiento
  - Días transcurridos

**Solución:**
El campo `Alerta_Urgencia` en Airtable debe tener una fórmula que:
1. Calcule `Dias_Restantes` correctamente
2. Asigne emojis según los días:
   - 🔴 si `Dias_Restantes < 0` (vencido)
   - 🟠 si `Dias_Restantes = 0` (vence hoy)
   - 🟡 si `Dias_Restantes <= 3` (próximo)
   - ✅ si `Dias_Restantes > 3` (en plazo)
   - ⏳ si no hay plazo definido

---

### 5. **Vista "Control de Plazos" en Airtable**

Esta vista debe:
- Filtrar seguimientos activos (Estado_Etapa ≠ "Completada" o incluir todos)
- Tener los campos calculados actualizados
- Ordenar por prioridad o fecha

---

### 6. **Recomendaciones**

#### Opción A: Arreglar Airtable (recomendado)
Verificar y corregir las fórmulas en Airtable:
- `Dias_Restantes`: Debe calcular correctamente basándose en fecha del seguimiento + plazo de la etapa
- `Alerta_Urgencia`: Debe usar los emojis correctos según `Dias_Restantes`

#### Opción B: Calcular en Frontend
Cambiar AlertasPlazos para que calcule los plazos igual que ProcesoVisualizer:
```javascript
const clasificados = useMemo(() => {
  // Implementar la misma lógica de ProcesoVisualizer
  // Calcular días transcurridos y comparar con plazoMaxDias
}, [seguimientos])
```

**Ventaja Opción A:** Consistencia entre Airtable y app
**Ventaja Opción B:** No depende de campos calculados de Airtable

---

### 7. **Mapeo de Etapas y Plazos**

```javascript
// ProcesoVisualizer.jsx línea 3-10
const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', plazoMaxDias: 2 },
  { numero: 2, nombre: '2. Notificación Apoderados', plazoMaxDias: 2 },
  { numero: 3, nombre: '3. Recopilación Antecedentes', plazoMaxDias: 5 },
  { numero: 4, nombre: '4. Entrevistas', plazoMaxDias: 5 },
  { numero: 5, nombre: '5. Investigación/Análisis', plazoMaxDias: 10 },
  { numero: 6, nombre: '6. Resolución y Sanciones', plazoMaxDias: 2 },
  { numero: 7, nombre: '7. Apelación/Recursos', plazoMaxDias: 5 },
  { numero: 8, nombre: '8. Seguimiento', plazoMaxDias: null },
]
```

Este mapeo debe estar sincronizado con las fórmulas de Airtable.

---

## ✅ Verificaciones Necesarias (ALERTAS)

1. ¿El campo `Alerta_Urgencia` existe en la vista "Control de Plazos"?
2. ¿El campo `Dias_Restantes` se calcula correctamente?
3. ¿Los emojis en `Alerta_Urgencia` coinciden con la lógica esperada?
4. ¿La vista incluye todos los seguimientos activos?
5. ¿Hay seguimientos sin el campo `Alerta_Urgencia` definido?

---

---

# 📈 PÁGINA: DASHBOARD

## 1. **Carga de Datos desde Airtable**

```javascript
// Dashboard.jsx línea 41-58
const { data: casosActivos } = useAirtable(
  'CASOS_ACTIVOS',
  'Grid view',
  "Estado != 'Cerrado'"
)

const { data: casosCerrados } = useAirtable(
  'CASOS_ACTIVOS',
  'Grid view',
  "Estado = 'Cerrado'"
)

const { data: alertasPlazo } = useAirtable(
  'SEGUIMIENTOS',
  'Control de Plazos'
)
```

**Tablas consultadas:**
- `CASOS_ACTIVOS` con filtro por Estado (activos y cerrados por separado)
- `SEGUIMIENTOS` con vista "Control de Plazos"

---

## 2. **Campos Utilizados de Airtable**

#### De tabla CASOS_ACTIVOS:
- `Estado` - Para filtrar activos vs cerrados
- `Tipificacion_Conducta` - Para gráfico de tipificación y casos urgentes
- `Fecha_Incidente` - Para casos de hoy
- `Curso_Incidente` - Para gráfico por curso
- `Estudiante_Responsable` - Para tarjetas de casos urgentes

#### De tabla SEGUIMIENTOS:
- `Alerta_Urgencia` (campo calculado) - Para clasificar alertas (🔴🟠🟡)
- `Dias_Restantes` (campo calculado) - Para ordenar top alertas
- `Etapa_Debido_Proceso` - Para mostrar en tarjetas
- `Responsable` - Para mostrar responsable
- `CASOS_ACTIVOS` - Relación con casos

---

## 3. **Métricas Calculadas**

```javascript
// Dashboard.jsx línea 71-93
// CASOS
const totalActivos = casosActivos.length
const totalCerrados = casosCerrados.length
const totalCasos = totalActivos + totalCerrados
const tasaCierre = (totalCerrados / totalCasos) * 100

const casosUrgentes = casosActivos.filter(c =>
  ['Muy Grave', 'Gravísima'].includes(c.fields?.Tipificacion_Conducta)
)

const casosHoy = casosActivos.filter(c => 
  c.fields?.Fecha_Incidente.startsWith(hoyISO)
)

// PLAZOS
const resumenPlazos = { rojos: 0, naranjos: 0, amarillos: 0 }
alertasPlazo.forEach(a => {
  const txt = a.fields?.Alerta_Urgencia || ''
  if (txt.startsWith('🔴')) resumenPlazos.rojos++
  else if (txt.startsWith('🟠')) resumenPlazos.naranjos++
  else if (txt.startsWith('🟡')) resumenPlazos.amarillos++
})

const proximosAVencer = resumenPlazos.naranjos + resumenPlazos.amarillos
```

**Dependencias críticas:**
- `Alerta_Urgencia` debe tener emojis correctos
- `Tipificacion_Conducta` debe estar categorizada correctamente
- `Estado` debe ser "Cerrado" o cualquier otro valor para activos

---

## 4. **Gráficos Generados**

### Gráfico 1: Casos activos por tipificación (Pie Chart)
```javascript
const porTipo = {}
casosActivos.forEach(c => {
  const t = c.fields?.Tipificacion_Conducta || 'Sin dato'
  porTipo[t] = (porTipo[t] || 0) + 1
})
```
**Campos:** `Tipificacion_Conducta`

### Gráfico 2: Estado de plazos (Pie Chart)
```javascript
dataPlazos = [
  { name: 'Vencidos', value: resumenPlazos.rojos },
  { name: 'Urgentes', value: resumenPlazos.naranjos },
  { name: 'Próximos', value: resumenPlazos.amarillos },
]
```
**Campos:** `Alerta_Urgencia` (depende de emojis)

### Gráfico 3: Casos activos por curso (Bar Chart - Top 10)
```javascript
const porCurso = {}
casosActivos.forEach(c => {
  const curso = c.fields?.Curso_Incidente || 'Sin curso'
  porCurso[curso] = (porCurso[curso] || 0) + 1
})
```
**Campos:** `Curso_Incidente`

---

## ✅ Verificaciones Necesarias (DASHBOARD)

1. ¿Todos los casos tienen campo `Estado` definido?
2. ¿El campo `Tipificacion_Conducta` está estandarizado? (Leve, Grave, Muy Grave, Gravísima)
3. ¿El campo `Alerta_Urgencia` en seguimientos tiene emojis correctos?
4. ¿El formato de `Fecha_Incidente` es YYYY-MM-DD?
5. ¿El campo `Curso_Incidente` está normalizado?

**Posibles problemas:**
- Si `Alerta_Urgencia` no calcula bien → resumen de plazos mostrará 0s
- Si `Estado` tiene valores inconsistentes → casos pueden aparecer en ambos grupos
- Si `Tipificacion_Conducta` tiene typos → casos urgentes mal calculados

---

---

# 📊 PÁGINA: ESTADÍSTICAS

## 1. **Carga de Datos desde Airtable**

```javascript
// Estadisticas.jsx línea 50-64
const { data: casos } = useAirtable(
  'CASOS_ACTIVOS',
  'Grid view',
  anio ? `YEAR(Fecha_Incidente) = ${anio}` : undefined
)

const { data: seguimientos } = useAirtable(
  'SEGUIMIENTOS',
  'Grid view',
  anio ? `IS_AFTER(Fecha, '${anio}-01-01')` : undefined
)
```

**Tablas consultadas:**
- `CASOS_ACTIVOS` con filtro opcional por año
- `SEGUIMIENTOS` con filtro opcional por año

**Filtros dinámicos:** Usa fórmulas de Airtable (`YEAR()`, `IS_AFTER()`)

---

## 2. **Campos Utilizados de Airtable**

#### De tabla CASOS_ACTIVOS:
- `Fecha_Incidente` - Para filtrado por año/semestre/rango, gráfico por mes
- `Estado` - Para separar cerrados vs abiertos
- `Estudiante_Responsable` - Para reincidencia
- `Curso_Incidente` - Para gráfico por curso
- `Tipificacion_Conducta` - Para gráfico de tipificación
- `Categoria_Conducta` - Para análisis

#### De tabla SEGUIMIENTOS:
- `Fecha` - Para filtrado y cálculo de tiempo promedio
- `Dias_Restantes` (campo calculado) - Para cumplimiento de plazos
- `Responsable` - Para carga por responsable
- `CASOS_ACTIVOS` - Relación para filtrar seguimientos
- `Descripcion` - Para identificar etapa (via regex `Etapa\s+\d+`)
- `Etapa_Debido_Proceso` - Para identificar etapa

---

## 3. **KPIs Calculados**

### KPI Operativos (frontend)
```javascript
const kpi = {
  total: casosFiltrados.length,
  abiertos: casos no cerrados,
  cerrados: casos con Estado='Cerrado',
  promedio: días promedio desde Fecha_Incidente hasta último seguimiento
}
```

### KPI Directivos (frontend)
```javascript
// Cumplimiento de plazos
const seguimientosConPlazo = seguimientos.filter(
  s => typeof s.fields?.Dias_Restantes === 'number'
)
const fueraDePlazo = seguimientosConPlazo.filter(
  s => s.fields.Dias_Restantes < 0
)
const cumplimientoPlazo = 
  ((seguimientosConPlazo.length - fueraDePlazo.length) / seguimientosConPlazo.length) * 100
```
**Dependencia crítica:** Campo `Dias_Restantes` debe existir y calcularse correctamente

```javascript
// Reincidencia
const reincidencia = estudiantes con ≥ 2 casos
```

```javascript
// Carga por responsable
const cargaPorResponsable = conteo de seguimientos por Responsable
```

### Tiempo Promedio por Etapa (frontend)
```javascript
// Estadisticas.jsx línea 215-269
const tiempoPromedioEtapas = ETAPAS.map(etapa => {
  // Buscar seguimientos con regex: /Etapa\s+{numero}/i en Descripcion
  const seguimientosEtapa = seguimientosFiltrados.filter(s => {
    const regex = new RegExp(`Etapa\\s+${etapa.numero}`, 'i')
    return regex.test(s.fields?.Descripcion || '')
  })
  
  // Calcular días desde Fecha_Incidente del caso hasta Fecha del seguimiento
  const promedio = sumaDias / conteo
  
  return { etapa: nombre, promedio, total: count }
})
```
**Dependencia crítica:** El campo `Descripcion` debe contener texto como "Etapa 1", "Etapa 2", etc.

---

## 4. **Gráficos Generados**

### Gráfico 1: Casos por mes (Line Chart)
```javascript
const dataMes = casos.map(c => 
  c.fields?.Fecha_Incidente?.slice(0, 7) // YYYY-MM
)
```
**Campos:** `Fecha_Incidente` (formato YYYY-MM-DD)

### Gráfico 2: Casos por tipificación (Pie Chart)
```javascript
const dataTipo = casos.map(c => 
  c.fields?.Tipificacion_Conducta || 'Sin dato'
)
```
**Campos:** `Tipificacion_Conducta`

### Gráfico 3: Casos por curso (Bar Chart)
```javascript
const dataCursos = casos.map(c => 
  c.fields?.Curso_Incidente || 'Sin curso'
)
```
**Campos:** `Curso_Incidente`

### Gráfico 4: Tiempo promedio por etapa (Bar Chart)
```javascript
// Usa el cálculo de tiempoPromedioEtapas
```
**Campos:** `Descripcion`, `Fecha`, `CASOS_ACTIVOS`

---

## 5. **Filtros Aplicados (Frontend)**

```javascript
// Estadisticas.jsx línea 109-124
const casosFiltrados = casos.filter(c => {
  const d = new Date(c.fields?.Fecha_Incidente)
  return (
    d >= new Date(desde) &&
    d <= new Date(hasta + 'T23:59:59') &&
    (cursoSeleccionado ? c.fields?.Curso_Incidente === cursoSeleccionado : true)
  )
})

const seguimientosFiltrados = seguimientos.filter(s =>
  s.fields?.CASOS_ACTIVOS?.some(id => idsCasos.has(id))
)
```

**Lógica:**
1. Filtrar casos por rango de fechas y curso
2. Obtener IDs de casos filtrados
3. Filtrar seguimientos que pertenezcan a esos casos

---

## ✅ Verificaciones Necesarias (ESTADÍSTICAS)

1. ¿El campo `Dias_Restantes` se calcula correctamente en Airtable?
2. ¿El campo `Descripcion` en seguimientos contiene "Etapa X"?
3. ¿El formato de `Fecha_Incidente` es consistente (YYYY-MM-DD)?
4. ¿La relación `CASOS_ACTIVOS` en seguimientos está correcta?
5. ¿El campo `Estado` en casos tiene valores consistentes?
6. ¿El campo `Responsable` en seguimientos está poblado?

**Posibles problemas:**
- Si `Dias_Restantes` no existe → cumplimiento de plazos = 100% siempre
- Si `Descripcion` no tiene "Etapa X" → tiempo promedio por etapa = vacío
- Si relación `CASOS_ACTIVOS` falla → seguimientos no se filtran correctamente
- Si fechas tienen formato inconsistente → filtrado por rango falla

---

---

# 🔍 RESUMEN DE CAMPOS CALCULADOS CRÍTICOS EN AIRTABLE

## Campos que DEBEN existir y calcularse correctamente:

### 1. **Alerta_Urgencia** (SEGUIMIENTOS)
- **Usado en:** Dashboard, AlertasPlazos
- **Debe contener:** Emojis 🔴🟠🟡✅⏳ según días restantes
- **Impacto si falla:** Alertas muestran 0, gráfico de plazos vacío

### 2. **Dias_Restantes** (SEGUIMIENTOS)
- **Usado en:** Dashboard, AlertasPlazos, Estadisticas
- **Debe contener:** Número de días (positivo=en plazo, negativo=vencido)
- **Cálculo:** `Fecha_Plazo - HOY()`
- **Impacto si falla:** Ordenamiento incorrecto, cumplimiento de plazos = 100%

### 3. **Fecha_Plazo** (SEGUIMIENTOS) - *opcional pero recomendado*
- **Usado para calcular:** Dias_Restantes
- **Debe contener:** Fecha límite según etapa
- **Cálculo:** `Fecha + plazoMaxDias de la etapa`

### 4. **Estado** (CASOS_ACTIVOS)
- **Usado en:** Dashboard, Estadisticas
- **Valores esperados:** "Cerrado" o cualquier otro (Reportado, En Seguimiento, etc.)
- **Impacto si falla:** Casos activos/cerrados mal contabilizados

### 5. **Tipificacion_Conducta** (CASOS_ACTIVOS)
- **Usado en:** Dashboard, Estadisticas, AlertasPlazos
- **Valores esperados:** "Leve", "Grave", "Muy Grave", "Gravísima"
- **Impacto si falla:** Casos urgentes mal calculados, gráfico inconsistente

---

# 🚨 PROBLEMAS DETECTADOS Y SOLUCIONES

## Problema 1: Alertas muestran 0 vencidos pero ProcesoVisualizer muestra vencidos

**Causa:** 
- `Alerta_Urgencia` no se calcula correctamente en Airtable
- ProcesoVisualizer calcula en frontend

**Solución A (Airtable):**
```
// Fórmula para Alerta_Urgencia
IF(
  {Dias_Restantes} < 0,
  "🔴 VENCIDO",
  IF(
    {Dias_Restantes} = 0,
    "🟠 HOY",
    IF(
      {Dias_Restantes} <= 3,
      "🟡 PRÓXIMO",
      IF(
        {Dias_Restantes} > 3,
        "✅ EN PLAZO",
        "⏳ SIN PLAZO"
      )
    )
  )
)
```

**Solución B (Frontend):**
Calcular clasificación en AlertasPlazos igual que ProcesoVisualizer

## Problema 2: Cumplimiento de plazos siempre 100%

**Causa:** 
- `Dias_Restantes` no existe o no se calcula

**Solución:**
Crear campo calculado en Airtable:
```
// Fórmula para Dias_Restantes
DATETIME_DIFF({Fecha_Plazo}, TODAY(), 'days')
```

## Problema 3: Tiempo promedio por etapa vacío

**Causa:** 
- Campo `Descripcion` no contiene "Etapa X"

**Solución:**
- Asegurar que seguimientos tengan "Etapa 1", "Etapa 2", etc. en Descripcion
- O cambiar lógica para usar campo `Etapa_Debido_Proceso` y extraer número con regex

---

# ✅ CHECKLIST DE VALIDACIÓN AIRTABLE

## TABLA: CASOS_ACTIVOS
- [ ] Campo `Estado` existe y tiene valores consistentes
- [ ] Campo `Tipificacion_Conducta` usa valores: Leve, Grave, Muy Grave, Gravísima
- [ ] Campo `Fecha_Incidente` formato YYYY-MM-DD
- [ ] Campo `Curso_Incidente` normalizado
- [ ] Campo `Estudiante_Responsable` poblado
- [ ] Campo `Categoria_Conducta` existe

## TABLA: SEGUIMIENTOS
- [ ] Campo `Alerta_Urgencia` calculado con emojis 🔴🟠🟡✅⏳
- [ ] Campo `Dias_Restantes` calculado correctamente
- [ ] Campo `Fecha_Plazo` existe y se calcula
- [ ] Campo `Descripcion` contiene "Etapa X"
- [ ] Campo `Fecha` formato YYYY-MM-DD
- [ ] Campo `Responsable` poblado
- [ ] Campo `Estado_Etapa` tiene valores: Pendiente, En Proceso, Completada
- [ ] Relación `CASOS_ACTIVOS` funciona correctamente

## VISTAS
- [ ] Vista "Control de Plazos" en SEGUIMIENTOS incluye todos los seguimientos necesarios
- [ ] Vista "Grid view" en CASOS_ACTIVOS incluye todos los casos
- [ ] Vista "Grid view" en SEGUIMIENTOS incluye todos los seguimientos

---
