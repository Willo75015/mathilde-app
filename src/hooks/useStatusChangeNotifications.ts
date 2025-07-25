import React, { useEffect } from 'react'
import { EventStatus } from '@/types'
import { useNotifications } from '@/hooks/useNotifications'

interface UseStatusChangeNotificationsProps {
  events: any[]
}

export const useStatusChangeNotifications = ({ events }: UseStatusChangeNotificationsProps) => {
  const { showSuccess, showInfo, showWarning } = useNotifications()
  
  // Garder une référence des statuts précédents
  const prevStatusesRef = React.useRef<Map<string, EventStatus>>(new Map())
  
  useEffect(() => {
    events.forEach(event => {
      const prevStatus = prevStatusesRef.current.get(event.id)
      const currentStatus = event.status
      
      // Si le statut a changé (et ce n'est pas le premier chargement)
      if (prevStatus && prevStatus !== currentStatus) {
        console.log(`🔄 CHANGEMENT DE STATUT: ${event.title} (${prevStatus} → ${currentStatus})`)
        
        // Messages personnalisés selon le type de changement
        const statusMessages = {
          [EventStatus.PLANNING]: { 
            emoji: '📋', 
            action: 'remis en planification',
            type: 'info' as const
          },
          [EventStatus.CONFIRMED]: { 
            emoji: '✅', 
            action: 'confirmé',
            type: 'success' as const
          },
          [EventStatus.IN_PROGRESS]: { 
            emoji: '🎯', 
            action: 'démarré',
            type: 'info' as const
          },
          [EventStatus.COMPLETED]: { 
            emoji: '✨', 
            action: 'terminé avec succès',
            type: 'success' as const
          },
          [EventStatus.INVOICED]: { 
            emoji: '💼', 
            action: 'facturé',
            type: 'info' as const
          },
          [EventStatus.PAID]: { 
            emoji: '💰', 
            action: 'payé - merci !',
            type: 'success' as const
          },
          [EventStatus.CANCELLED]: { 
            emoji: '❌', 
            action: 'annulé',
            type: 'warning' as const
          }
        }
        
        const statusInfo = statusMessages[currentStatus]
        if (statusInfo) {
          const notificationFn = statusInfo.type === 'success' ? showSuccess :
                                statusInfo.type === 'warning' ? showWarning : showInfo
          
          notificationFn(
            `"${event.title}" a été ${statusInfo.action}`,
            `${statusInfo.emoji} Changement de statut`,
            5000,
            event.id
          )
        }
      }
      
      // Mettre à jour la référence
      prevStatusesRef.current.set(event.id, currentStatus)
    })
  }, [events, showSuccess, showInfo, showWarning])
  
  return {
    // Fonction pour forcer une notification
    notifyStatusChange: (eventId: string, eventTitle: string, newStatus: EventStatus) => {
      const statusMessages = {
        [EventStatus.PLANNING]: { emoji: '📋', action: 'remis en planification' },
        [EventStatus.CONFIRMED]: { emoji: '✅', action: 'confirmé' },
        [EventStatus.IN_PROGRESS]: { emoji: '🎯', action: 'démarré' },
        [EventStatus.COMPLETED]: { emoji: '✨', action: 'terminé' },
        [EventStatus.INVOICED]: { emoji: '💼', action: 'facturé' },
        [EventStatus.PAID]: { emoji: '💰', action: 'payé' },
        [EventStatus.CANCELLED]: { emoji: '❌', action: 'annulé' }
      }
      
      const statusInfo = statusMessages[newStatus]
      if (statusInfo) {
        showSuccess(
          `"${eventTitle}" a été ${statusInfo.action}`,
          `${statusInfo.emoji} Statut mis à jour`,
          4000,
          eventId
        )
      }
    }
  }
}

export default useStatusChangeNotifications

