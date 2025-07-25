import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { Event, EventStatus } from '@/types'
import { eventRepository } from '@/repositories/SupabaseRepositories'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'

// 🔥 EVENT STATE INTERFACE
interface EventState {
  events: Event[]
  loading: boolean
  error: string | null
  filters: EventFilters
  currentEvent: Event | null
  realTimeConnected: boolean
}

interface EventFilters {
  status?: EventStatus
  dateRange?: { start: Date; end: Date }
  clientId?: string
  floristId?: string
  search?: string
}

// 🔥 ACTIONS TYPÉES
type EventAction = 
  | { type: 'LOAD_EVENTS_START' }
  | { type: 'LOAD_EVENTS_SUCCESS'; payload: Event[] }
  | { type: 'LOAD_EVENTS_ERROR'; payload: string }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<Event> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_CURRENT_EVENT'; payload: Event | null }
  | { type: 'SET_FILTERS'; payload: Partial<EventFilters> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_REALTIME_STATUS'; payload: boolean }
  | { type: 'REALTIME_EVENT_UPDATE'; payload: { eventType: string; new: Event; old?: Event } }

// 🔥 REDUCER AVEC IMMUTABILITY PATTERNS
const eventReducer = (state: EventState, action: EventAction): EventState => {
  switch (action.type) {
    case 'LOAD_EVENTS_START':
      return { ...state, loading: true, error: null }
      
    case 'LOAD_EVENTS_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        events: action.payload,
        error: null 
      }
      
    case 'LOAD_EVENTS_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      }
      
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload]
      }
      
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event => 
          event.id === action.payload.id 
            ? { ...event, ...action.payload.updates }
            : event
        ),
        currentEvent: state.currentEvent?.id === action.payload.id
          ? { ...state.currentEvent, ...action.payload.updates }
          : state.currentEvent
      }
      
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        currentEvent: state.currentEvent?.id === action.payload ? null : state.currentEvent
      }
      
    case 'SET_CURRENT_EVENT':
      return { ...state, currentEvent: action.payload }
      
    case 'SET_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload } 
      }
      
    case 'CLEAR_ERROR':
      return { ...state, error: null }
      
    case 'SET_REALTIME_STATUS':
      return { ...state, realTimeConnected: action.payload }
      
    case 'REALTIME_EVENT_UPDATE':
      const { eventType, new: newRecord, old: oldRecord } = action.payload
      
      switch (eventType) {
        case 'INSERT':
          return {
            ...state,
            events: [...state.events, newRecord]
          }
        case 'UPDATE':
          return {
            ...state,
            events: state.events.map(event =>
              event.id === newRecord.id ? newRecord : event
            )
          }
        case 'DELETE':
          return {
            ...state,
            events: state.events.filter(event => event.id !== newRecord.id)
          }
        default:
          return state
      }
      
    default:
      return state
  }
}

// 🔥 INITIAL STATE
const initialEventState: EventState = {
  events: [],
  loading: false,
  error: null,
  filters: {},
  currentEvent: null,
  realTimeConnected: false
}

// 🔥 CONTEXT INTERFACE
interface EventContextType {
  state: EventState
  // CRUD Operations
  loadEvents: () => Promise<void>
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  // Utility
  setCurrentEvent: (event: Event | null) => void
  setFilters: (filters: Partial<EventFilters>) => void
  clearError: () => void
  // Selectors
  getEventById: (id: string) => Event | undefined
  getFilteredEvents: () => Event[]
  getEventsByStatus: (status: EventStatus) => Event[]
  getUpcomingEvents: (days?: number) => Event[]
}

const EventContext = createContext<EventContextType | null>(null)

