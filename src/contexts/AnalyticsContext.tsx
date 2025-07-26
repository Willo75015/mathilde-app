import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react'
import { useEvents } from '@/contexts/EventContext'
import { useClients } from '@/contexts/ClientContext'

// 🎯 TYPES DÉCOUVERTS VIA CONTEXT7 MCP - PATTERNS ANALYTICS ENTERPRISE

export type AnalyticsTheme = 'missions' | 'top-clients' | 'facturation' | 'paiement'
export type DateRangeType = 'day' | 'week' | 'month' | 'year' | 'custom'

// 📊 INTERFACES MÉTIER SELON PATTERNS DÉCOUVERTS
export interface MissionAnalytics {
  totalEvents: number
  completedEvents: number
  ongoingEvents: number
  upcomingEvents: number
  successRate: number
  avgDuration: number
  revenueGenerated: number
  floristsUtilization: number
}

export interface ClientAnalytics {
  totalClients: number
  activeClients: number
  newClients: number
  topClients: Array<{
    id: string
    name: string
    eventCount: number
    totalBudget: number
    avgEventValue: number
    lastEventDate: string
    loyaltyScore: number
  }>
  clientsByCity: { [city: string]: number }
  loyaltyDistribution: {
    bronze: number
    silver: number  
    gold: number
    platinum: number
  }
}

export interface BillingAnalytics {
  totalRevenue: number
  invoicedAmount: number
  pendingAmount: number
  overdueAmount: number
  paidAmount: number
  avgInvoiceValue: number
  conversionRate: number
  monthlyGrowth: number
}

export interface PaymentMetrics {
  avgPaymentDelay: number
  rapideCount: number  // ≤ 1 jour
  correctCount: number // 2-3 jours
  lentCount: number   // > 3 jours
  totalEvents: number
  challenge?: MonthlyChallenge
}

export interface MonthlyChallenge {
  targetAvg: number
  improvement: number
  status: 'excellent' | 'good' | 'warning' | 'urgent'
  message: string
}

// 🏗️ STATE MANAGEMENT PATTERN INSPIRÉ DE CONTEXT7 MCP
export interface AnalyticsState {
  // Analytics data par thème
  missions: MissionAnalytics
  topClients: ClientAnalytics
  facturation: BillingAnalytics
  paiement: PaymentMetrics
  
  // UI State
  activeTheme: AnalyticsTheme
  dateRange: DateRangeType
  customRange?: { start: Date; end: Date }
  
  // Loading states granulaires
  loading: {
    missions: boolean
    topClients: boolean
    facturation: boolean
    paiement: boolean
    global: boolean
  }
  
  // Error handling robuste
  errors: {
    missions: string | null
    topClients: string | null
    facturation: string | null
    paiement: string | null
    global: string | null
  }
  
  // Performance tracking
  lastUpdated: {
    missions: Date | null
    topClients: Date | null
    facturation: Date | null
    paiement: Date | null
  }
  
  // Features flags
  autoRefresh: boolean
  refreshing: boolean
  performanceMonitoring: boolean
}

// 🎯 ACTIONS TYPÉES SELON PATTERNS CONTEXT7 MCP
export type AnalyticsAction = 
  | { type: 'SET_ACTIVE_THEME'; payload: AnalyticsTheme }
  | { type: 'SET_DATE_RANGE'; payload: DateRangeType }
  | { type: 'SET_CUSTOM_RANGE'; payload: { start: Date; end: Date } }
  | { type: 'SET_LOADING'; payload: { theme: keyof AnalyticsState['loading']; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { theme: keyof AnalyticsState['errors']; error: string | null } }
  | { type: 'LOAD_MISSIONS_ANALYTICS'; payload: MissionAnalytics }
  | { type: 'LOAD_CLIENT_ANALYTICS'; payload: ClientAnalytics }
  | { type: 'LOAD_BILLING_ANALYTICS'; payload: BillingAnalytics }
  | { type: 'LOAD_PAYMENT_METRICS'; payload: PaymentMetrics }
  | { type: 'UPDATE_LAST_REFRESH'; payload: { theme: keyof AnalyticsState['lastUpdated'] } }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'REFRESH_ALL_ANALYTICS' }

