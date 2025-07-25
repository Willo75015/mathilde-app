import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import { useApp } from './AppContextSupabase'
import { useTime } from './TimeContext'
import { useEventTimeSync } from '@/hooks/useEventTimeSync'
import { Event, EventStatus } from '@/types'

// 📅 TYPES CALENDAR CONTEXT
type ViewMode = 'calendrier' | 'kanban'

interface CalendarState {
  // Vue et navigation
  viewMode: ViewMode
  selectedDay: string | null
  selectedClient: any | null
  
  // Gestion événements
  selectedEvent: Event | null
  highlightedEventTitle: string | null
  expandedFloristsEventId: string | null
  
  // Modals state
  isEventModalOpen: boolean
  isArchiveModalOpen: boolean
  isPaymentModalOpen: boolean
  selectedEventForArchive: Event | null
  selectedEventForPayment: Event | null
  
  // UI state
  loading: boolean
  error: string | null
  refreshing: boolean
}

type CalendarAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SELECTED_DAY'; payload: string | null }
  | { type: 'SET_SELECTED_CLIENT'; payload: any | null }
  | { type: 'SET_SELECTED_EVENT'; payload: Event | null }
  | { type: 'SET_HIGHLIGHTED_EVENT_TITLE'; payload: string | null }
  | { type: 'SET_EXPANDED_FLORISTS_EVENT_ID'; payload: string | null }
  | { type: 'SET_EVENT_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_ARCHIVE_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_PAYMENT_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_SELECTED_EVENT_FOR_ARCHIVE'; payload: Event | null }
  | { type: 'SET_SELECTED_EVENT_FOR_PAYMENT'; payload: Event | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'RESET_MODALS' }

// 🎯 INITIAL STATE
const initialState: CalendarState = {
  viewMode: 'calendrier',
  selectedDay: null,
  selectedClient: null,
  selectedEvent: null,
  highlightedEventTitle: null,
  expandedFloristsEventId: null,
  isEventModalOpen: false,
  isArchiveModalOpen: false,
  isPaymentModalOpen: false,
  selectedEventForArchive: null,
  selectedEventForPayment: null,
  loading: false,
  error: null,
  refreshing: false
}

// 🔄 REDUCER (Patterns Context7 MCP)
const calendarReducer = (state: CalendarState, action: CalendarAction): CalendarState => {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.payload }
    
    case 'SET_SELECTED_CLIENT':
      return { ...state, selectedClient: action.payload }
    
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload }
    
    case 'SET_HIGHLIGHTED_EVENT_TITLE':
      return { ...state, highlightedEventTitle: action.payload }
    
    case 'SET_EXPANDED_FLORISTS_EVENT_ID':
      return { ...state, expandedFloristsEventId: action.payload }
    
    case 'SET_EVENT_MODAL_OPEN':
      return { ...state, isEventModalOpen: action.payload }
    
    case 'SET_ARCHIVE_MODAL_OPEN':
      return { ...state, isArchiveModalOpen: action.payload }
    
    case 'SET_PAYMENT_MODAL_OPEN':
      return { ...state, isPaymentModalOpen: action.payload }
    
    case 'SET_SELECTED_EVENT_FOR_ARCHIVE':
      return { ...state, selectedEventForArchive: action.payload }
    
    case 'SET_SELECTED_EVENT_FOR_PAYMENT':
      return { ...state, selectedEventForPayment: action.payload }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload }
    
    case 'RESET_MODALS':
      return {
        ...state,
        isEventModalOpen: false,
        isArchiveModalOpen: false,
        isPaymentModalOpen: false,
        selectedEvent: null,
        selectedEventForArchive: null,
        selectedEventForPayment: null
      }
    
    default:
      return state
  }
}

// 🎯 CALENDAR CONTEXT
interface CalendarContextType {
  state: CalendarState
  dispatch: React.Dispatch<CalendarAction>
  
