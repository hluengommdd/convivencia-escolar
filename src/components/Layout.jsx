import { useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import { checkSupabaseHealth } from '../api/health'
import { useToast } from '../hooks/useToast'

export default function Layout() {
  const location = useLocation()
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [sbOk, setSbOk] = useState(true)
  const sbStatusRef = useRef(true)
  const { push } = useToast()

  // 🔹 Título dinámico según ruta
  function getTitle() {
    if (location.pathname.startsWith('/casos-activos')) return 'Casos Activos'
    if (location.pathname.startsWith('/seguimientos')) return 'Seguimientos'
    if (location.pathname.startsWith('/casos-cerrados')) return 'Casos Cerrados'
    if (location.pathname.startsWith('/estudiantes')) return 'Estudiantes'
    if (location.pathname === '/') return 'Inicio'
    return ''
  }

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function probe() {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSbOk(false)
        sbStatusRef.current = false
        return
      }
      const res = await checkSupabaseHealth()
      if (cancelled) return
      setSbOk(res.ok)
      if (!res.ok && sbStatusRef.current) {
        push({ type: 'error', title: 'Supabase sin conexión', message: res.message })
      }
      sbStatusRef.current = res.ok
    }

    probe()
    const id = setInterval(probe, 60000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [push])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* HEADER SUPERIOR */}
        <div className="glass flex justify-between items-center p-6 pb-4 shrink-0 border-b border-gray-200/40">
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
            {getTitle()}
          </h1>

          <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
            {!online && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">
                Sin conexión
              </span>
            )}
            {!sbOk && online && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold">
                Supabase caído
              </span>
            )}
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
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
