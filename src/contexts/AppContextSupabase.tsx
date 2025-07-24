import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { AppState, Event, Client, EventStatus, Theme, Florist, FloristAvailability } from '@/types'
import { eventRepository, clientRepository } from '@/repositories/SupabaseRepositories'
import { useAuth } from './AuthContext'

// Interface du contexte 
interface AppContextType {
  state: AppState
  actions: {
    // Events
    loadEvents: () => Promise<void>
    updateEvent: (id: string, event: Partial<Event>) => Promise<void>
    updateEventWithTeamCheck: (id: string, event: Partial<Event>) => Promise<void>
    updateEventWithStatusDates: (id: string, newStatus: EventStatus) => Promise<void>
    createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    deleteEvent: (id: string) => Promise<void>
    
    // Clients
    loadClients: () => Promise<void>
    updateClient: (id: string, client: Partial<Client>) => Promise<void>
    createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    deleteClient: (id: string) => Promise<void>
    
    // Utils
    setError: (error: string | null) => void
    setLoading: (loading: boolean) => void
    generateNotSelectedMessage: (floristName: string, eventTitle: string, eventDate: Date) => string
    syncClientNames: () => void
  }
}

const AppContext = createContext<AppContextType | null>(null)

// Provider avec Supabase
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>({
    user: null,
    events: [],
    clients: [],
    flowers: [],
    florists: [],
    floristAvailabilities: [],
    isLoading: false,
    error: null,
    theme: Theme.LIGHT
  })

  // Actions avec gestion d'erreur uniforme
  const actions = {
    // Events
    loadEvents: async () => {
      if (!user) return
      
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      try {
        const events = await eventRepository.findAll(user.id)
        setState(prev => ({ ...prev, events, isLoading: false }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors du chargement des événements',
          isLoading: false 
        }))
      }
    },

    updateEvent: async (id: string, eventData: Partial<Event>) => {
      if (!user) return
      
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        await eventRepository.update(id, eventData)
        setState(prev => ({
          ...prev,
          events: prev.events.map(event => 
            event.id === id ? { ...event, ...eventData } : event
          ),
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors de la mise à jour de l\'événement',
          isLoading: false 
        }))
      }
    },

    updateEventWithTeamCheck: async (id: string, eventData: Partial<Event>) => {
      // Logique spécifique pour vérifier l'équipe
      await actions.updateEvent(id, eventData)
    },

    updateEventWithStatusDates: async (id: string, newStatus: EventStatus) => {
      const statusDates: any = {}
      const now = new Date()
      
      switch (newStatus) {
        case EventStatus.CONFIRMED:
          statusDates.confirmedAt = now
          break
        case EventStatus.IN_PROGRESS:
          statusDates.startedAt = now
          break
        case EventStatus.COMPLETED:
          statusDates.completedAt = now
          break
      }
      
      await actions.updateEvent(id, { status: newStatus, ...statusDates })
    },

    createEvent: async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return
      
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        const event = await eventRepository.create(eventData)
        setState(prev => ({
          ...prev,
          events: [...prev.events, event],
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors de la création de l\'événement',
          isLoading: false 
        }))
      }
    },

    deleteEvent: async (id: string) => {
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        await eventRepository.delete(id)
        setState(prev => ({
          ...prev,
          events: prev.events.filter(event => event.id !== id),
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors de la suppression de l\'événement',
          isLoading: false 
        }))
      }
    },

    // Clients
    loadClients: async () => {
      if (!user) return
      
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      try {
        const clients = await clientRepository.findAll(user.id)
        setState(prev => ({ ...prev, clients, isLoading: false }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors du chargement des clients',
          isLoading: false 
        }))
      }
    },

    updateClient: async (id: string, clientData: Partial<Client>) => {
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        await clientRepository.update(id, clientData)
        setState(prev => ({
          ...prev,
          clients: prev.clients.map(client => 
            client.id === id ? { ...client, ...clientData } : client
          ),
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors de la mise à jour du client',
          isLoading: false 
        }))
      }
    },

    createClient: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return
      
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        const client = await clientRepository.create(clientData)
        setState(prev => ({
          ...prev,
          clients: [...prev.clients, client],
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors de la création du client',
          isLoading: false 
        }))
      }
    },

    deleteClient: async (id: string) => {
      setState(prev => ({ ...prev, isLoading: true }))
      try {
        await clientRepository.delete(id)
        setState(prev => ({
          ...prev,
          clients: prev.clients.filter(client => client.id !== id),
          isLoading: false
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Erreur lors de la suppression du client',
          isLoading: false 
        }))
      }
    },

    // Utils
    setError: (error: string | null) => {
      setState(prev => ({ ...prev, error }))
    },

    setLoading: (loading: boolean) => {
      setState(prev => ({ ...prev, isLoading: loading }))
    },

    generateNotSelectedMessage: (floristName: string, eventTitle: string, eventDate: Date) => {
      return `${floristName} n'a pas été sélectionné(e) pour l'événement "${eventTitle}" du ${eventDate.toLocaleDateString('fr-FR')}.`
    },

    syncClientNames: () => {
      // Synchroniser les noms des clients dans les événements
      setState(prev => ({
        ...prev,
        events: prev.events.map(event => {
          const client = prev.clients.find(c => c.id === event.clientId)
          return client ? { ...event, clientName: `${client.firstName} ${client.lastName}` } : event
        })
      }))
    }
  }

  // Charger les données au démarrage
  useEffect(() => {
    if (user) {
      actions.loadEvents()
      actions.loadClients()
    }
  }, [user])

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