  // 📅 Navigation helpers (memoized)
  eventsForSelectedDay: Event[]
  eventsForCurrentMonth: Event[]
  cancelledEventsForMonth: Event[]
  clientsOfMonth: any[]
  
  // 🎯 Actions helpers (useCallback optimized)
  setViewMode: (mode: ViewMode) => void
  selectDay: (day: string | null) => void
  selectClient: (client: any | null) => void
  handleEventClick: (event: Event) => void
  handleCreateEvent: () => void
  highlightEventTitle: (title: string | null) => void
  toggleFloristsExpansion: (eventId: string | null) => void
  
  // 💰 Billing workflow helpers
  handleArchiveAndInvoice: (event: Event) => void
  handlePaymentTracking: (event: Event) => void
  closeAllModals: () => void
  
  // 🔄 Sync helpers
  refreshCalendar: () => Promise<void>
  
  // 📊 Computed values (memoized performance)
  calendarMetrics: {
    totalEventsThisMonth: number
    urgentEventsCount: number
    completedEventsCount: number
    revenueAtRisk: number
  }
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

// 🚀 CALENDAR PROVIDER (Patterns React Big Calendar)
export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, initialState)
  const { state: appState } = useApp()
  const { currentDate } = useTime()
  const { syncEventStatuses } = useEventTimeSync()
  
  const events = appState.events || []
  
  // 📅 MEMOIZED SELECTORS (Performance patterns Context7 MCP)
  const eventsForSelectedDay = useMemo(() => {
    if (!state.selectedDay) return []
    
    return events.filter(event => {
      if (!event.event_date) return false
      const eventDate = new Date(event.event_date).toDateString()
      const selectedDate = new Date(state.selectedDay!).toDateString()
      return eventDate === selectedDate
    })
  }, [events, state.selectedDay])
  
  const eventsForCurrentMonth = useMemo(() => {
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    return events.filter(event => {
      if (!event.event_date) return false
      const eventDate = new Date(event.event_date)
      return eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear &&
             event.status !== 'CANCELLED'
    })
  }, [events, currentDate])
  
  const cancelledEventsForMonth = useMemo(() => {
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    return events.filter(event => {
      if (!event.event_date) return false
      const eventDate = new Date(event.event_date)
      return eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear &&
             event.status === 'CANCELLED'
    })
  }, [events, currentDate])
  
  const clientsOfMonth = useMemo(() => {
    const clientsMap = new Map()
    
    eventsForCurrentMonth.forEach(event => {
      if (event.client_id) {
        const clientId = event.client_id
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            client: event.client,
            events: [],
            totalBudget: 0,
            nextEventDate: null
          })
        }
        
        const clientData = clientsMap.get(clientId)
        clientData.events.push(event)
        clientData.totalBudget += event.budget || 0
        
        // Trouver la prochaine date d'événement
        const eventDate = new Date(event.event_date)
        if (!clientData.nextEventDate || eventDate < clientData.nextEventDate) {
          clientData.nextEventDate = eventDate
        }
      }
    })
    
    return Array.from(clientsMap.values())
  }, [eventsForCurrentMonth])
  
  // 📊 COMPUTED METRICS (Memoized)
  const calendarMetrics = useMemo(() => {
    const totalEventsThisMonth = eventsForCurrentMonth.length
    const urgentEventsCount = eventsForCurrentMonth.filter(event => {
      // Logic urgence basée sur date et statut
      const eventDate = new Date(event.event_date)
      const now = new Date()
      const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 7 && event.status === 'PENDING'
    }).length
    
    const completedEventsCount = eventsForCurrentMonth.filter(event => 
      event.status === 'COMPLETED'
    ).length
    
    const revenueAtRisk = eventsForCurrentMonth
      .filter(event => event.status === 'COMPLETED' && !event.invoiced)
      .reduce((sum, event) => sum + (event.budget || 0), 0)
    
    return {
      totalEventsThisMonth,
      urgentEventsCount,
      completedEventsCount,
      revenueAtRisk
    }
  }, [eventsForCurrentMonth])
  
  // 🎯 OPTIMIZED ACTIONS (useCallback patterns)
  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }, [])
  
  const selectDay = useCallback((day: string | null) => {
    dispatch({ type: 'SET_SELECTED_DAY', payload: day })
  }, [])
  
  const selectClient = useCallback((client: any | null) => {
    dispatch({ type: 'SET_SELECTED_CLIENT', payload: client })
  }, [])
  
  const handleEventClick = useCallback((event: Event) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: event })
    dispatch({ type: 'SET_EVENT_MODAL_OPEN', payload: true })
  }, [])
  
  const handleCreateEvent = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: null })
    dispatch({ type: 'SET_EVENT_MODAL_OPEN', payload: true })
  }, [])
  
  const highlightEventTitle = useCallback((title: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_EVENT_TITLE', payload: title })
  }, [])
  
  const toggleFloristsExpansion = useCallback((eventId: string | null) => {
    dispatch({ type: 'SET_EXPANDED_FLORISTS_EVENT_ID', payload: eventId })
  }, [])
  
  // 💰 BILLING WORKFLOW HELPERS
  const handleArchiveAndInvoice = useCallback((event: Event) => {
    dispatch({ type: 'SET_SELECTED_EVENT_FOR_ARCHIVE', payload: event })
    dispatch({ type: 'SET_ARCHIVE_MODAL_OPEN', payload: true })
  }, [])
  
  const handlePaymentTracking = useCallback((event: Event) => {
    dispatch({ type: 'SET_SELECTED_EVENT_FOR_PAYMENT', payload: event })
    dispatch({ type: 'SET_PAYMENT_MODAL_OPEN', payload: true })
  }, [])
  
  const closeAllModals = useCallback(() => {
    dispatch({ type: 'RESET_MODALS' })
  }, [])
  
  // 🔄 REFRESH CALENDAR
  const refreshCalendar = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true })
    try {
      await syncEventStatuses()
      // Additional refresh logic if needed
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du rafraîchissement' })
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false })
    }
  }, [syncEventStatuses])
  
  // 🎯 CONTEXT VALUE (Memoized)
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    eventsForSelectedDay,
    eventsForCurrentMonth,
    cancelledEventsForMonth,
    clientsOfMonth,
    setViewMode,
    selectDay,
    selectClient,
    handleEventClick,
    handleCreateEvent,
    highlightEventTitle,
    toggleFloristsExpansion,
    handleArchiveAndInvoice,
    handlePaymentTracking,
    closeAllModals,
    refreshCalendar,
    calendarMetrics
  }), [
    state,
    eventsForSelectedDay,
    eventsForCurrentMonth,
    cancelledEventsForMonth,
    clientsOfMonth,
    setViewMode,
    selectDay,
    selectClient,
    handleEventClick,
    handleCreateEvent,
    highlightEventTitle,
    toggleFloristsExpansion,
    handleArchiveAndInvoice,
    handlePaymentTracking,
    closeAllModals,
    refreshCalendar,
    calendarMetrics
  ])
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  )
}

// 🎣 CUSTOM HOOK
export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}

// 🎯 SPECIALIZED HOOKS (Additional performance patterns)
export const useCalendarEvents = () => {
  const { eventsForSelectedDay, eventsForCurrentMonth, cancelledEventsForMonth } = useCalendar()
  return { eventsForSelectedDay, eventsForCurrentMonth, cancelledEventsForMonth }
}

export const useCalendarMetrics = () => {
  const { calendarMetrics } = useCalendar()
  return calendarMetrics
}

export const useCalendarNavigation = () => {
  const { state, setViewMode, selectDay, selectClient } = useCalendar()
  return {
    viewMode: state.viewMode,
    selectedDay: state.selectedDay,
    selectedClient: state.selectedClient,
    setViewMode,
    selectDay,
    selectClient
  }
}