// 📊 INITIAL STATE OPTIMAL
const initialState: AnalyticsState = {
  missions: {
    totalEvents: 0,
    completedEvents: 0,
    ongoingEvents: 0,
    upcomingEvents: 0,
    successRate: 0,
    avgDuration: 0,
    revenueGenerated: 0,
    floristsUtilization: 0
  },
  topClients: {
    totalClients: 0,
    activeClients: 0,
    newClients: 0,
    topClients: [],
    clientsByCity: {},
    loyaltyDistribution: { bronze: 0, silver: 0, gold: 0, platinum: 0 }
  },
  facturation: {
    totalRevenue: 0,
    invoicedAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidAmount: 0,
    avgInvoiceValue: 0,
    conversionRate: 0,
    monthlyGrowth: 0
  },
  paiement: {
    avgPaymentDelay: 0,
    rapideCount: 0,
    correctCount: 0,
    lentCount: 0,
    totalEvents: 0
  },
  activeTheme: 'missions',
  dateRange: 'month',
  loading: {
    missions: false,
    topClients: false,
    facturation: false,
    paiement: false,
    global: false
  },
  errors: {
    missions: null,
    topClients: null,
    facturation: null,
    paiement: null,
    global: null
  },
  lastUpdated: {
    missions: null,
    topClients: null,
    facturation: null,
    paiement: null
  },
  autoRefresh: true,
  refreshing: false,
  performanceMonitoring: true
}

// 🔧 REDUCER SELON PATTERNS CONTEXT7 MCP - IMMUTABLE UPDATES
const analyticsReducer = (state: AnalyticsState, action: AnalyticsAction): AnalyticsState => {
  switch (action.type) {
    case 'SET_ACTIVE_THEME':
      return { ...state, activeTheme: action.payload }
      
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload }
      
    case 'SET_CUSTOM_RANGE':
      return { ...state, customRange: action.payload, dateRange: 'custom' }
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.theme]: action.payload.loading }
      }
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.theme]: action.payload.error }
      }
      
    case 'LOAD_MISSIONS_ANALYTICS':
      return {
        ...state,
        missions: action.payload,
        lastUpdated: { ...state.lastUpdated, missions: new Date() },
        errors: { ...state.errors, missions: null }
      }
      
    case 'LOAD_CLIENT_ANALYTICS':
      return {
        ...state,
        topClients: action.payload,
        lastUpdated: { ...state.lastUpdated, topClients: new Date() },
        errors: { ...state.errors, topClients: null }
      }
      
    case 'LOAD_BILLING_ANALYTICS':
      return {
        ...state,
        facturation: action.payload,
        lastUpdated: { ...state.lastUpdated, facturation: new Date() },
        errors: { ...state.errors, facturation: null }
      }
      
    case 'LOAD_PAYMENT_METRICS':
      return {
        ...state,
        paiement: action.payload,
        lastUpdated: { ...state.lastUpdated, paiement: new Date() },
        errors: { ...state.errors, paiement: null }
      }
      
    case 'UPDATE_LAST_REFRESH':
      return {
        ...state,
        lastUpdated: { ...state.lastUpdated, [action.payload.theme]: new Date() }
      }
      
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefresh: action.payload }
      
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload }
      
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {
          missions: null,
          topClients: null,
          facturation: null,
          paiement: null,
          global: null
        }
      }
      
    case 'REFRESH_ALL_ANALYTICS':
      return {
        ...state,
        refreshing: true,
        lastUpdated: {
          missions: new Date(),
          topClients: new Date(),
          facturation: new Date(),
          paiement: new Date()
        }
      }
      
    default:
      return state
  }
}

// 🎯 CONTEXT CREATION SELON PATTERNS CONTEXT7 MCP
const AnalyticsContext = createContext<{
  state: AnalyticsState
  dispatch: React.Dispatch<AnalyticsAction>
  // Computed values memoized
  totalRevenue: number
  totalClients: number
  overallHealthScore: number
  performanceMetrics: any
  // Helper functions
  setActiveTheme: (theme: AnalyticsTheme) => void
  setDateRange: (range: DateRangeType) => void
  setCustomRange: (range: { start: Date; end: Date }) => void
  refreshTheme: (theme: AnalyticsTheme) => Promise<void>
  refreshAllAnalytics: () => Promise<void>
  clearErrors: () => void
  // Specialized getters
  getAnalyticsForTheme: (theme: AnalyticsTheme) => any
  isThemeLoading: (theme: AnalyticsTheme) => boolean
  getThemeError: (theme: AnalyticsTheme) => string | null
  getLastUpdated: (theme: AnalyticsTheme) => Date | null
} | null>(null)

