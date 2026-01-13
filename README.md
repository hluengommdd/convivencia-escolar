Sistema de Gestión de Convivencia Escolar

Aplicación web para **registrar, seguir y analizar** casos de convivencia escolar, con foco en el debido proceso, los plazos y la toma de decisiones informada a partir de datos.[1][2]

## Características principales

- **Dashboard operativo** con KPIs de casos activos/cerrados, tasa de cierre, casos del día y alertas por tipificación de conducta y curso.[2]
- **Gestión de casos**: cada caso tiene ficha con estudiante, curso, fecha/hora, tipificación, categoría y descripción breve del incidente.[1]
- **Seguimiento y control de plazos**: registro de acciones, etapa del debido proceso, responsable, estados y alertas de plazos (🔴 vencidos, 🟠 urgentes, 🟡 próximos).[2][1]
- **Casos activos y cerrados**: vista diferenciada para gestión en curso y archivo histórico.[3][4]
- **Estadísticas avanzadas**: filtros por año y semestre, tiempos promedio de cierre, reincidencia por estudiante, carga por responsable, distribución por mes, curso y tipificación.[5]
- **Informes PDF** de caso para respaldo interno o comunicación formal.[1]

## Tecnologías utilizadas

- **React** (SPA, rutas con `react-router-dom`).[1]
- **Recharts** para gráficos de barras, líneas y tortas.[5][2]
- **lucide-react** para iconografía.[2]
- **Supabase** como backend de datos para casos, seguimientos y vistas de control de plazos.

## Estructura funcional

- `Dashboard.jsx`: resumen operativo, KPIs y gráficos, más bloque de casos urgentes y alertas de plazos con acceso rápido al seguimiento.[2]
- `CasosActivos.jsx` / `CasosCerrados.jsx`: listados filtrados por estado del caso.[4][3]
- `SeguimientoPage.jsx`: detalle de caso, registro de nuevas acciones, cierre y exportación de informe.[1]
- `Seguimientos.jsx`: vista de acciones registradas y control de plazos por caso.[6]
- `Estadisticas.jsx`: panel de análisis histórico y directivo.[5]
- `AlertasPlazos.jsx`: monitor específico de alertas según días restantes.[7]

## Configuración y despliegue

1. Clonar el repositorio.  
2. Crear archivo de entorno (`.env.local`) con las credenciales de Supabase:

```bash
VITE_SUPABASE_URL=tu-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

3. Instalar dependencias y levantar en desarrollo:

```bash
npm install
npm run dev
```

4. Para producción, generar build y desplegar (por ejemplo, en Vercel):

```bash
npm run build
```

## Uso sugerido en la escuela

- Uso diario por **Encargado/a de Convivencia** y dupla psicosocial para registrar incidentes y acciones.[8][1]
- Uso periódico por **equipo directivo** para monitorear tiempos de respuesta, reincidencia y carga de trabajo, y orientar ajustes al Reglamento de Convivencia y protocolos.[8][5]


****
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## ⏱️ Control de plazos (SLA) — Backend-driven

### Decisión técnica (NO modificar sin revisar DB)
- El SLA legal se define exclusivamente en backend.
- Fuente de verdad: `stage_sla`.
- La UI solo visualiza (`v_control_plazos_plus`).
- Etapas 3 y 4 NO tienen vencimiento (`days_to_due = NULL`, `due_date = NULL`).
- Columna `case_followups.due_date` permite NULL.
- Trigger legacy `set_followup_due_date` está deshabilitado.
- Trigger activo: `case_followups_set_due_date`.

### Operativa
- Cambios de plazo → **solo** modificar `stage_sla`.
- No calcular plazos en frontend.