// 🔥 EVENT PROVIDER AVEC REAL-TIME
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(eventReducer, initialEventState)

  // 🔥 LOAD EVENTS AVEC ERROR HANDLING
  const loadEvents = useCallback(async () => {
    if (!user) return
    
    dispatch({ type: 'LOAD_EVENTS_START' })
    try {
      const events = await eventRepository.findAll(user.id)
      dispatch({ type: 'LOAD_EVENTS_SUCCESS', payload: events })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_EVENTS_ERROR', 
        payload: 'Erreur lors du chargement des événements' 
      })
      console.error('Error loading events:', error)
    }
  }, [user])

  // 🔥 CREATE EVENT AVEC OPTIMISTIC UPDATE
  const createEvent = useCallback(async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return
    
    try {
      const event = await eventRepository.create(eventData)
      dispatch({ type: 'ADD_EVENT', payload: event })
    } catch (error) {
      dispatch({ 
        type: 'LOAD_EVENTS_ERROR', 
        payload: 'Erreur lors de la création de l\'événement' 
      })
      console.error('Error creating event:', error)
    }
  }, [user])

  // 🔥 UPDATE EVENT AVEC OPTIMISTIC UPDATE
  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } })
      
      await eventRepository.update(id, updates)
    } catch (error) {
      // Rollback on error - reload data
      loadEvents()
      dispatch({ 
        type: 'LOAD_EVENTS_ERROR', 
        payload: 'Erreur lors de la mise à jour de l\'événement' 
      })
      console.error('Error updating event:', error)
    }
  }, [loadEvents])

  // 🔥 DELETE EVENT AVEC OPTIMISTIC UPDATE
  const deleteEvent = useCallback(async (id: string) => {
    try {
      // Optimistic update
      dispatch({ type: 'DELETE_EVENT', payload: id })
      
      await eventRepository.delete(id)
    } catch (error) {
      // Rollback on error - reload data
      loadEvents()
      dispatch({ 
        type: 'LOAD_EVENTS_ERROR', 
        payload: 'Erreur lors de la suppression de l\'événement' 
      })
      console.error('Error deleting event:', error)
    }
  }, [loadEvents])

  // 🔥 UTILITY FUNCTIONS
  const setCurrentEvent = useCallback((event: Event | null) => {
    dispatch({ type: 'SET_CURRENT_EVENT', payload: event })
  }, [])

  const setFilters = useCallback((filters: Partial<EventFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  // 🔥 SELECTORS OPTIMISÉS
  const getEventById = useCallback((id: string) => {
    return state.events.find(event => event.id === id)
  }, [state.events])

  const getFilteredEvents = useCallback(() => {
    let filtered = state.events

    if (state.filters.status) {
      filtered = filtered.filter(event => event.status === state.filters.status)
    }

    if (state.filters.clientId) {
      filtered = filtered.filter(event => event.clientId === state.filters.clientId)
    }

    if (state.filters.search) {
      const search = state.filters.search.toLowerCase()
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.clientName?.toLowerCase().includes(search)
      )
    }

    if (state.filters.dateRange) {
      const { start, end } = state.filters.dateRange
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= start && eventDate <= end
      })
    }

    return filtered
  }, [state.events, state.filters])

  const getEventsByStatus = useCallback((status: EventStatus) => {
    return state.events.filter(event => event.status === status)
  }, [state.events])

  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date()
    const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))
    
    return state.events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= future
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [state.events])

  // 🔥 REAL-TIME SUBSCRIPTIONS SUPABASE
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('events_realtime')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'events',
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          dispatch({ 
            type: 'REALTIME_EVENT_UPDATE', 
            payload: {
              eventType: payload.eventType,
              new: payload.new as Event,
              old: payload.old as Event
            }
          })
        }
      )
      .subscribe((status) => {
        dispatch({ 
          type: 'SET_REALTIME_STATUS', 
          payload: status === 'SUBSCRIBED' 
        })
        console.log('📡 Events real-time status:', status)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // 🔥 LOAD EVENTS ON USER CHANGE
  useEffect(() => {
    if (user) {
      loadEvents()
    } else {
      // Clear events when user logs out
      dispatch({ type: 'LOAD_EVENTS_SUCCESS', payload: [] })
    }
  }, [user, loadEvents])

  const value = {
    state,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    setCurrentEvent,
    setFilters,
    clearError,
    getEventById,
    getFilteredEvents,
    getEventsByStatus,
    getUpcomingEvents
  }

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}

// 🔥 HOOK PRINCIPAL
export const useEvents = () => {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEvents must be used within EventProvider')
  }
  return context
}

// 🔥 HOOKS SPÉCIALISÉS
export const useEvent = (id: string) => {
  const { getEventById } = useEvents()
  return getEventById(id)
}

export const useUpcomingEvents = (days?: number) => {
  const { getUpcomingEvents } = useEvents()
  return getUpcomingEvents(days)
}

export const useEventsByStatus = (status: EventStatus) => {
  const { getEventsByStatus } = useEvents()
  return getEventsByStatus(status)
}
