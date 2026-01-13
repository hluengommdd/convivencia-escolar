# Cómo la Plataforma Cuenta la Temporalidad del Debido Proceso

## Estructura de Etapas

La plataforma define **8 etapas del debido proceso** con plazos máximos definidos en `ProcesoVisualizer.jsx`:

```javascript
const ETAPAS_PROCESO = [
  { numero: 1, nombre: '1. Comunicación/Denuncia', corto: 'Denuncia', plazoMaxDias: 2 },
  { numero: 2, nombre: '2. Notificación Apoderados', corto: 'Notificación', plazoMaxDias: 2 },
  { numero: 3, nombre: '3. Recopilación Antecedentes', corto: 'Antecedentes', plazoMaxDias: 5 },
  { numero: 4, nombre: '4. Entrevistas', corto: 'Entrevistas', plazoMaxDias: 5 },
  { numero: 5, nombre: '5. Investigación/Análisis', corto: 'Investigación', plazoMaxDias: 10 },
  { numero: 6, nombre: '6. Resolución y Sanciones', corto: 'Resolución', plazoMaxDias: 2 },
  { numero: 7, nombre: '7. Apelación/Recursos', corto: 'Apelación', plazoMaxDias: 5 },
  { numero: 8, nombre: '8. Seguimiento', corto: 'Seguimiento', plazoMaxDias: null },
]
```

### Plazos Máximos por Etapa
- **Etapa 1** (Comunicación/Denuncia): **2 días**
- **Etapa 2** (Notificación Apoderados): **2 días**
- **Etapa 3** (Recopilación Antecedentes): **5 días**
- **Etapa 4** (Entrevistas): **5 días**
- **Etapa 5** (Investigación/Análisis): **10 días**
- **Etapa 6** (Resolución y Sanciones): **2 días**
- **Etapa 7** (Apelación/Recursos): **5 días**
- **Etapa 8** (Seguimiento): Sin plazo máximo definido

**Total máximo teórico**: ~31 días

---

## Cómo se Rastrean las Etapas

### 1. Registro de Seguimientos (Acciones)

Cada acción en el caso se registra como un **seguimiento** con los siguientes campos:

- `Tipo_Accion`: Tipo de acción realizada (ej: "Entrevista", "Investigación")
- `Etapa_Debido_Proceso`: Etapa específica asignada (ej: "4. Entrevistas")
- `Fecha_Seguimiento`: Fecha y hora de la acción
- `Estado_Etapa`: Estado de la acción ("Completada", "En Proceso", "Pendiente")
- `Responsable`: Quién realizó la acción
- `Descripción`: Detalles de la acción

### 2. Mapeo de Etapas

El sistema identifica qué etapa se completó de dos formas:

#### Opción A: Campo directo `Etapa_Debido_Proceso`
```
"4. Entrevistas" → Etapa 4
"Etapa 3" → Etapa 3
"1." → Etapa 1
```

#### Opción B: Mapeo de `Tipo_Accion` (fallback)
```javascript
const mapaTipoAEtapa = {
  'Denuncia': 1,
  'Comunicación': 1,
  'Notificación': 2,
  'Antecedentes': 3,
  'Entrevistas': 4,
  'Investigación': 5,
  'Resolución': 6,
  'Apelación': 7,
  'Seguimiento': 8
}
```

---

## Cálculo de Temporalidad

### Estado de Etapas

La plataforma clasifica cada etapa como:

1. **✅ Completada**: Tiene al menos un seguimiento con `Estado_Etapa = 'Completada'`
2. **🔵 Actual/En Proceso**: La próxima etapa después de la última completada
3. **⏳ Pendiente**: Etapas futuras no comenzadas
4. **🔴 Vencida**: Etapa que excedió su plazo máximo

### Detección de Etapas Vencidas

El cálculo se realiza así:

```javascript
ETAPAS_PROCESO.forEach(etapa => {
  if (!etapasCompletadas.has(etapa.numero) && etapa.plazoMaxDias) {
    const seg = etapasConSeguimiento.get(etapa.numero)
    if (seg && seg.fields?.Fecha_Seguimiento) {
      const fechaSeg = new Date(seg.fields.Fecha_Seguimiento)
      const diasTranscurridos = Math.floor((hoy - fechaSeg) / (1000 * 60 * 60 * 24))
      
      if (diasTranscurridos > etapa.plazoMaxDias) {
        // ETAPA VENCIDA
        etapasVencidas.push({
          numero: etapa.numero,
          diasVencidos: diasTranscurridos - etapa.plazoMaxDias
        })
      }
    }
  }
})
```

### Cálculo de Días Vencidos

