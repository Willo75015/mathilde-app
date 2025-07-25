// 🌸 MATHILDE APP - DASHBOARD CONTEXT OPTIMIZED
// 🎯 Chunk 2: Dashboard Context avec patterns découverts via recherche EXA
// 🔥 Architecture basée sur useReducer pattern pour state complexe

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { Event, Client, EventStatus } from '@/types'
import { useEventSync } from '@/hooks/useEventSync'
import { useCurrentTime } from '@/hooks/useCurrentTime'

// 📊 DASHBOARD STATE INTERFACE - Patterns EXA découverts
interface DashboardState {
  // 🎯 Section States (4 domaines découverts dans analyse)
  urgentEvents: (Event & { urgency: UrgencyLevel })[]
  businessMetrics: BusinessMetrics
  cashFlow: CashFlowData
  strategicPlanning: StrategicPlanningData
  
  // 🔄 Loading States (par section pour UX optimale)
  loading: {
    urgent: boolean
    metrics: boolean
    cashFlow: boolean
    planning: boolean
    global: boolean
  }
  
  // ⚠️ Error States (gestion robuste des erreurs)
  errors: {
    urgent: string | null
    metrics: string | null
    cashFlow: string | null
    planning: string | null
    global: string | null
  }
  
  // 📈 Meta States
  lastUpdated: {
    urgent: Date | null
    metrics: Date | null
    cashFlow: Date | null
    planning: Date | null
  }
  
  // 🎮 UI States
  showMoreUrgent: boolean
  refreshing: boolean
  autoRefresh: boolean
  selectedTimeRange: TimeRange
}

// 🎯 TYPES MÉTIER DÉCOUVERTS
interface UrgencyLevel {
  score: number // 0-100
  level: 'low' | 'medium' | 'high' | 'critical'
  reasons: string[]
  daysUntilEvent: number
  floristStatus: 'assigned' | 'partial' | 'missing'
  paymentStatus: 'pending' | 'overdue' | 'blocked'
}

interface BusinessMetrics {
  currentMonthRevenue: number
  revenueGrowth: number
  activeClients: number
  clientGrowth: number
  eventConversion: number
  avgEventValue: number
  teamUtilization: number
  satisfactionScore: number
}

interface CashFlowData {
  eventsToInvoice: Event[]
  totalPendingRevenue: number
  overdueInvoices: Event[]
  avgPaymentDelay: number
  projectedCashFlow30: number
  paymentTrends: PaymentTrend[]
}

interface StrategicPlanningData {
  futureEvents: Event[]
  upcomingDeadlines: Event[]
  resourceConflicts: ResourceConflict[]
  capacityForecast: CapacityData[]
  seasonalTrends: SeasonalData[]
  strategicOpportunities: Opportunity[]
}

interface PaymentTrend {
  period: string
  averageDelay: number
  paymentRate: number
  volume: number
}

interface ResourceConflict {
  eventId: string
  conflictType: 'florist' | 'venue' | 'equipment'
  severity: 'low' | 'medium' | 'high'
  suggestedResolution: string
}

interface CapacityData {
  date: string
  events: number
  floristsAvailable: number
  utilization: number
  recommendation: string
}

interface SeasonalData {
  month: string
  historicalEvents: number
  projectedDemand: number
  profitability: number
}

interface Opportunity {
  type: 'client' | 'upsell' | 'expansion'
  description: string
  estimatedValue: number
  effort: 'low' | 'medium' | 'high'
  priority: number
}

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year'

// 🔄 DASHBOARD ACTIONS - Pattern useReducer découvert via EXA
type DashboardAction =
  // 🎯 Data Loading Actions
  | { type: 'LOAD_URGENT_EVENTS'; payload: { events: Event[], urgencyData: UrgencyLevel[] } }
  | { type: 'LOAD_BUSINESS_METRICS'; payload: BusinessMetrics }
  | { type: 'LOAD_CASH_FLOW'; payload: CashFlowData }
  | { type: 'LOAD_STRATEGIC_PLANNING'; payload: StrategicPlanningData }
  
  // 🔄 Loading States Actions
  | { type: 'SET_LOADING'; payload: { section: keyof DashboardState['loading'], loading: boolean } }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  
  // ⚠️ Error Handling Actions
  | { type: 'SET_ERROR'; payload: { section: keyof DashboardState['errors'], error: string | null } }
  | { type: 'CLEAR_ALL_ERRORS' }
  
  // 🎮 UI State Actions
  | { type: 'TOGGLE_SHOW_MORE_URGENT' }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'REFRESH_DASHBOARD' }
  
  // 📈 Real-time Updates
  | { type: 'UPDATE_EVENT_STATUS'; payload: { eventId: string, status: EventStatus } }
  | { type: 'UPDATE_LAST_REFRESH'; payload: { section: keyof DashboardState['lastUpdated'] } }

