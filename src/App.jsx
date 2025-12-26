import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

// 📄 Páginas
import Dashboard from './pages/Dashboard'
import CasosActivos from './pages/CasosActivos'
import Seguimientos from './pages/Seguimientos'
import SeguimientoPage from './pages/SeguimientoPage'
import CasosCerrados from './pages/CasosCerrados'
import AlertasPlazos from './pages/AlertasPlazos'
import Estadisticas from './pages/Estadisticas'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>

          {/* Inicio */}
          <Route path="/" element={<Dashboard />} />

          {/* Casos */}
          <Route path="/casos-activos" element={<CasosActivos />} />
          <Route path="/casos-cerrados" element={<CasosCerrados />} />

          {/* Seguimientos */}
          <Route path="/seguimientos" element={<Seguimientos />} />

          {/* 🔥 SEGUIMIENTO DIRECTO DESDE ALERTAS */}
          <Route path="/seguimiento" element={<SeguimientoWrapper />} />

          {/* Estadísticas */}
          <Route path="/estadisticas" element={<Estadisticas />} />

          {/* Alertas */}
          <Route path="/alertas" element={<AlertasPlazos />} />
          

        </Route>
      </Routes>
    </BrowserRouter>
  )
}

/* =========================
   WRAPPER PARA QUERY PARAM
========================== */

import { useSearchParams } from 'react-router-dom'

function SeguimientoWrapper() {
  const [params] = useSearchParams()
  const casoId = params.get('caso')

  return (
    <SeguimientoPage
      casoId={casoId}
      showExport
    />
  )
}
