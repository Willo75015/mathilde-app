import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Plus, 
  Calendar as CalendarIcon, Clock 
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SimpleDayEventsModal from './SimpleDayEventsModal'
import EventModal from '@/components/events/EventModal'
import { useEvents } from '@/contexts/AppContext'
import { EventStatus, getKanbanColumn } from '@/types'

interface CalendarProps {
  navigate?: (page: string, params?: any) => void
  onCreateEvent?: () => void
}

const Calendar: React.FC<CalendarProps> = ({ navigate, onCreateEvent }) => {
  const { events, updateEvent } = useEvents()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: any[] } | null>(null)
  
  // 🆕 États pour EventModal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  
  // Fonctions utilitaires pour le calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // 🇫🇷 CALENDRIER FRANÇAIS - COMMENCE PAR LUNDI
    // getDay() retourne 0=Dimanche, 1=Lundi, ..., 6=Samedi
    // On veut 0=Lundi, 1=Mardi, ..., 6=Dimanche
    let startingDayOfWeek = firstDay.getDay()
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 // Conversion vers système lundi=0
    
    const days = []
    
    // Jours du mois précédent pour calendrier français
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i)
      days.push({ date: day, isCurrentMonth: false, events: [] })
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayEvents = events.filter(event => 
        new Date(event.date).toDateString() === date.toDateString()
      )
      days.push({ date, isCurrentMonth: true, events: dayEvents })
    }
    
    // Jours du mois suivant pour compléter la grille
    const totalCells = Math.ceil(days.length / 7) * 7
    const remainingCells = totalCells - days.length
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day)
      days.push({ date, isCurrentMonth: false, events: [] })
    }
    
    return days
  }
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }
  
  const getStatusColor = (status: EventStatus) => {
    const column = getKanbanColumn(status)
    
    // Conversion des classes Tailwind bg-color-50 vers bg-color-500 pour le calendrier
    switch (status) {
      case EventStatus.DRAFT:
        return 'bg-gray-500 text-white' // Gris pour "À planifier"
      case EventStatus.CONFIRMED:
        return 'bg-blue-500 text-white' // Bleu pour "Confirmé"
      case EventStatus.IN_PROGRESS:
        return 'bg-amber-500 text-white' // Amber pour "En cours"
      case EventStatus.COMPLETED:
        return 'bg-pink-500 text-white' // Rose pour "Terminé"
      case EventStatus.INVOICED:
        return 'bg-purple-500 text-white' // Violet pour "Facturé"
      case EventStatus.PAID:
        return 'bg-green-500 text-white' // Vert pour "Payé"
      case EventStatus.CANCELLED:
        return 'bg-red-500 text-white' // Rouge pour "Annulé"
      default:
        return 'bg-gray-500 text-white'
    }
  }
  
  const handleDayClick = (day: { date: Date; events: any[] }) => {
    if (day.events.length > 0) {
      setSelectedDay(day)
    }
  }

  const handleCreateEvent = () => {
    console.log('🎯 Création événement depuis le calendrier')
    setSelectedEvent(null) // Mode création
    setIsEventModalOpen(true)
  }

  // 🆕 Handler pour éditer un événement
  const handleEventEdit = (editedEvent: any) => {
    updateEvent(editedEvent.id, editedEvent)
    setIsEventModalOpen(false)
    setSelectedEvent(null)
  }
  
  const days = getDaysInMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  })
  const today = new Date()

  // 🎯 CALCUL DE LA HAUTEUR MAXIMALE pour uniformiser toutes les cellules
  const maxEventsInDay = Math.max(...days.map(day => day.events.length), 1)
  const cellHeight = Math.max(120, 35 + (maxEventsInDay * 24)) // Base 35px + 24px par événement
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendrier - {monthYear}</span>
            </CardTitle>
            
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleCreateEvent}
            >
              Nouvel événement
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* WRAPPER CALENDRIER AVEC LARGEUR FORCÉE */}
          <div className="w-full min-w-[800px] overflow-x-auto">
            {/* Header avec navigation */}
            <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            />
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
              {monthYear}
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            />
          </div>
          
          {/* Jours de la semaine - CALENDRIER FRANÇAIS */}
          <div 
            className="gap-1 mb-2 border-4 border-red-500"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              width: '100%',
              backgroundColor: 'yellow' // DEBUG
            }}
          >
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
              <div key={day} className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-blue-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* 🎯 GRILLE DES JOURS - HAUTEUR UNIFORME ET DYNAMIQUE */}
          <div 
            className="gap-1 border-4 border-green-500"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              width: '100%',
              backgroundColor: 'pink' // DEBUG
            }}
          >
            {days.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString()
              const hasEvents = day.events.length > 0
              const isClickable = hasEvents && day.isCurrentMonth
              
              return (
                <motion.div
                  key={index}
                  style={{ height: `${cellHeight}px` }} // 🎯 HAUTEUR FIXE CALCULÉE
                  className={`
                    p-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto
                    ${day.isCurrentMonth 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-gray-50 dark:bg-gray-900 opacity-50'
                    }
                    ${isToday && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'}
                    ${isClickable 
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    transition-all duration-200 hover:shadow-md
                  `}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => isClickable && handleDayClick(day)}
                >
                  {/* Numéro du jour */}
                  <div className={`
                    text-sm font-bold mb-2 text-center sticky top-0 bg-inherit
                    ${day.isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400'
                    }
                    ${isToday && 'text-blue-600 dark:text-blue-400 text-lg'}
                  `}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* 🎯 TOUS LES ÉVÉNEMENTS - PLUS DE LIMITATION ! */}
                  {hasEvents && (
                    <div className="space-y-1">
                      {day.events.map((event, eventIndex) => (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.02 }}
                          className={`
                            text-xs p-1.5 rounded cursor-pointer
                            ${getStatusColor(event.status)}
                            hover:shadow-md transition-all duration-200
                          `}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(event)
                            setIsEventModalOpen(true)
                          }}
                          title={`${event.title} - ${event.time} - ${event.clientName || 'Client'}`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-90 flex items-center justify-between text-xs">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.time}
                            </span>
                            {event.budget && (
                              <span className="text-right">
                                {event.budget}€
                              </span>
                            )}
                          </div>
                          {event.clientName && (
                            <div className="text-xs opacity-75 truncate">
                              {event.clientName}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Message si pas d'événements */}
                  {!hasEvents && day.isCurrentMonth && (
                    <div 
                      className="text-xs text-gray-400 text-center mt-4 cursor-pointer hover:text-primary-500 transition-colors"
                      onClick={() => {
                        setSelectedEvent({ date: day.date }) // Pré-remplir la date
                        setIsEventModalOpen(true)
                      }}
                    >
                      + Ajouter événement
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
          
          {/* Statistiques du mois */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {events.filter(e => e.status === EventStatus.DRAFT).length}
                </div>
                <div className="text-xs text-gray-500">À planifier</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.status === EventStatus.CONFIRMED).length}
                </div>
                <div className="text-xs text-gray-500">Confirmés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {events.filter(e => e.status === EventStatus.IN_PROGRESS).length}
                </div>
                <div className="text-xs text-gray-500">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {events.filter(e => e.status === EventStatus.COMPLETED).length}
                </div>
                <div className="text-xs text-gray-500">Terminés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {events.filter(e => e.status === EventStatus.INVOICED).length}
                </div>
                <div className="text-xs text-gray-500">Facturés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.status === EventStatus.PAID).length}
                </div>
                <div className="text-xs text-gray-500">Payés</div>
              </div>
            </div>
            
            {/* Légende */}
            <div className="flex items-center justify-center space-x-4 text-xs flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">À planifier</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Confirmé</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">En cours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-pink-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Terminé</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Facturé</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Payé</span>
              </div>
            </div>
          </div> {/* Fin wrapper calendrier */}
          </div>
        </CardContent>
      </Card>
      
      {/* Modal des événements du jour */}
      <SimpleDayEventsModal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        date={selectedDay?.date || new Date()}
        events={selectedDay?.events || []}
        onCreateEvent={handleCreateEvent}
        onEditEvent={(event) => {
          setSelectedEvent(event)
          setIsEventModalOpen(true)
        }}
      />

      {/* 🎯 MODAL EVENTMODAL pour création/édition */}
      <EventModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false)
          setSelectedEvent(null)
        }}
        onEdit={handleEventEdit}
      />
    </>
  )
}

export default Calendar