// 🎯 PROVIDER PATTERN SELON CONTEXT7 MCP
export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(analyticsReducer, initialState)
  const { events, isLoading: eventsLoading } = useEvents()
  const { clients, isLoading: clientsLoading } = useClients()

  // 🧮 COMPUTED VALUES MEMOIZED POUR PERFORMANCE
  const totalRevenue = useMemo(() => {
    return state.facturation.totalRevenue
  }, [state.facturation.totalRevenue])

  const totalClients = useMemo(() => {
    return state.topClients.totalClients
  }, [state.topClients.totalClients])

  const overallHealthScore = useMemo(() => {
    // Algorithme de santé business basé sur patterns découverts
    const revenueScore = Math.min(100, (state.facturation.totalRevenue / 50000) * 40) // 40% weight
    const clientScore = Math.min(100, (state.topClients.activeClients / 20) * 30)      // 30% weight
    const paymentScore = Math.max(0, 100 - (state.paiement.avgPaymentDelay * 10))     // 30% weight
    
    return Math.round((revenueScore + clientScore + paymentScore) / 3)
  }, [state.facturation.totalRevenue, state.topClients.activeClients, state.paiement.avgPaymentDelay])

  const performanceMetrics = useMemo(() => ({
    loadingStates: Object.values(state.loading).filter(Boolean).length,
    errorStates: Object.values(state.errors).filter(Boolean).length,
    lastRefreshAge: state.lastUpdated.missions ? 
      Date.now() - state.lastUpdated.missions.getTime() : null
  }), [state.loading, state.errors, state.lastUpdated.missions])

  // 🔧 HELPER FUNCTIONS AVEC useCallback POUR PERFORMANCE
  const setActiveTheme = useCallback((theme: AnalyticsTheme) => {
    dispatch({ type: 'SET_ACTIVE_THEME', payload: theme })
  }, [])

  const setDateRange = useCallback((range: DateRangeType) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range })
  }, [])

  const setCustomRange = useCallback((range: { start: Date; end: Date }) => {
    dispatch({ type: 'SET_CUSTOM_RANGE', payload: range })
  }, [])

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' })
  }, [])

  // 🎯 SPECIALIZED GETTERS SELON PATTERNS CONTEXT7 MCP
  const getAnalyticsForTheme = useCallback((theme: AnalyticsTheme) => {
    switch (theme) {
      case 'missions': return state.missions
      case 'top-clients': return state.topClients
      case 'facturation': return state.facturation
      case 'paiement': return state.paiement
      default: return null
    }
  }, [state.missions, state.topClients, state.facturation, state.paiement])

  const isThemeLoading = useCallback((theme: AnalyticsTheme) => {
    const themeMap = {
      'missions': 'missions',
      'top-clients': 'topClients', 
      'facturation': 'facturation',
      'paiement': 'paiement'
    } as const
    return state.loading[themeMap[theme]]
  }, [state.loading])

  const getThemeError = useCallback((theme: AnalyticsTheme) => {
    const themeMap = {
      'missions': 'missions',
      'top-clients': 'topClients',
      'facturation': 'facturation', 
      'paiement': 'paiement'
    } as const
    return state.errors[themeMap[theme]]
  }, [state.errors])

  const getLastUpdated = useCallback((theme: AnalyticsTheme) => {
    const themeMap = {
      'missions': 'missions',
      'top-clients': 'topClients',
      'facturation': 'facturation',
      'paiement': 'paiement'
    } as const
    return state.lastUpdated[themeMap[theme]]
  }, [state.lastUpdated])

  // 🔄 REFRESH FUNCTIONS AVEC PATTERNS OPTIMISÉS
  const refreshTheme = useCallback(async (theme: AnalyticsTheme) => {
    const themeMap = {
      'missions': 'missions',
      'top-clients': 'topClients',
      'facturation': 'facturation',
      'paiement': 'paiement'
    } as const
    
    dispatch({ type: 'SET_LOADING', payload: { theme: themeMap[theme], loading: true } })
    
    try {
      switch (theme) {
        case 'missions':
          const missionData = await calculateMissionAnalytics(events)
          dispatch({ type: 'LOAD_MISSIONS_ANALYTICS', payload: missionData })
          break
          
        case 'top-clients':
          const clientData = await calculateClientAnalytics(clients, events)
          dispatch({ type: 'LOAD_CLIENT_ANALYTICS', payload: clientData })
          break
          
        case 'facturation':
          const billingData = await calculateBillingAnalytics(events)
          dispatch({ type: 'LOAD_BILLING_ANALYTICS', payload: billingData })
          break
          
        case 'paiement':
          const paymentData = await calculatePaymentMetrics(events)
          dispatch({ type: 'LOAD_PAYMENT_METRICS', payload: paymentData })
          break
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          theme: themeMap[theme], 
          error: error instanceof Error ? error.message : 'Erreur de calcul analytics' 
        }
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { theme: themeMap[theme], loading: false } })
    }
  }, [events, clients])

  const refreshAllAnalytics = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true })
    dispatch({ type: 'CLEAR_ALL_ERRORS' })
    
    try {
      // Refresh tous les thèmes en parallèle pour performance optimale
      await Promise.all([
        refreshTheme('missions'),
        refreshTheme('top-clients'), 
        refreshTheme('facturation'),
        refreshTheme('paiement')
      ])
      
      dispatch({ type: 'REFRESH_ALL_ANALYTICS' })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { theme: 'global', error: 'Erreur refresh global' } })
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false })
    }
  }, [refreshTheme])

  // 🚀 AUTO-REFRESH INTELLIGENT SELON PATTERNS CONTEXT7 MCP
  useEffect(() => {
    if (!state.autoRefresh || eventsLoading || clientsLoading) return

    // Refresh initial au chargement (Protection undefined)
    if (events && clients && events.length > 0 && clients.length > 0) {
      refreshAllAnalytics()
    }
  }, [events?.length, clients?.length, eventsLoading, clientsLoading, state.autoRefresh, refreshAllAnalytics])

  useEffect(() => {
    if (!state.autoRefresh) return

    // Auto-refresh toutes les 5 minutes (patterns découverts)
    const interval = setInterval(() => {
      console.log('📊 AnalyticsContext - Auto-refresh intelligent')
      refreshAllAnalytics()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [state.autoRefresh, refreshAllAnalytics])

  // 🎯 CONTEXT VALUE OPTIMISÉ
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    // Computed values
    totalRevenue,
    totalClients, 
    overallHealthScore,
    performanceMetrics,
    // Helper functions
    setActiveTheme,
    setDateRange,
    setCustomRange,
    refreshTheme,
    refreshAllAnalytics,
    clearErrors,
    // Specialized getters
    getAnalyticsForTheme,
    isThemeLoading,
    getThemeError,
    getLastUpdated
  }), [
    state, totalRevenue, totalClients, overallHealthScore, performanceMetrics,
    setActiveTheme, setDateRange, setCustomRange, refreshTheme, refreshAllAnalytics, clearErrors,
    getAnalyticsForTheme, isThemeLoading, getThemeError, getLastUpdated
  ])

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

