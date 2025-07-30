// Test d'import des nouveaux composants dashboard
import { useApp } from '@/contexts/AppContext'
import { Event, EventStatus } from '@/types'
import UrgentEventsSection from '@/components/dashboard/UrgentEventsSection'
import InvoicingSection from '@/components/dashboard/InvoicingSection'
import StrategicPlanningSection from '@/components/dashboard/StrategicPlanningSection'
import BusinessMetricsSection from '@/components/dashboard/BusinessMetricsSection'

// Test simple pour vérifier que tous les imports sont corrects
console.log('✅ Tous les composants dashboard sont importés correctement')

// Test des types
const testEvent: Event = {
  id: 'test',
  title: 'Test Event',
  description: 'Description test',
  date: new Date(),
  time: '14:00',
  location: 'Test Location',
  clientId: 'client-1',
  budget: 1000,
  status: EventStatus.DRAFT,
  flowers: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  invoiced: false
}

console.log('✅ Types Event avec champ invoiced fonctionnent correctement')

export { }
