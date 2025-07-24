// 🚨 SUPER EMERGENCY - VERSION MINIMALE SANS BOUCLES
import { createContext, useContext, useState  } from 'react';
import { mockEvents, mockClients } from '@/lib/mockData'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [events, setEvents] = useState(mockEvents)
  const [clients, setClients] = useState(mockClients)
  
  const updateClient = (id, newData) => {
    console.log('✅ SIMPLE updateClient:', id, newData)
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...newData } : client
    ))
    
    // Sauvegarde manuelle simple
    setTimeout(() => {
      localStorage.setItem('mathilde_clients', JSON.stringify(clients))
      console.log('💾 Client sauvegardé')
    }, 500)
  }
  
  const updateEvent = (id, newData) => {
    console.log('✅ SIMPLE updateEvent:', id, newData)
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...newData } : event
    ))
  }
  
  return (
    <AppContext.Provider value={{
      state: { events, clients },
      actions: { updateClient, updateEvent }
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
export const useClients = () => {
  const { state, actions } = useApp()
  return { clients: state.clients, updateClient: actions.updateClient }
}
export const useEvents = () => {
  const { state, actions } = useApp()
  return { events: state.events, updateEvent: actions.updateEvent }
}