// 🏗️ INITIAL STATE - Architecture découverte
const initialDashboardState: DashboardState = {
  urgentEvents: [],
  businessMetrics: {
    currentMonthRevenue: 0,
    revenueGrowth: 0,
    activeClients: 0,
    clientGrowth: 0,
    eventConversion: 0,
    avgEventValue: 0,
    teamUtilization: 0,
    satisfactionScore: 0
  },
  cashFlow: {
    eventsToInvoice: [],
    totalPendingRevenue: 0,
    overdueInvoices: [],
    avgPaymentDelay: 0,
    projectedCashFlow30: 0,
    paymentTrends: []
  },
  strategicPlanning: {
    futureEvents: [],
    upcomingDeadlines: [],
    resourceConflicts: [],
    capacityForecast: [],
    seasonalTrends: [],
    strategicOpportunities: []
  },
  loading: {
    urgent: false,
    metrics: false,
    cashFlow: false,
    planning: false,
    global: false
  },
  errors: {
    urgent: null,
    metrics: null,
    cashFlow: null,
    planning: null,
    global: null
  },
  lastUpdated: {
    urgent: null,
    metrics: null,
    cashFlow: null,
    planning: null
  },
  showMoreUrgent: false,
  refreshing: false,
  autoRefresh: true,
  selectedTimeRange: 'month'
}

// 🧠 DASHBOARD REDUCER - Pattern useReducer optimal découvert
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'LOAD_URGENT_EVENTS':
      return {
        ...state,
        urgentEvents: action.payload.events.map((event, index) => ({
          ...event,
          urgency: action.payload.urgencyData[index] || {
            score: 0,
            level: 'low',
            reasons: [],
            daysUntilEvent: 999,
            floristStatus: 'missing',
            paymentStatus: 'pending'
          }
        })),
        loading: { ...state.loading, urgent: false },
        errors: { ...state.errors, urgent: null },
        lastUpdated: { ...state.lastUpdated, urgent: new Date() }
      }

    case 'LOAD_BUSINESS_METRICS':
      return {
        ...state,
        businessMetrics: action.payload,
        loading: { ...state.loading, metrics: false },
        errors: { ...state.errors, metrics: null },
        lastUpdated: { ...state.lastUpdated, metrics: new Date() }
      }

    case 'LOAD_CASH_FLOW':
      return {
        ...state,
        cashFlow: action.payload,
        loading: { ...state.loading, cashFlow: false },
        errors: { ...state.errors, cashFlow: null },
        lastUpdated: { ...state.lastUpdated, cashFlow: new Date() }
      }

    case 'LOAD_STRATEGIC_PLANNING':
      return {
        ...state,
        strategicPlanning: action.payload,
        loading: { ...state.loading, planning: false },
        errors: { ...state.errors, planning: null },
        lastUpdated: { ...state.lastUpdated, planning: new Date() }
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.section]: action.payload.loading }
      }

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        refreshing: action.payload,
        loading: {
          urgent: action.payload,
          metrics: action.payload,
          cashFlow: action.payload,
          planning: action.payload,
          global: action.payload
        }
      }

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.section]: action.payload.error },
        loading: { ...state.loading, [action.payload.section]: false }
      }

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {
          urgent: null,
          metrics: null,
          cashFlow: null,
          planning: null,
          global: null
        }
      }

    case 'TOGGLE_SHOW_MORE_URGENT':
      return {
        ...state,
        showMoreUrgent: !state.showMoreUrgent
      }

    case 'SET_AUTO_REFRESH':
      return {
        ...state,
        autoRefresh: action.payload
      }

    case 'SET_TIME_RANGE':
      return {
        ...state,
        selectedTimeRange: action.payload
      }

    case 'REFRESH_DASHBOARD':
      return {
        ...state,
        refreshing: true,
        loading: {
          urgent: true,
          metrics: true,
          cashFlow: true,
          planning: true,
          global: true
        }
      }

    case 'UPDATE_EVENT_STATUS':
      return {
        ...state,
        urgentEvents: state.urgentEvents.map(event =>
          event.id === action.payload.eventId
            ? { ...event, status: action.payload.status }
            : event
        ),
        cashFlow: {
          ...state.cashFlow,
          eventsToInvoice: state.cashFlow.eventsToInvoice.map(event =>
            event.id === action.payload.eventId
              ? { ...event, status: action.payload.status }
              : event
          )
        }
      }

    case 'UPDATE_LAST_REFRESH':
      return {
        ...state,
        lastUpdated: { ...state.lastUpdated, [action.payload.section]: new Date() }
      }

    default:
      return state
  }
}

