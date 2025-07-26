import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import EventsPage from '@/pages/Events/EventsPage'
import ClientsPage from '@/pages/Clients/ClientsPage'
import CreateClient from '@/pages/Clients/CreateClient'
import EditClient from '@/pages/Clients/EditClient'
import ClientProfile from '@/pages/Clients/ClientProfile'
import FleuristePage from '@/pages/Fleuriste'
import CalendarPage from '@/pages/Calendar'
import AnalyticsPage from '@/pages/Analytics/AnalyticsPage'
import { useApp } from '@/contexts/AppContextSupabase'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardProvider } from '@/contexts/DashboardContext' // 🔥 NOUVEAU: Provider dashboard
import { CalendarProvider } from '@/contexts/CalendarContext' // 🔥 NOUVEAU: Provider calendar
import { ClientProvider } from '@/contexts/ClientContext' // 🔥 NOUVEAU: Provider clients CRM
import { FloristProvider } from '@/contexts/FloristContext' // 🔥 NOUVEAU: Provider florists team management
import { AnalyticsProvider } from '@/contexts/AnalyticsContext' // 🔥 CHUNK 7: Provider analytics business intelligence
import { GlobalCoordinatorProvider } from '@/contexts/GlobalCoordinator' // 🚀 CHUNK 8: Orchestration centrale
import MathildeAppProviders from '@/components/providers/MathildeAppProviders' // 🚀 CHUNK 8: Architecture optimisée
import AuthModal from '@/components/auth/AuthModal'
import OfflineIndicator from '@/components/PWA/OfflineIndicator'
import InstallPrompt from '@/components/PWA/InstallPrompt'
import EventSyncNotification from '@/components/ui/EventSyncNotification'
import './App.css'

const App = () => {
  const context = useApp()
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('home')
  const [pageParams, setPageParams] = useState<Record<string, any>>({})

  // Navigation effect DOIT être avant les guards
  useEffect(() => {
    const handleNavigation = (e: CustomEvent) => {
      setCurrentPage(e.detail.page)
      setPageParams(e.detail || {})
    }
    
    window.addEventListener('navigate', handleNavigation as EventListener)
    return () => window.removeEventListener('navigate', handleNavigation as EventListener)
  }, [])

  // Guard: si le contexte n'est pas prêt, afficher un loading
  if (!context) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement de l'application...</div>
      </div>
    )
  }

  const { state } = context

  // Si l'utilisateur n'est pas connecté et que l'auth a fini de charger, afficher la page d'auth
  if (!user && !loading) {
    return <AuthModal />
  }

  // Si l'auth est en cours de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Vérification de l'authentification...</div>
      </div>
    )
  }

  // Fonction de navigation
  const navigate = (page: string, params?: any) => {
    setCurrentPage(page)
    setPageParams(params || {})
  }

  // Rendu de la page courante
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home navigate={navigate} />
      case 'events':
        return <EventsPage navigate={navigate} />
      case 'events/create':
        return <EventsPage navigate={navigate} />
      case 'events/edit':
        return <EventsPage navigate={navigate} />
      case 'events/details':
        return <EventsPage navigate={navigate} />
      case 'clients':
        return <ClientsPage navigate={navigate} />
      case 'clients/create':
        return <CreateClient navigate={navigate} />
      case 'clients/edit':
        return <EditClient navigate={navigate} clientId={pageParams.clientId} />
      case 'clients/profile':
        return <ClientProfile navigate={navigate} clientId={pageParams.clientId} />
      case 'fleuriste':
        return <FleuristePage navigate={navigate} />
      case 'calendar':
        return <CalendarPage navigate={navigate} />
      case 'analytics':
        return <AnalyticsPage navigate={navigate} />
      default:
        return <Home navigate={navigate} />
    }
  }

  return (
    <div className="App">
      <OfflineIndicator />
      <InstallPrompt />
      <EventSyncNotification />
      
      {/* 🚀 CHUNK 8: ARCHITECTURE OPTIMISÉE avec GlobalCoordinator */}
      <MathildeAppProviders>
        <Layout navigate={navigate} currentPage={currentPage}>
          {renderCurrentPage()}
        </Layout>
      </MathildeAppProviders>
      
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{state.error}</span>
        </div>
      )}
    </div>
  )
}

export default App