// 🎣 HOOKS SPÉCIALISÉS SELON PATTERNS CONTEXT7 MCP

// Hook principal
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Hook spécialisé pour un thème spécifique
export const useAnalyticsTheme = (theme: AnalyticsTheme) => {
  const { state, getAnalyticsForTheme, isThemeLoading, getThemeError, getLastUpdated, refreshTheme } = useAnalytics()
  
  return useMemo(() => ({
    data: getAnalyticsForTheme(theme),
    isLoading: isThemeLoading(theme),
    error: getThemeError(theme),
    lastUpdated: getLastUpdated(theme),
    refresh: () => refreshTheme(theme),
    isActive: state.activeTheme === theme
  }), [theme, getAnalyticsForTheme, isThemeLoading, getThemeError, getLastUpdated, refreshTheme, state.activeTheme])
}

// Hook pour analytics en temps réel
export const useAnalyticsMetrics = () => {
  const { totalRevenue, totalClients, overallHealthScore, performanceMetrics, state } = useAnalytics()
  
  return useMemo(() => ({
    totalRevenue,
    totalClients,
    overallHealthScore,
    performanceMetrics,
    healthStatus: overallHealthScore >= 80 ? 'excellent' : 
                  overallHealthScore >= 60 ? 'good' : 
                  overallHealthScore >= 40 ? 'warning' : 'critical',
    isHealthy: overallHealthScore >= 60,
    needsAttention: Object.values(state.errors).some(Boolean)
  }), [totalRevenue, totalClients, overallHealthScore, performanceMetrics, state.errors])
}

// Hook pour Top Clients
export const useTopClients = (limit: number = 5) => {
  const { state } = useAnalytics()
  
  return useMemo(() => {
    const topClients = state.topClients.topClients
      .sort((a, b) => b.totalBudget - a.totalBudget)
      .slice(0, limit)
    
    return {
      topClients,
      hasMore: state.topClients.topClients.length > limit,
      totalClients: state.topClients.totalClients,
      loyaltyDistribution: state.topClients.loyaltyDistribution
    }
  }, [state.topClients, limit])
}