// 🎯 CONTEXT DEFINITION
interface DashboardContextType {
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  
  // 🚀 Computed Values (mémorisés pour performance)
  totalUrgentCount: number
  criticalEventsCount: number
  revenueAtRisk: number
  overallHealthScore: number
  
  // 🛠️ Helper Functions
  calculateUrgency: (event: Event) => UrgencyLevel
  refreshSection: (section: keyof DashboardState['loading']) => void
  refreshAll: () => void
  getMetricsTrend: (metric: keyof BusinessMetrics) => 'up' | 'down' | 'stable'
}

// 🏗️ CONTEXT CREATION
const DashboardContext = createContext<DashboardContextType | null>(null)

// 🎯 CUSTOM HOOK pour utiliser le context
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

// 🔧 HELPER FUNCTIONS - Business Logic
const calculateUrgency = (event: Event): UrgencyLevel => {
  const now = new Date()
  const eventDate = new Date(event.date)
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  let score = 0
  const reasons: string[] = []
  
  // Time urgency
  if (daysUntilEvent <= 1) {
    score += 50
    reasons.push('Événement dans moins de 24h')
  } else if (daysUntilEvent <= 3) {
    score += 30
    reasons.push('Événement dans 3 jours')
  } else if (daysUntilEvent <= 7) {
    score += 15
    reasons.push('Événement cette semaine')
  }
  
  // Florist assignment urgency
  const assignedFlorists = event.assignedFlorists?.length || 0
  const requiredFlorists = event.floristsRequired || 1
  const floristStatus = assignedFlorists >= requiredFlorists ? 'assigned' : 
                       assignedFlorists > 0 ? 'partial' : 'missing'
  
  if (floristStatus === 'missing') {
    score += 40
    reasons.push('Aucun fleuriste assigné')
  } else if (floristStatus === 'partial') {
    score += 20
    reasons.push('Fleuristes manquants')
  }
  
  // Payment urgency
  const paymentStatus = event.status === EventStatus.PAID ? 'paid' : 
                       event.status === EventStatus.INVOICED ? 'pending' : 'blocked'
  
  if (paymentStatus === 'blocked' && daysUntilEvent <= 7) {
    score += 30
    reasons.push('Paiement bloqué, événement proche')
  }
  
  // Budget urgency
  if (event.budget > 5000 && floristStatus !== 'assigned') {
    score += 10
    reasons.push('Événement haute valeur non sécurisé')
  }
  
  const level = score >= 80 ? 'critical' : 
               score >= 60 ? 'high' : 
               score >= 30 ? 'medium' : 'low'
  
  return {
    score,
    level,
    reasons,
    daysUntilEvent,
    floristStatus,
    paymentStatus
  }
}

