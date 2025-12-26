import { NavLink } from 'react-router-dom'
import {
  Home,
  Folder,
  AlertCircle,
  CheckCircle,
  Archive,
  BarChart3,
} from 'lucide-react'

// 👇 IMPORTA EL LOGO
import logoColegio from '../assets/veritas.jpg'

export default function Sidebar() {
  const linkClass =
    'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition'

  const activeClass =
    'bg-red-50 text-red-600'

  const inactiveClass =
    'text-gray-600 hover:bg-gray-100'

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* HEADER CON LOGO */}
      <div className="p-6 border-b flex items-center gap-3">
        <img
          src={logoColegio}
          alt="Logo Colegio"
          className="w-10 h-10 object-contain"
        />
        <h1 className="text-lg font-bold text-gray-800 leading-tight">
          Registro de Casos
        </h1>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-4 space-y-1">
        <NavLink to="/" end className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <Home size={18} />
          Inicio
        </NavLink>

        <NavLink to="/casos-activos" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <Folder size={18} />
          Casos Activos
        </NavLink>

        <NavLink to="/seguimientos" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <CheckCircle size={18} />
          Seguimientos
        </NavLink>

        <NavLink to="/casos-cerrados" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <Archive size={18} />
          Casos Cerrados
        </NavLink>

        {/* 🔥 ESTADÍSTICAS */}
        <NavLink to="/estadisticas" className={({ isActive }) =>
          `${linkClass} ${isActive ? activeClass : inactiveClass}`
        }>
          <BarChart3 size={18} />
          Estadísticas
        </NavLink>

        <NavLink to="/alertas" className={({ isActive }) =>
    `${linkClass} ${isActive ? activeClass : inactiveClass}`
  }
>
  <AlertCircle size={18} />
  <span className="flex-1">Alertas</span>

  {/* 🔴 Indicador visual */}
  <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
    !
  </span>
</NavLink>

      </nav>
    </aside>
  )
}
