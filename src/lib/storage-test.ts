// 🧪 UTILITAIRES DE TEST - Storage et Synchronisation
// Debug et test des fonctionnalités de persistance

import { StorageManager } from './storage'

export const StorageTestUtils = {
  // 🧹 Vider complètement le storage
  clearAll: () => {
    const storage = StorageManager.getInstance()
    storage.clear()
    console.log('🧹 Storage complètement vidé')
  },
  
  // 📊 Afficher les infos du storage
  showInfo: () => {
    const storage = StorageManager.getInstance()
    const info = storage.getStorageInfo()
    console.log('📊 Storage Info:', info)
    return info
  },
  
  // 🔄 Tester la synchronisation
  testSync: () => {
    const storage = StorageManager.getInstance()
    
    // Simuler des données de test
    const testEvents = [
      {
        id: 'test-sync-1',
        title: 'Test Sync Event',
        date: new Date(),
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    storage.saveEvents(testEvents)
    console.log('🔄 Test sync envoyé')
  },
  
  // 📦 Charger et afficher les données
  showStoredData: () => {
    const storage = StorageManager.getInstance()
    const events = storage.loadEvents()
    const clients = storage.loadClients()
    
    console.log('📦 Events stockés:', events)
    console.log('📦 Clients stockés:', clients)
    
    return { events, clients }
  },
  
  // 🎯 Injecter des données de test
  injectTestData: () => {
    const storage = StorageManager.getInstance()
    
    const testEvents = [
      {
        id: 'test-1',
        title: 'Mariage Test',
        description: 'Événement de test pour vérifier la persistance',
        date: new Date('2024-08-15'),
        time: '14:00',
        location: 'Église Saint-Martin',
        budget: 1500,
        status: 'confirmed',
        clientId: 'client-1',
        clientName: 'Marie Dupont',
        flowers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-2', 
        title: 'Anniversaire Test',
        description: 'Test événement annulé',
        date: new Date('2024-07-20'),
        time: '16:00',
        location: 'Restaurant Le Jardin',
        budget: 800,
        status: 'cancelled',
        clientId: 'client-2',
        clientName: 'Jean Martin',
        flowers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-3',
        title: 'Baptême Test',
        description: 'Test événement payé',
        date: new Date('2024-06-10'),
        time: '11:00', 
        location: 'Maison familiale',
        budget: 600,
        status: 'paid',
        clientId: 'client-3',
        clientName: 'Sophie Bernard',
        flowers: [],
        paidDate: new Date('2024-06-12'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-4',
        title: 'Communion Test',
        description: 'Test événement facturé',
        date: new Date('2024-05-25'),
        time: '10:30',
        location: 'Église Notre-Dame',
        budget: 750,
        status: 'invoiced',
        clientId: 'client-4',
        clientName: 'Pierre Durand',
        flowers: [],
        invoiceDate: new Date('2024-05-26'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-5',
        title: 'Décoration Entreprise',
        description: 'Test événement en cours',
        date: new Date('2024-08-01'),
        time: '09:00',
        location: 'Bureaux TechCorp',
        budget: 400,
        status: 'in_progress',
        clientId: 'client-5',
        clientName: 'Entreprise TechCorp',
        flowers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    storage.saveEvents(testEvents)
    console.log('🎯 Données de test injectées:', testEvents.length, 'events')
    console.log('📊 Statuts inclus:', testEvents.map(e => e.status))
    
    return testEvents
  },
  
  // 🔄 Changer le statut d'un événement pour tester la sync
  changeEventStatus: (eventId: string, newStatus: string) => {
    const storage = StorageManager.getInstance()
    const events = storage.loadEvents()
    
    const eventIndex = events.findIndex(e => e.id === eventId)
    if (eventIndex === -1) {
      console.log('❌ Événement non trouvé:', eventId)
      return null
    }
    
    const oldStatus = events[eventIndex].status
    events[eventIndex].status = newStatus
    events[eventIndex].updatedAt = new Date()
    
    // Si le nouveau statut est "paid", ajouter une date de paiement
    if (newStatus === 'paid') {
      events[eventIndex].paidDate = new Date()
    }
    
    storage.saveEvents(events)
    
    console.log(`🔄 Statut changé: ${eventId} ${oldStatus} → ${newStatus}`)
    return events[eventIndex]
  },
  
  // 📅 Tester la visibilité temporelle des événements payés
  testVisibility: () => {
    const { EventVisibilityManager } = require('./event-visibility')
    const storage = StorageManager.getInstance()
    const events = storage.loadEvents()
    
    console.log('📅 Test de visibilité temporelle:')
    EventVisibilityManager.debugVisibility(events)
    
    return {
      totalEvents: events.length,
      paidEvents: events.filter(e => e.status === 'paid').length,
      visibleInKanban: EventVisibilityManager.filterEventsForKanban(events).length,
      daysLeft: EventVisibilityManager.getDaysUntilPaidEventsHidden(),
      message: EventVisibilityManager.getPaidVisibilityMessage()
    }
  },
  
  // 🎯 Créer des événements DRAFT pour tester les urgences
  createUrgentDraftEvents: () => {
    const storage = StorageManager.getInstance()
    const events = storage.loadEvents()
    
    // Supprimer les anciens tests urgents
    const filteredEvents = events.filter(e => !e.id.startsWith('urgent-test-'))
    
    const urgentTests = [
      {
        id: 'urgent-test-1',
        title: 'Mariage Urgent AUJOURD\'HUI',
        description: 'Test événement DRAFT aujourd\'hui - très urgent',
        date: new Date(), // AUJOURD'HUI
        time: '15:00',
        location: 'Château de Test',
        budget: 3000,
        status: 'draft', // À PLANIFIER
        clientId: 'urgent-client-1',
        clientName: 'Client Urgent 1',
        flowers: [],
        floristsRequired: 3,
        assignedFlorists: [], // MANQUE 3 fleuristes
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'urgent-test-2', 
        title: 'Baptême Urgent DEMAIN',
        description: 'Test événement DRAFT demain',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // DEMAIN
        time: '11:00',
        location: 'Église Test',
        budget: 800,
        status: 'draft', // À PLANIFIER
        clientId: 'urgent-client-2',
        clientName: 'Client Urgent 2', 
        flowers: [],
        floristsRequired: 2,
        assignedFlorists: [], // MANQUE 2 fleuristes
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'urgent-test-3',
        title: 'Anniversaire Dans 3 Jours',
        description: 'Test événement DRAFT dans 3 jours',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 JOURS
        time: '16:00',
        location: 'Salle des Fêtes',
        budget: 1200,
        status: 'draft', // À PLANIFIER
        clientId: 'urgent-client-3',
        clientName: 'Client Urgent 3',
        flowers: [],
        floristsRequired: 2,
        assignedFlorists: [{ floristId: 'f1', name: 'Fleuriste 1' }], // MANQUE 1 fleuriste
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'urgent-test-4',
        title: 'Mariage Confirmé Demain',
        description: 'Test événement CONFIRMÉ demain - moins urgent',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // DEMAIN
        time: '14:00',
        location: 'Château Confirmé',
        budget: 2500,
        status: 'confirmed', // CONFIRMÉ
        clientId: 'urgent-client-4',
        clientName: 'Client Confirmé',
        flowers: [],
        floristsRequired: 3,
        assignedFlorists: [
          { floristId: 'f1', name: 'Fleuriste 1' },
          { floristId: 'f2', name: 'Fleuriste 2' },
          { floristId: 'f3', name: 'Fleuriste 3' }
        ], // COMPLET
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'urgent-test-5',
        title: 'Événement La Semaine Prochaine',
        description: 'Test événement DRAFT la semaine prochaine',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 JOURS
        time: '10:00',
        location: 'Lieu Lointain',
        budget: 600,
        status: 'draft', // À PLANIFIER
        clientId: 'urgent-client-5',
        clientName: 'Client Futur',
        flowers: [],
        floristsRequired: 1,
        assignedFlorists: [], // MANQUE 1 fleuriste
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const newEvents = [...filteredEvents, ...urgentTests]
    storage.saveEvents(newEvents)
    
    console.log('🚨 Événements urgents de test créés:')
    console.log('   1. Mariage AUJOURD\'HUI (DRAFT) → Critique')
    console.log('   2. Baptême DEMAIN (DRAFT) → Urgent') 
    console.log('   3. Anniversaire 3j (DRAFT) → Important')
    console.log('   4. Mariage DEMAIN (CONFIRMÉ) → Moins urgent')
    console.log('   5. Événement 8j (DRAFT) → Normal')
    
    return urgentTests
  },
  
  // 🚨 Créer des événements urgents de test
  createUrgentTestEvents: () => {
    const storage = StorageManager.getInstance()
    const events = storage.loadEvents()
    
    const urgentTests = [
      // Événement aujourd'hui non confirmé (très urgent)
      {
        id: 'urgent-today-draft',
        title: 'URGENT - Mariage Aujourd\'hui Non Confirmé',
        description: 'Événement test - aujourd\'hui pas confirmé',
        date: new Date(), // Aujourd'hui
        time: '14:00',
        location: 'Lieu à confirmer',
        budget: 2500,
        status: 'draft', // Non confirmé = très urgent
        clientId: 'urgent-client-1',
        clientName: 'Client Urgent',
        floristsRequired: 3,
        assignedFlorists: [], // Aucun fleuriste assigné = encore plus urgent
        flowers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Événement demain non confirmé
      {
        id: 'urgent-tomorrow-draft',
        title: 'URGENT - Baptême Demain Non Confirmé',
        description: 'Événement test - demain pas confirmé',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
        time: '11:00',
        location: 'Église',
        budget: 800,
        status: 'draft',
        clientId: 'urgent-client-2',
        clientName: 'Famille Martin',
        floristsRequired: 2,
        assignedFlorists: [{ floristId: 'f1', isConfirmed: true }], // 1 fleuriste manquant
        flowers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Événement dans 3 jours confirmé (moins urgent)
      {
        id: 'medium-thisweek-confirmed',
        title: 'Événement Entreprise Cette Semaine',
        description: 'Événement test - cette semaine confirmé',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
        time: '09:00',
        location: 'Bureaux TechCorp',
        budget: 1200,
        status: 'confirmed',
        clientId: 'medium-client-1',
        clientName: 'TechCorp SA',
        floristsRequired: 2,
        assignedFlorists: [
          { floristId: 'f1', isConfirmed: true },
          { floristId: 'f2', isConfirmed: true }
        ], // Bien préparé
        flowers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // Ajouter ces événements aux données existantes
    urgentTests.forEach(testEvent => {
      const existingIndex = events.findIndex(e => e.id === testEvent.id)
      if (existingIndex !== -1) {
        events[existingIndex] = testEvent
      } else {
        events.push(testEvent)
      }
    })
    
    storage.saveEvents(events)
    console.log('🚨 Événements urgents de test créés:', urgentTests.length)
    console.log('📊 Total événements:', events.length)
    
    return urgentTests
  }
}

// 🌐 Rendre accessible globalement pour debug
if (typeof window !== 'undefined') {
  (window as any).StorageTestUtils = StorageTestUtils
  (window as any).testPaidVisibility = () => StorageTestUtils.testVisibility()
  (window as any).createOldPaidEvent = () => {
    // Créer un événement payé du mois dernier (masqué du Kanban)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return StorageTestUtils.createPaidEventWithDate('Événement Payé Ancien', lastMonth)
  }
  (window as any).createRecentPaidEvent = () => {
    // Créer un événement payé de ce mois (visible dans le Kanban)
    const thisMonth = new Date()
    return StorageTestUtils.createPaidEventWithDate('Événement Payé Récent', thisMonth)
  }
  
  // 🚨 Nouvelles fonctions pour tester l'urgence
  (window as any).testUrgentEvents = () => {
    const { SmartUrgencyCalculator } = require('./smart-urgency')
    const storage = StorageManager.getInstance()
    const events = storage.loadEvents()
    
    console.log('🚨 Test événements urgents:')
    const urgentEvents = SmartUrgencyCalculator.getUrgentEvents(events, 10)
    
    urgentEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (Niveau ${event.urgency.level})`)
      console.log(`   Raisons: ${event.urgency.reasons.join(', ')}`)
      console.log(`   Action: ${event.urgency.actionNeeded}`)
      console.log('---')
    })
    
    return urgentEvents
  }
  
  (window as any).createUrgentTestEvents = () => StorageTestUtils.createUrgentTestEvents()
  (window as any).createUrgentTests = () => StorageTestUtils.createUrgentDraftEvents()
  
  console.log('🛠️ StorageTestUtils + fonctions de test disponibles dans window')
  console.log('   📅 Visibilité temporelle:')
  console.log('   - window.testPaidVisibility()')
  console.log('   - window.createOldPaidEvent()')
  console.log('   - window.createRecentPaidEvent()')
  console.log('   🚨 Urgences intelligentes:')
  console.log('   - window.testUrgentEvents()')
  console.log('   - window.createUrgentTests() → NOUVEAUX tests urgence avec DRAFT')
}