// 🎯 DASHBOARD PROVIDER COMPONENT
interface DashboardProviderProps {
  children: ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState)
  const { events, clients } = useEventSync() // Récupère les données depuis EventContext
  const { currentTime } = useCurrentTime()   // Temps réel pour les calculs
  
  // 🚀 Computed Values - Mémorisés pour performance
  const totalUrgentCount = state.urgentEvents.length
  const criticalEventsCount = state.urgentEvents.filter(e => e.urgency.level === 'critical').length
  const revenueAtRisk = state.cashFlow.overdueInvoices.reduce((sum, event) => sum + event.budget, 0)
  const overallHealthScore = Math.round(
    (state.businessMetrics.eventConversion * 0.3) +
    (state.businessMetrics.teamUtilization * 0.3) +
    (state.businessMetrics.satisfactionScore * 0.4)
  )
  
  // 🛠️ Helper Functions
  const refreshSection = (section: keyof DashboardState['loading']) => {
    dispatch({ type: 'SET_LOADING', payload: { section, loading: true } })
    // Logic to refetch specific section data would go here
    dispatch({ type: 'UPDATE_LAST_REFRESH', payload: { section } })
  }
  
  const refreshAll = () => {
    dispatch({ type: 'REFRESH_DASHBOARD' })
    // Logic to refetch all data would go here
  }
  
  const getMetricsTrend = (metric: keyof BusinessMetrics): 'up' | 'down' | 'stable' => {
    // Simplified trend calculation - would be more sophisticated in real implementation
    const currentValue = state.businessMetrics[metric] as number
    return currentValue > 0 ? 'up' : currentValue < 0 ? 'down' : 'stable'
  }
  
  // 🔄 Auto-refresh Effect
  useEffect(() => {
    if (state.autoRefresh) {
      const interval = setInterval(() => {
        refreshAll()
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [state.autoRefresh])
  
  // 📊 Data Processing Effects
  useEffect(() => {
    if (events.length > 0) {
      // Calculate urgent events
      const urgentEvents = events
        .filter(event => {
          const urgency = calculateUrgency(event)
          return urgency.level === 'high' || urgency.level === 'critical'
        })
        .slice(0, state.showMoreUrgent ? 100 : 6)
        .sort((a, b) => {
          const urgencyA = calculateUrgency(a)
          const urgencyB = calculateUrgency(b)
          return urgencyB.score - urgencyA.score
        })
      
      const urgencyData = urgentEvents.map(calculateUrgency)
      
      dispatch({
        type: 'LOAD_URGENT_EVENTS',
        payload: { events: urgentEvents, urgencyData }
      })
      
      // Calculate business metrics
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const currentMonthEvents = events.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
      })
      
      const businessMetrics: BusinessMetrics = {
        currentMonthRevenue: currentMonthEvents
          .filter(e => e.status === EventStatus.PAID)
          .reduce((sum, e) => sum + e.budget, 0),
        revenueGrowth: 0, // Would calculate from previous month
        activeClients: clients.length,
        clientGrowth: 0, // Would calculate from previous period
        eventConversion: 0, // Would calculate from leads
        avgEventValue: events.reduce((sum, e) => sum + e.budget, 0) / events.length || 0,
        teamUtilization: 0, // Would calculate from florist assignments
        satisfactionScore: 0 // Would calculate from client feedback
      }
      
      dispatch({ type: 'LOAD_BUSINESS_METRICS', payload: businessMetrics })
      
      // Calculate cash flow data
      const eventsToInvoice = events.filter(e => 
        e.status === EventStatus.COMPLETED && 
        !e.archived && 
        new Date(e.date) <= now
      )
      
      const overdueInvoices = events.filter(e => {
        if (e.status !== EventStatus.INVOICED) return false
        const invoiceDate = new Date(e.updatedAt || e.date)
        const daysSince = (now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysSince > 30 // Overdue after 30 days
      })
      
      const cashFlow: CashFlowData = {
        eventsToInvoice,
        totalPendingRevenue: eventsToInvoice.reduce((sum, e) => sum + e.budget, 0),
        overdueInvoices,
        avgPaymentDelay: 0, // Would calculate from payment history
        projectedCashFlow30: 0, // Would project from upcoming events
        paymentTrends: [] // Would calculate from historical data
      }
      
      dispatch({ type: 'LOAD_CASH_FLOW', payload: cashFlow })
      
      // Calculate strategic planning data
      const futureEvents = events.filter(e => new Date(e.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      const strategicPlanning: StrategicPlanningData = {
        futureEvents,
        upcomingDeadlines: futureEvents.slice(0, 10),
        resourceConflicts: [], // Would detect conflicts
        capacityForecast: [], // Would forecast capacity
        seasonalTrends: [], // Would analyze historical patterns
        strategicOpportunities: [] // Would identify opportunities
      }
      
      dispatch({ type: 'LOAD_STRATEGIC_PLANNING', payload: strategicPlanning })
    }
  }, [events, clients, state.showMoreUrgent])
  
  const contextValue: DashboardContextType = {
    state,
    dispatch,
    totalUrgentCount,
    criticalEventsCount,
    revenueAtRisk,
    overallHealthScore,
    calculateUrgency,
    refreshSection,
    refreshAll,
    getMetricsTrend
  }
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

export default DashboardContext