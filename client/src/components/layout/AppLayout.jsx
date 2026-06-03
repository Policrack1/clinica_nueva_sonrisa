import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import api from '../../utils/api'

export default function AppLayout() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetchUnread()
    const timer = setInterval(fetchUnread, 60000) // poll cada 1 min
    return () => clearInterval(timer)
  }, [])

  async function fetchUnread() {
    try {
      const { data } = await api.get('/notificaciones')
      setUnread(data.no_leidas || 0)
    } catch { /* silencioso */ }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar unread={unread} />
      <main className="flex-1 ml-[240px] flex flex-col min-w-0">
        <Topbar unread={unread} />
        <div className="flex-1 p-6 min-w-0">
          <Outlet context={{ refreshUnread: fetchUnread }} />
        </div>
      </main>
    </div>
  )
}