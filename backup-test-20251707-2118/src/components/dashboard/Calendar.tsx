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
import { EventStatus } from '@/types'

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
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Jours du mois précédent
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
    switch (status) {
      case EventStatus.CONFIRMED:
        return 'bg-blue-500'
      case EventStatus.IN_PROGRESS:
        return 'bg-yellow-500'
      case EventStatus.COMPLETED:
        return 'bg-green-500'
      case EventStatus.CANCELLED:
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
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
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendrier</span>
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
          {/* Header avec navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            />
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {monthYear}
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            />
          </div>
          
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString()
              const hasEvents = day.events.length > 0
              const isClickable = hasEvents && day.isCurrentMonth
              
              return (
                <motion.div
                  key={index}
                  className={`
                    min-h-[80px] p-1 border border-gray-200 dark:border-gray-700 rounded
                    ${day.isCurrentMonth 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-gray-50 dark:bg-gray-900'
                    }
                    ${isToday && 'ring-2 ring-primary-500'}
                    ${isClickable 
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                    transition-all duration-200
                  `}
                  whileHover={{ scale: isClickable ? 1.02 : 1.01 }}
                  onClick={() => isClickable && handleDayClick(day)}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${day.isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400'
                    }
                    ${isToday && 'text-primary-600 dark:text-primary-400'}
                  `}>
                    {day.date.getDate()}
                  </div>
                  
                  {hasEvents && (
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`
                            text-xs px-1 py-0.5 rounded text-white truncate
                            ${getStatusColor(event.status)}
                          `}
                          title={`${event.title} - ${event.time}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500 px-1 hover:text-primary-600 transition-colors">
                          +{day.events.length - 2} autre(s)
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Indicateur cliquable */}
                  {hasEvents && day.isCurrentMonth && (
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
          
          {/* Légende améliorée */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Confirmé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">En cours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Terminé</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Cliquez sur un jour avec événements pour voir les détails
              </div>
            </div>
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