import Sidebar from './Sidebar'
import { Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  // 🔹 Título dinámico según ruta
  function getTitle() {
    if (location.pathname.startsWith('/casos-activos')) return 'Casos Activos'
    if (location.pathname.startsWith('/seguimientos')) return 'Seguimientos'
    if (location.pathname.startsWith('/casos-cerrados')) return 'Casos Cerrados'
    if (location.pathname.startsWith('/estudiantes')) return 'Estudiantes'
    if (location.pathname === '/') return 'Inicio'
    return ''
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER SUPERIOR */}
        <div className="flex justify-between items-center p-8 pb-4 shrink-0 bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            {getTitle()}
          </h1>

          <div className="text-sm text-gray-600 font-medium">
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* 👇 AQUÍ SE RENDERIZAN LAS PÁGINAS */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
