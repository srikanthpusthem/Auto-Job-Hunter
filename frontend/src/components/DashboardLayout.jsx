import { Outlet, Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { LayoutDashboard, Briefcase, User, Menu, X, Zap, Send, BarChart2, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Automations', href: '/automations', icon: Zap },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Outreach', href: '/outreach', icon: Send },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-slate-900 text-white border-r border-slate-800
        transform transition-all duration-300 ease-in-out shadow-xl
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-20 border-b border-slate-800 transition-all duration-300 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className={`text-lg font-bold tracking-tight text-white whitespace-nowrap transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                Auto Job Hunter
              </h1>
            </div>
            <button 
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-8 space-y-1 overflow-y-auto overflow-x-hidden">
            <div className={`mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
              Main Menu
            </div>
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : ''}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    ${active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                  {active && !sidebarCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <UserButton afterSignOutUrl="/" appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}/>
              <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                <p className="text-sm font-medium text-white truncate">My Account</p>
                <p className="text-xs text-slate-500 truncate">Manage Profile</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collapse Toggle Button (Desktop) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-full p-1 shadow-md transition-colors z-50"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-full px-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Auto Job Hunter</h1>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
