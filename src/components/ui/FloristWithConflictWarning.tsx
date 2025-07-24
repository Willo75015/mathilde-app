import React from 'react'
import FloristCard from '@/components/ui/FloristCard'
import { Event } from '@/types'

// 🆕 Wrapper simple qui utilise le nouveau FloristCard réutilisable
// Ce composant reste pour la compatibilité avec l'existant

interface Florist {
  id: string
  name: string
  role?: string
  status?: 'available' | 'unavailable' | 'busy'
  avatar?: string
}

interface FloristWithConflictWarningProps {
  florist: Florist
  allEvents: Event[]
  currentEventId?: string
  currentEventDate?: Date
  assignmentStatus?: 'pending' | 'confirmed' | 'refused'
  onStatusChange?: (status: 'pending' | 'confirmed' | 'refused') => void
  onRemove?: () => void
  onContact?: () => void
  showActions?: boolean
  className?: string
}

/**
 * 🔄 MIGRATION: Ce composant utilise maintenant le nouveau FloristCard réutilisable
 * Toutes les fonctionnalités d'affichage des missions sont automatiquement incluses
 */
const FloristWithConflictWarning = ({
  florist,
  allEvents,
  currentEventId = '',
  currentEventDate = new Date(),
  assignmentStatus = 'available',
  onStatusChange,
  onRemove,
  onContact,
  showActions = true,
  className = ''
}) => {
  // Conversion du statut vers le format attendu par FloristCard
  const normalizedFlorist = {
    ...florist,
    status: florist.status || 'available'
  }

  return (
    <FloristCard
      florist={normalizedFlorist}
      status={assignmentStatus}
      allEvents={allEvents}
      currentEventId={currentEventId}
      currentEventDate={currentEventDate}
      onStatusChange={onStatusChange}
      onRemove={onRemove}
      onContact={onContact}
      showMissionDetails={true} // 🆕 Affichage automatique des missions activé
      showActions={showActions}
      variant="default"
      className={className}
    />
  )
}

export default FloristWithConflictWarning

// Fonction de vérification des conflits (copiée pour compatibilité)
export const checkFloristConflicts = (
  floristId: string, 
  currentEventId: string, 
  eventDate: Date, 
  allEvents: Event[]
): { hasConflict: boolean; conflictingEvents: Event[] } => {
  const targetDate = eventDate.toDateString()
  
  const conflictingEvents = allEvents.filter(event => {
    if (event.id === currentEventId) return false
    
    const eventDateStr = (event.date instanceof Date ? event.date : new Date(event.date)).toDateString()
    if (eventDateStr !== targetDate) return false
    
    const hasFlorist = event.assignedFlorists?.some(af => 
      af.floristId === floristId && (af.isConfirmed || af.status === 'confirmed')
    )
    
    return hasFlorist
  })
  
  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents
  }
}