// 🧮 FONCTIONS DE CALCUL ANALYTICS SELON PATTERNS DÉCOUVERTS

const calculateMissionAnalytics = async (events: any[]): Promise<MissionAnalytics> => {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const monthEvents = events.filter(event => 
    new Date(event.created_at) >= thisMonth
  )
  
  const completed = monthEvents.filter(e => e.status === 'COMPLETED').length
  const ongoing = monthEvents.filter(e => e.status === 'IN_PROGRESS').length
  const upcoming = monthEvents.filter(e => 
    new Date(e.event_date) > now && e.status === 'CONFIRMED'
  ).length
  
  const totalRevenue = monthEvents
    .filter(e => e.status === 'COMPLETED')
    .reduce((sum, e) => sum + (e.budget || 0), 0)
  
  return {
    totalEvents: monthEvents.length,
    completedEvents: completed,
    ongoingEvents: ongoing,
    upcomingEvents: upcoming,
    successRate: monthEvents.length > 0 ? (completed / monthEvents.length) * 100 : 0,
    avgDuration: 0, // À implémenter avec durée événements
    revenueGenerated: totalRevenue,
    floristsUtilization: 0 // À implémenter avec données fleuristes
  }
}

const calculateClientAnalytics = async (clients: any[], events: any[]): Promise<ClientAnalytics> => {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  const activeClients = clients.filter(client => 
    events.some(event => 
      event.client_id === client.id && 
      new Date(event.created_at) >= lastMonth
    )
  ).length
  
  const newClients = clients.filter(client => 
    new Date(client.created_at) >= thisMonth
  ).length

  // Top clients avec métriques business
  const topClients = clients.map(client => {
    const clientEvents = events.filter(e => e.client_id === client.id)
    const totalBudget = clientEvents.reduce((sum, e) => sum + (e.budget || 0), 0)
    const lastEvent = clientEvents
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())[0]
    
    // Calcul loyalty score (0-100)
    const eventCount = clientEvents.length
    const avgBudget = totalBudget / Math.max(eventCount, 1)
    const loyaltyScore = Math.min(100, (eventCount * 20) + (avgBudget / 1000 * 10))
    
    return {
      id: client.id,
      name: client.name,
      eventCount,
      totalBudget,
      avgEventValue: avgBudget,
      lastEventDate: lastEvent ? lastEvent.event_date : '',
      loyaltyScore: Math.round(loyaltyScore)
    }
  })

  // Distribution par ville
  const clientsByCity = clients.reduce((acc, client) => {
    const city = client.city || 'Non spécifié'
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {} as { [city: string]: number })

  // Distribution loyauté
  const loyaltyDistribution = topClients.reduce((acc, client) => {
    if (client.loyaltyScore >= 90) acc.platinum++
    else if (client.loyaltyScore >= 70) acc.gold++
    else if (client.loyaltyScore >= 50) acc.silver++
    else acc.bronze++
    return acc
  }, { bronze: 0, silver: 0, gold: 0, platinum: 0 })

  return {
    totalClients: clients.length,
    activeClients,
    newClients,
    topClients,
    clientsByCity,
    loyaltyDistribution
  }
}

const calculateBillingAnalytics = async (events: any[]): Promise<BillingAnalytics> => {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  // Événements facturables (complétés)
  const billableEvents = events.filter(e => e.status === 'COMPLETED')
  const thisMonthEvents = billableEvents.filter(e => 
    new Date(e.updated_at) >= thisMonth
  )
  const lastMonthEvents = billableEvents.filter(e => 
    new Date(e.updated_at) >= lastMonth && new Date(e.updated_at) < thisMonth
  )
  
  const totalRevenue = billableEvents.reduce((sum, e) => sum + (e.budget || 0), 0)
  const invoicedAmount = billableEvents
    .filter(e => e.invoiced)
    .reduce((sum, e) => sum + (e.budget || 0), 0)
  const paidAmount = billableEvents
    .filter(e => e.paid)
    .reduce((sum, e) => sum + (e.budget || 0), 0)
  
  const pendingAmount = invoicedAmount - paidAmount
  const overdueAmount = billableEvents
    .filter(e => e.invoiced && !e.paid && isPaymentOverdue(e))
    .reduce((sum, e) => sum + (e.budget || 0), 0)
  
  const avgInvoiceValue = billableEvents.length > 0 ? 
    totalRevenue / billableEvents.length : 0
    
  const conversionRate = billableEvents.length > 0 ? 
    (billableEvents.filter(e => e.paid).length / billableEvents.length) * 100 : 0
    
  const thisMonthRevenue = thisMonthEvents.reduce((sum, e) => sum + (e.budget || 0), 0)
  const lastMonthRevenue = lastMonthEvents.reduce((sum, e) => sum + (e.budget || 0), 0)
  const monthlyGrowth = lastMonthRevenue > 0 ? 
    ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
  
  return {
    totalRevenue,
    invoicedAmount,
    pendingAmount,
    overdueAmount,
    paidAmount,
    avgInvoiceValue,
    conversionRate,
    monthlyGrowth
  }
}

