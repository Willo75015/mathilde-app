import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { AppState, Event, Client, EventStatus, Theme, Florist } from '@/types'
import { mockEvents, mockClients } from '@/lib/mockData'

// Interface du contexte ULTRA-STABLE
interface AppContextType {
  state: AppState
  actions: {
    updateEvent: (id: string, event: Partial<Event>) => void
    updateEventWithTeamCheck: (id: string, event: Partial<Event>) => void
    updateEventWithStatusDates: (id: string, newStatus: EventStatus) => void
    createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void
    deleteEvent: (id: string) => void
    updateClient: (id: string, client: Partial<Client>) => void
    createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void
    deleteClient: (id: string) => void
    setError: (error: string | null) => void
    setLoading: (loading: boolean) => void
    generateNotSelectedMessage: (floristName: string, eventTitle: string, eventDate: Date) => string
    syncClientNames: () => void
  }
}

const AppContext = createContext<AppContextType | null>(null)

// Fleuristes par défaut
const defaultFlorists: Florist[] = [
  {
    id: 'main-florist-bill',
    firstName: 'Bill',
    lastName: 'Billsantec',
    email: 'bill@mathilde-fleurs.com',
    phone: '+33 6 12 34 56 78',
    specialties: ['Mariage', 'Événement corporatif', 'Anniversaire'],
    experience: 'Expert',
    availability: 'available',
    rating: 4.9,
    isMainFlorist: true,
    unavailabilityPeriods: []
  },
  {
    id: '1',
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@mathilde-fleurs.com',
    phone: '+33 6 23 45 67 89',
    specialties: ['Mariage', 'Événement corporatif'],
    experience: 'Expert',
    availability: 'available',
    rating: 4.8,
    isMainFlorist: false,
    unavailabilityPeriods: []
  },
  {
    id: '2',
    firstName: 'Paul',
    lastName: 'Renault',
    email: 'paul.renault@mathilde-fleurs.com',
    phone: '+33 6 34 56 78 90',
    specialties: ['Anniversaire', 'Événement corporatif'],
    experience: 'Intermédiaire',
    availability: 'available',
    rating: 4.5,
    isMainFlorist: false,
    unavailabilityPeriods: []
  },
  {
    id: '3',
    firstName: 'Jean',
    lastName: 'Moreau',
    email: 'jean.moreau@mathilde-fleurs.com',
    phone: '+33 6 45 67 89 01',
    specialties: ['Baptême', 'Anniversaire'],
    experience: 'Expert',
    availability: 'available',
    rating: 4.7,
    isMainFlorist: false,
    unavailabilityPeriods: []
  },
  {
    id: '4',
    firstName: 'Sophie',
    lastName: 'Durand',
    email: 'sophie.durand@mathilde-fleurs.com',
    phone: '+33 6 56 78 90 12',
    specialties: ['Mariage', 'Baptême'],
    experience: 'Expert',
    availability: 'available',
    rating: 4.9,
    isMainFlorist: false,
    unavailabilityPeriods: []
  },
  {
    id: '5',
    firstName: 'Jean',
    lastName: 'Martin',
    email: 'jean.martin@mathilde-fleurs.com',
    phone: '+33 6 67 89 01 23',
    specialties: ['Anniversaire', 'Événement corporatif'],
    experience: 'Intermédiaire',
    availability: 'available',
    rating: 4.6,
    isMainFlorist: false,
    unavailabilityPeriods: []
  }
]

