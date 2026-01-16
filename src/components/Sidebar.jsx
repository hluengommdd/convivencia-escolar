import { NavLink } from 'react-router-dom'
import {
  Home,
  Folder,
  AlertCircle,
  CheckCircle,
  Archive,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from 'lucide-react'

// 👇 IMPORTA EL LOGO
import logoColegio from '../assets/veritas.jpg'
import { useEffect, useState } from 'react'
import { getCases } from '../api/db'
import { onDataUpdated } from '../utils/refreshBus'

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSeguimientos, setExpandedSeguimientos] = useState(false)
  const [casesEnSeguimiento, setCasesEnSeguimiento] = useState([])

  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar-collapsed')
      if (v === null) {
        // si no existe, arrancar expandida por defecto
        localStorage.setItem('sidebar-collapsed', 'false')
        setCollapsed(false)
      } else {
        setCollapsed(v === 'true')
      }
    } catch (e) {
      setCollapsed(false)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false') } catch (e) {}
  }, [collapsed])

  // Cargar casos en seguimiento
  useEffect(() => {
    async function cargarCasosEnSeguimiento() {
      try {
        // ✅ Cargar TODOS los casos y filtrar en frontend
        const todos = await getCases()
        const enSeguimiento = todos.filter(c => {
          const estado = (c.fields?.Estado || '').trim().toLowerCase()
          return estado === 'en seguimiento'
        })
        
        // Mapear para obtener el nombre del estudiante
        const casosFormateados = enSeguimiento.map(caso => {
          // Estudiante_Responsable es un objeto, extraer nombre
          const estudianteObj = caso.fields.Estudiante_Responsable
          let nombre = 'Sin nombre'
          
          if (typeof estudianteObj === 'object' && estudianteObj !== null) {
            // Si es objeto, buscar propiedades comunes de nombre
            nombre = estudianteObj.full_name || estudianteObj.name || estudianteObj.apellidos || 'Sin nombre'
          } else if (typeof estudianteObj === 'string') {
            nombre = estudianteObj
          }
          
          return {
            id: caso.id,
            nombre: nombre,
          }
        })
        
        console.log('📋 Casos en seguimiento cargados:', casosFormateados.length, casosFormateados)
        setCasesEnSeguimiento(casosFormateados)
      } catch (e) {
        console.error('Error cargando casos en seguimiento:', e)
        setCasesEnSeguimiento([])
      }
    }
    cargarCasosEnSeguimiento()
    
    // Suscribirse a cambios de datos (cuando se inicia debido proceso)
    const off = onDataUpdated(() => {
      console.log('🔄 Refrescando casos en seguimiento del sidebar...')
      cargarCasosEnSeguimiento()
    })
    
    return () => off()
  }, [])

  const linkClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200'

  const activeClass =
    'bg-gradient-to-r from-red-50 to-red-100 text-red-600 shadow-sm'

  const inactiveClass =
    'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:translate-x-1'

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden sm:flex flex-col shadow-xl bg-white/60 glass border-r border-gray-200/40 ${collapsed ? 'sidebar-collapsed w-20' : 'w-64'}`}>
      {/* HEADER CON LOGO */}
      <div className="p-3 border-b border-gray-200/40 flex items-center gap-3 bg-transparent justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoColegio}
            alt="Logo Colegio"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-lg font-bold text-gray-800 leading-tight sidebar-label">
            Registro de Casos
          </h1>
        </div>

        <button
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          onClick={() => setCollapsed(s => !s)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-2 space-y-1">
        <NavLink to="/" end className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <Home size={18} />
          <span className="sidebar-label">Inicio</span>
        </NavLink>

        <NavLink to="/casos-activos" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <Folder size={18} />
          <span className="sidebar-label">Casos Activos</span>
        </NavLink>

        {/* Seguimientos con submenu expandible */}
        <div className="flex flex-col gap-0">
          <button
            onClick={() => setExpandedSeguimientos(!expandedSeguimientos)}
            className={`${linkClass} w-full justify-between ${expandedSeguimientos ? activeClass : inactiveClass}`}
          >
            <span className="flex items-center gap-3">
              <CheckCircle size={18} />
              <span className="sidebar-label">Seguimientos</span>
            </span>
            <ChevronDown 
              size={16} 
              className={`transition-transform ${expandedSeguimientos ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Submenu de estudiantes */}
          {expandedSeguimientos && (
            <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
              {casesEnSeguimiento.length > 0 ? (
                casesEnSeguimiento.map(caso => (
                  <NavLink
                    key={caso.id}
                    to={`/seguimientos/${caso.id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all ${
                        isActive 
                          ? 'bg-red-50 text-red-600 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-gray-400">•</span>
                    <span className="sidebar-label truncate">{caso.nombre}</span>
                  </NavLink>
                ))
              ) : (
                <div className="text-xs text-gray-400 px-3 py-2">
                  No hay casos en seguimiento
                </div>
              )}
            </div>
          )}
        </div>

        <NavLink to="/casos-cerrados" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <Archive size={18} />
          <span className="sidebar-label">Casos Cerrados</span>
        </NavLink>

        {/* 🔥 ESTADÍSTICAS */}
        <NavLink to="/estadisticas" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <BarChart3 size={18} />
          <span className="sidebar-label">Estadísticas</span>
        </NavLink>

        <NavLink to="/alertas" className={({ isActive }) =>
    `${linkClass} ${isActive ? activeClass : inactiveClass}`
  }
>
  <AlertCircle size={18} />
  <span className="flex-1 sidebar-label">Alertas</span>

  {/* 🔴 Indicador visual */}
  <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
    !
  </span>
</NavLink>

      </nav>
      </aside>

      {/* Mobile sidebar (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative w-64 bg-white shadow-xl p-2">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-3">
                <img src={logoColegio} alt="Logo Colegio" className="w-8 h-8 object-contain" />
                <h1 className="text-lg font-bold text-gray-800 leading-tight">Registro de Casos</h1>
              </div>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100"><X size={16} /></button>
            </div>
            <nav className="p-2 space-y-1">
              <NavLink to="/" end className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`} onClick={onClose}>
                <Home size={18} />
                <span className="sidebar-label">Inicio</span>
              </NavLink>

              <NavLink to="/casos-activos" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`} onClick={onClose}>
                <Folder size={18} />
                <span className="sidebar-label">Casos Activos</span>
              </NavLink>

              {/* Seguimientos con submenu expandible - Mobile */}
              <div className="flex flex-col gap-0">
                <button
                  onClick={() => setExpandedSeguimientos(!expandedSeguimientos)}
                  className={`${linkClass} w-full justify-between ${expandedSeguimientos ? activeClass : inactiveClass}`}
                >
                  <span className="flex items-center gap-3">
                    <CheckCircle size={18} />
                    <span className="sidebar-label">Seguimientos</span>
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${expandedSeguimientos ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Submenu de estudiantes - Mobile */}
                {expandedSeguimientos && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
                    {casesEnSeguimiento.length > 0 ? (
                      casesEnSeguimiento.map(caso => (
                        <NavLink
                          key={caso.id}
                          to={`/seguimientos/${caso.id}`}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all ${
                              isActive 
                                ? 'bg-red-50 text-red-600 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`
                          }
                          onClick={onClose}
                        >
                          <span className="text-gray-400">•</span>
                          <span className="sidebar-label truncate">{caso.nombre}</span>
                        </NavLink>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 px-3 py-2">
                        No hay casos en seguimiento
                      </div>
                    )}
                  </div>
                )}
              </div>

              <NavLink to="/casos-cerrados" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`} onClick={onClose}>
                <Archive size={18} />
                <span className="sidebar-label">Casos Cerrados</span>
              </NavLink>

              <NavLink to="/estadisticas" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`} onClick={onClose}>
                <BarChart3 size={18} />
                <span className="sidebar-label">Estadísticas</span>
              </NavLink>

              <NavLink to="/alertas" className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`} onClick={onClose}>
                <AlertCircle size={18} />
                <span className="flex-1 sidebar-label">Alertas</span>
                <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">!</span>
              </NavLink>
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
