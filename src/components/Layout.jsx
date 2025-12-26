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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* HEADER SUPERIOR */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {getTitle()}
          </h1>

          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* 👇 AQUÍ SE RENDERIZAN LAS PÁGINAS */}
        <Outlet />
      </main>
    </div>
  )
}