// PROVIDER ULTRA-STABLE - AUCUN EFFET DE BORD POSSIBLE
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // États simples
  const [events, setEvents] = useState<Event[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initRef = useRef(false)
  
  // INITIALISATION AVEC LOCALSTORAGE
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      
      // Essayer de charger depuis localStorage
      const storedEvents = localStorage.getItem('mathilde-events')
      const storedClients = localStorage.getItem('mathilde-clients')
      
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
          ...event,
          date: new Date(event.date),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        }))
        setEvents(parsedEvents)
        console.log('✅ Événements chargés depuis localStorage:', parsedEvents.length)
      } else {
        setEvents(mockEvents)
        console.log('✅ Événements mockés chargés')
      }
      
      if (storedClients) {
        const parsedClients = JSON.parse(storedClients).map((client: any) => ({
          ...client,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt)
        }))
        setClients(parsedClients)
        console.log('✅ Clients chargés depuis localStorage:', parsedClients.length)
      } else {
        setClients(mockClients)
        console.log('✅ Clients mockés chargés')
      }
      
      setIsLoading(false)
      console.log('✅ Données initialisées avec persistance')
    }
  }, [])
  
  // ACTIONS AVEC SAUVEGARDE LOCALE
  const updateEvent = (id: string, eventUpdate: Partial<Event>) => {
    setEvents(prev => {
      const updated = prev.map(event => 
        event.id === id ? { ...event, ...eventUpdate, updatedAt: new Date() } : event
      )
      localStorage.setItem('mathilde-events', JSON.stringify(updated))
      return updated
    })
  }
  
  // WORKFLOW AVEC SAUVEGARDE
  const updateEventWithTeamCheck = (id: string, eventUpdate: Partial<Event>) => {
    setEvents(prevEvents => {
      const currentEvent = prevEvents.find(e => e.id === id)
      if (!currentEvent) return prevEvents
      
      let finalUpdate = { ...eventUpdate }
      
      // LOGIQUE WORKFLOW SIMPLIFIÉE
      if (eventUpdate.assignedFlorists) {
        console.log('🎯 WORKFLOW - Traitement assignations:', eventUpdate.assignedFlorists.length)
        
        const requiredFlorists = currentEvent.floristsRequired || 2
        const confirmedFlorists = eventUpdate.assignedFlorists.filter(f => 
          f.status === 'confirmed' || f.isConfirmed
        )
        
        console.log('📊 WORKFLOW - État:', {
          required: requiredFlorists,
          confirmed: confirmedFlorists.length,
          shouldTrigger: confirmedFlorists.length >= requiredFlorists && confirmedFlorists.length > 0
        })
        
        // Si équipe complète, passer pending → not_selected
        if (confirmedFlorists.length >= requiredFlorists && confirmedFlorists.length > 0) {
          console.log('🔥 WORKFLOW - DÉCLENCHEMENT AUTO-SÉLECTION !')
          
          const updatedFlorists = eventUpdate.assignedFlorists.map(florist => {
            if (florist.status === 'pending') {
              const eventDate = eventUpdate.date || currentEvent.date || new Date()
              const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'numeric', 
                year: 'numeric'
              })
              
              const preWrittenMessage = `Bonjour ${florist.floristName?.split(' ')[0]},

L'événement "${eventUpdate.title || currentEvent.title}" du ${formattedDate} est pourvu.

Merci pour votre disponibilité !

Mathilde Fleurs`
              
              console.log('🚫 WORKFLOW - Fleuriste NON RETENU:', florist.floristName)
              
              return { 
                ...florist, 
                status: 'not_selected' as const,
                preWrittenMessage
              }
            }
            return florist
          })
          
          finalUpdate = { ...finalUpdate, assignedFlorists: updatedFlorists }
          console.log('✅ WORKFLOW - Fleuristes mis à jour:', updatedFlorists.map(f => `${f.floristName}: ${f.status}`))
        } else {
          console.log('⏸️ WORKFLOW - Pas assez de confirmés, pas de changement')
        }
      } else {
        console.log('ℹ️ WORKFLOW - Pas d\'assignations à traiter')
      }
      
      const updated = prevEvents.map(event => 
        event.id === id ? { ...event, ...finalUpdate, updatedAt: new Date() } : event
      )
      
      // 🔥 SAUVEGARDE CRITIQUE
      localStorage.setItem('mathilde-events', JSON.stringify(updated))
      return updated
    })
  }
  
  const updateEventWithStatusDates = (id: string, newStatus: EventStatus) => {
    setEvents(prev => prev.map(event => {
      if (event.id === id) {
        let updates: Partial<Event> = { status: newStatus, updatedAt: new Date() }
        
        switch (newStatus) {
          case EventStatus.COMPLETED:
            updates.completedDate = new Date()
            break
          case EventStatus.INVOICED:
            updates.completedDate = event.completedDate || new Date()
            updates.invoiced = true
            updates.invoiceDate = new Date()
            updates.archived = true
            break
          case EventStatus.PAID:
            updates.completedDate = event.completedDate || new Date()
            updates.paid = true
            updates.paidDate = new Date()
            updates.paymentMethod = 'transfer'
            break
        }
        
        return { ...event, ...updates }
      }
      return event
    }))
  }
  
  const createEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: eventData.title || 'Nouvel événement',
      description: eventData.description || '',
      date: eventData.date || new Date(),
      time: eventData.time || '09:00',
      location: eventData.location || 'À définir',
      budget: eventData.budget || 0,
      status: eventData.status || EventStatus.DRAFT,
      flowers: eventData.flowers || [],
      assignedFlorists: eventData.assignedFlorists || [],
      floristsRequired: eventData.floristsRequired || 1,
      clientId: eventData.clientId || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('🔥 CONTEXT - Événement créé:', newEvent)
    setEvents(prev => {
      const updated = [...prev, newEvent]
      localStorage.setItem('mathilde-events', JSON.stringify(updated))
      return updated
    })
    return newEvent
  }
  
  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id))
  }
  
  const updateClient = (id: string, clientUpdate: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...clientUpdate, updatedAt: new Date() } : client
    ))
  }
  
  const createClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setClients(prev => {
      const updated = [...prev, newClient]
      localStorage.setItem('mathilde-clients', JSON.stringify(updated))
      return updated
    })
  }
  
  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id))
  }
  
  const generateNotSelectedMessage = (floristName: string, eventTitle: string, eventDate: Date) => {
    const formattedDate = eventDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'numeric', 
      year: 'numeric'
    })
    
    return `Bonjour ${floristName},

L'événement "${eventTitle}" du ${formattedDate} est pourvu.

Merci pour votre disponibilité !

Mathilde Fleurs`
  }
  
  const syncClientNames = () => {
    // Pour l'instant, ne rien faire pour éviter les boucles
    console.log('🔄 Sync demandée (désactivée temporairement)')
  }
  
  // ÉTAT ET ACTIONS ULTRA-SIMPLES
  const state: AppState = {
    user: null,
    events,
    clients,
    flowers: [],
    florists: defaultFlorists,
    isLoading,
    error,
    theme: Theme.LIGHT
  }
  
  const actions = {
    updateEvent,
    updateEventWithTeamCheck,
    updateEventWithStatusDates,
    createEvent,
    deleteEvent,
    updateClient,
    createClient,
    deleteClient,
    setError,
    setLoading: setIsLoading,
    generateNotSelectedMessage,
    syncClientNames
  }
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  )
}

