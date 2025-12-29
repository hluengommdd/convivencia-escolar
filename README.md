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
- **Airtable** como backend de datos (tablas `CASOS_ACTIVOS` y `SEGUIMIENTOS`, vista “Grid view” y “Control de Plazos”).[5][2]

## Estructura funcional

- `Dashboard.jsx`: resumen operativo, KPIs y gráficos, más bloque de casos urgentes y alertas de plazos con acceso rápido al seguimiento.[2]
- `CasosActivos.jsx` / `CasosCerrados.jsx`: listados filtrados por estado del caso.[4][3]
- `SeguimientoPage.jsx`: detalle de caso, registro de nuevas acciones, cierre y exportación de informe.[1]
- `Seguimientos.jsx`: vista de acciones registradas y control de plazos por caso.[6]
- `Estadisticas.jsx`: panel de análisis histórico y directivo.[5]
- `AlertasPlazos.jsx`: monitor específico de alertas según días restantes.[7]

## Configuración y despliegue

1. Clonar el repositorio.  
2. Crear archivo de entorno (`.env.local`) con las credenciales de Airtable: base ID, API key y nombres de tablas/vistas.[5][2]
3. Instalar dependencias y levantar en desarrollo:

```bash
npm install
npm run dev
```

4. Para producción, generar build y desplegar (por ejemplo, en Vercel):

```bash
npm run build
```

## Evidencias en Google Drive (subida de archivos)

Para adjuntar imágenes o documentos como respaldo en una acción de seguimiento, la app puede subir archivos a **Google Drive** y guardar los enlaces en el campo de observaciones.

### Requisitos

- Crear un proyecto en **Google Cloud** y habilitar la API de **Google Drive**.
- Crear un **OAuth Client ID** (tipo: Web application) y agregar los orígenes autorizados (por ejemplo, `http://localhost:5173` o el puerto actual que use Vite).
- Agregar al archivo `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
VITE_GOOGLE_DRIVE_FOLDER_ID=opcional_id_de_carpeta
```

### Cómo funciona en la app

- En `src/components/SeguimientoForm.jsx` se agrega un input de archivos. Al guardar la acción:
	- Se solicita un token mediante **Google Identity Services**.
	- Se sube cada archivo a Drive (opcionalmente dentro de `VITE_GOOGLE_DRIVE_FOLDER_ID`).
	- Se establece permiso de lectura “cualquiera con el enlace” para facilitar la visualización.
	- Los enlaces (`webViewLink`) se añaden automáticamente en el texto de Observaciones bajo el título “Evidencias:”.

### Archivo de ayuda

- Lógica de subida y permisos: [src/api/googleDrive.js](src/api/googleDrive.js)

### Carpeta por caso (organización)

- La app puede crear automáticamente una **carpeta por caso** dentro de la carpeta base definida en `VITE_GOOGLE_DRIVE_FOLDER_ID`.
- El nombre por defecto es `CASO_<recordId>`; puedes ajustar el rótulo pasando `caseLabel`.
- El `folderId` usado se puede guardar en el caso (campo `Drive_Folder_ID`) para reutilizarlo en futuras subidas.

### Privacidad y permisos

- Por defecto los archivos quedan accesibles “con enlace”. Si prefieres restringir, elimina o ajusta la creación de permisos en `googleDrive.js`.
- Puedes definir una **carpeta específica** con `VITE_GOOGLE_DRIVE_FOLDER_ID` para separar la documentación de convivencia escolar.


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