```
Días Vencidos = Días Transcurridos - Plazo Máximo
```

**Ejemplo:**
- Última acción en Etapa 4: 10 enero
- Hoy: 20 enero
- Días transcurridos: 10 días
- Plazo máximo Etapa 4: 5 días
- **Días vencidos: 10 - 5 = 5 días en retraso**

### Para Etapa 1 sin Seguimientos

Si no hay seguimiento registrado en Etapa 1, se calcula desde la `Fecha_Incidente` del caso:

```javascript
if (!seg && fechaInicio && etapa.numero === 1) {
  const fechaInicioDate = new Date(fechaInicio)
  const diasTranscurridos = Math.floor((hoy - fechaInicioDate) / (1000 * 60 * 60 * 24))
  if (diasTranscurridos > etapa.plazoMaxDias) {
    // ETAPA 1 VENCIDA
  }
}
```

---

## Progreso General del Caso

### Porcentaje de Avance

```javascript
const porcentaje = Math.round((etapasCompletadas.size / ETAPAS_PROCESO.length) * 100)
```

**Ejemplo:**
- Etapas completadas: 3
- Total de etapas: 8
- **Progreso: 37.5% ≈ 38%**

---

## Visualización en la Interfaz

### ProcesoVisualizer (Componente principal)

Muestra:
- ✅ Etapas completadas (verde)
- 🔵 Etapa actual (azul)
- ⏳ Etapas pendientes (gris)
- 🔴 Etapas vencidas (rojo)

### DueProcessAccordions

Agrupa acciones por etapa ordenadas por:
1. Número de etapa (1-8)
2. Fecha descendente dentro de cada etapa

### Alertas en Dashboard y AlertasPlazos

Muestra:
- Días restantes o vencidos
- Fecha de plazo
- Etapa actual
- Responsable

---

## Base de Datos

### Tablas Relevantes

- `case_followups`: Registro de seguimientos/acciones
  - `case_id`: FK al caso
  - `action_date`: Fecha de la acción
  - `process_stage`: Etapa del debido proceso
  - `action_type`: Tipo de acción
  - `stage_status`: Estado de la etapa
  - `responsible`: Responsable

- `cases`: Casos principales
  - `incident_date`: Fecha del incidente (para calcular Etapa 1)
  - `status`: Estado del caso

### Vista v_control_plazos

Proporciona datos consolidados de alertas y plazos para el dashboard.

---

## Flujo Completo de Temporalidad

```
1. Usuario registra acción en un caso
   ↓
2. Asigna etapa: "4. Entrevistas"
   ↓
3. Sistema guarda: Etapa_Debido_Proceso = "4. Entrevistas"
   ↓
4. Sistema busca si Etapa 4 está completada
   ↓
5. Si sí, marca como ✅ Completada
   Si no, verifica plazo: 5 días max desde la última acción
   ↓
6. Si ha pasado > 5 días, marca como 🔴 Vencida
   ↓
7. Calcula: Días vencidos = Hoy - Fecha_Acción - 5 días
   ↓
8. Muestra alertas en dashboard y alertas de plazos
```

---

## Ejemplos Prácticos

### Caso Sin Retrasos

```
Etapa 1 - Denuncia:        20 de enero → completada (1 día) ✅
Etapa 2 - Notificación:    21 de enero → completada (1 día) ✅
Etapa 3 - Antecedentes:    25 de enero → completada (4 días) ✅
Etapa 4 - Entrevistas:     30 de enero → completada (5 días) ✅
Etapa 5 - Investigación:   31 de enero → EN PROCESO (1 día) 🔵
```

Progreso: 50% | Estado: Normal

### Caso Con Retrasos

```
Etapa 1 - Denuncia:        20 de enero → completada (1 día) ✅
Etapa 2 - Notificación:    25 de enero → completada (5 días - VENCIDA 3 días) 🔴
Etapa 3 - Antecedentes:    02 de febrero → completada (8 días) ✅
Etapa 4 - Entrevistas:     Hoy 13 de febrero → SIN INICIO (13 días - VENCIDA 8 días) 🔴
```

Progreso: 25% | Alertas: 2 etapas vencidas

---

## Notas Importantes

1. **Cálculo de días**: Se cuentan días calendario completos (redondeo hacia abajo)
2. **Etapa 8 (Seguimiento)**: No tiene plazo máximo (`null`), por lo que nunca vence
3. **Responsable del control**: El gestor de convivencia debe actualizar regularmente
4. **Alertas automáticas**: Se recalculan cada vez que se carga el dashboard
5. **Plazos configurables**: Los `plazoMaxDias` pueden modificarse en `ProcesoVisualizer.jsx`