// HOOKS ULTRA-SIMPLES
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const useEvents = () => {
  const { state, actions } = useApp()
  
  const now = new Date()
  
  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    updateEvent: actions.updateEvent,
    updateEventWithTeamCheck: actions.updateEventWithTeamCheck,
    updateEventWithStatusDates: actions.updateEventWithStatusDates,
    createEvent: actions.createEvent,
    deleteEvent: actions.deleteEvent,
    
    // Computed values simples
    upcomingEvents: state.events.filter(event => event.date > now),
    eventStats: {
      total: state.events.length,
      completed: state.events.filter(event => event.status === EventStatus.COMPLETED).length,
      upcoming: state.events.filter(event => event.date > now).length
    },
    todayEvents: state.events.filter(event => 
      event.date.toDateString() === now.toDateString()
    ),
    
    getEventsByClient: (clientId: string) => {
      return state.events.filter(event => event.clientId === clientId)
    }
  }
}

export const useClients = () => {
  const { state, actions } = useApp()
  
  return {
    clients: state.clients,
    isLoading: state.isLoading,
    error: state.error,
    
    updateClient: actions.updateClient,
    createClient: actions.createClient,
    deleteClient: actions.deleteClient,
    
    getClientByEmail: (email: string) => {
      return state.clients.find(client => client.email === email)
    }
  }
}

export const useFlorists = () => {
  const { state } = useApp()
  
  return {
    florists: state.florists || [],
    isLoading: state.isLoading,
    error: state.error
  }
}