const calculatePaymentMetrics = async (events: any[]): Promise<PaymentMetrics> => {
  const paidEvents = events.filter(e => 
    e.status === 'COMPLETED' && 
    e.paid && 
    e.invoiced_at && 
    e.paid_at
  )
  
  if (paidEvents.length === 0) {
    return {
      avgPaymentDelay: 0,
      rapideCount: 0,
      correctCount: 0,
      lentCount: 0,
      totalEvents: 0
    }
  }
  
  const delays = paidEvents.map(event => {
    const invoiceDate = new Date(event.invoiced_at)
    const paidDate = new Date(event.paid_at)
    const delayMs = paidDate.getTime() - invoiceDate.getTime()
    return Math.max(0, Math.round(delayMs / (1000 * 60 * 60 * 24)))
  })
  
  const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length
  const rapideCount = delays.filter(d => d <= 1).length
  const correctCount = delays.filter(d => d >= 2 && d <= 3).length
  const lentCount = delays.filter(d => d > 3).length
  
  // Génération du challenge mensuel
  const challenge = generateMonthlyChallenge({
    avgPaymentDelay: avgDelay,
    rapideCount,
    correctCount,
    lentCount,
    totalEvents: paidEvents.length
  })
  
  return {
    avgPaymentDelay: avgDelay,
    rapideCount,
    correctCount,
    lentCount,
    totalEvents: paidEvents.length,
    challenge
  }
}

// 🎯 GÉNÉRATION CHALLENGE MENSUEL SELON PATTERNS DÉCOUVERTS
const generateMonthlyChallenge = (metrics: PaymentMetrics): MonthlyChallenge => {
  const { avgPaymentDelay, rapideCount, correctCount, lentCount, totalEvents } = metrics
  
  // Objectif : réduire le délai moyen
  const targetAvg = Math.max(1, avgPaymentDelay - 0.5)
  const improvement = avgPaymentDelay > 0 ? 
    ((avgPaymentDelay - targetAvg) / avgPaymentDelay) * 100 : 0
  
  // Calcul du statut basé sur performance
  let status: MonthlyChallenge['status']
  let message: string
  
  if (avgPaymentDelay <= 1.5) {
    status = 'excellent'
    message = '🏆 Performance exceptionnelle ! Vos clients paient rapidement.'
  } else if (avgPaymentDelay <= 2.5) {
    status = 'good'
    message = '✅ Bonne performance. Continuez sur cette lancée !'
  } else if (avgPaymentDelay <= 4) {
    status = 'warning'
    message = '⚠️ Délais corrects mais améliorables. Objectif -0.5 jour.'
  } else {
    status = 'urgent'
    message = '🚨 Délais trop longs ! Action urgente requise.'
  }
  
  return { targetAvg, improvement, status, message }
}

// 🔧 UTILITY FUNCTIONS
const isPaymentOverdue = (event: any): boolean => {
  if (!event.invoiced_at || event.paid) return false
  
  const invoiceDate = new Date(event.invoiced_at)
  const now = new Date()
  const daysSinceInvoice = (now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
  
  return daysSinceInvoice > 30 // Plus de 30 jours = en retard
}

// 🎯 CALCUL CROISSANCE ROBUSTE (GESTION EDGE CASES)
export const calculateGrowthPercentage = (current: number, previous: number): number => {
  if (previous === 0 && current === 0) return 0    // 0 → 0
  if (previous === 0 && current > 0) return 100   // 0 → X  
  if (previous > 0 && current === 0) return -100  // X → 0
  
  return ((current - previous) / previous) * 100  // Calcul normal
}
