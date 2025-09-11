# 💼 Workflow de Facturation - Guide d'Implémentation

## 🎯 Vue d'ensemble

Ce système implémente un **workflow complet de facturation** de l'événement terminé jusqu'au paiement, avec **notifications automatiques** et **modales professionnelles**.

## 🔄 Flux de Travail

```
COMPLETED → [Clic "Terminer"] → INVOICED → [Clic "Facturé"] → PAID
    ↓              ↓                ↓              ↓         ↓
Notification   Pop-up         Notification   Pop-up    Badge
"Prêt à       "Archiver      "Facturé"      "Payé?"   Final
facturer"     et facturer"
```

## 📁 Structure des Fichiers Créés

```
src/
├── components/
│   ├── modals/billing/
│   │   ├── ArchiveEventModal.tsx      # 📋 Modale d'archivage
│   │   ├── PaymentTrackingModal.tsx   # 💰 Modale de paiement
│   │   └── index.ts                   # Exports
│   ├── ui/
│   │   └── Notification.tsx           # 🔔 Système de notifications
│   ├── events/
│   │   └── EventCard.tsx              # 🔄 MODIFIÉ avec nouveaux boutons
│   └── examples/
│       └── EventWorkflowExample.tsx   # 🎯 Exemple d'intégration
├── hooks/
│   ├── useBillingWorkflow.ts          # 💼 Logique de facturation
│   ├── useEventStatusNotifications.ts # 🔔 Notifications automatiques
│   └── useNotifications.ts            # 🔔 Gestion des notifications
└── types/
    ├── index.ts                       # 🔄 EXISTANT (statuts OK)
    └── kanban-status.ts               # 🔄 EXISTANT (colonnes OK)
```

## 🛠️ Intégration dans une Page Existante

### 1. Import des dépendances
```typescript
import { useBillingWorkflow } from '@/hooks/useBillingWorkflow'
import { useNotifications } from '@/hooks/useNotifications'
import { useEventStatusNotifications } from '@/hooks/useEventStatusNotifications'
import { ArchiveEventModal, PaymentTrackingModal } from '@/components/modals/billing'
import { NotificationContainer } from '@/components/ui/Notification'
```

### 2. Setup des hooks
```typescript
const { archiveAndInvoiceEvent, updatePaymentStatus } = useBillingWorkflow()
const { notifications, removeNotification, showSuccess, showError } = useNotifications()

// Notifications automatiques
useEventStatusNotifications({
  events,
  onShowNotification: (message, type) => {
    if (type === 'success') showSuccess(message)
    else if (type === 'error') showError(message)
    // etc...
  }
})
```

### 3. États pour les modales
```typescript
const [selectedEventForArchive, setSelectedEventForArchive] = useState(null)
const [selectedEventForPayment, setSelectedEventForPayment] = useState(null)
const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
```

### 4. Handlers
```typescript
const handleArchiveAndInvoice = (event) => {
  setSelectedEventForArchive(event)
  setIsArchiveModalOpen(true)
}

const handlePaymentTracking = (event) => {
  setSelectedEventForPayment(event)
  setIsPaymentModalOpen(true)
}
```

### 5. Mise à jour des EventCard
```typescript
<EventCard
  event={event}
  onArchiveAndInvoice={handleArchiveAndInvoice}  // 🆕 Nouveau
  onPaymentTracking={handlePaymentTracking}      // 🆕 Nouveau
  // ... autres props existantes
/>
```

## 🎨 Boutons selon le Statut

| Statut | Bouton Affiché | Action | Couleur |
|--------|----------------|--------|---------|
| `COMPLETED` | "Terminer" | Ouvre modale d'archivage | Bleu |
| `INVOICED` | "Facturé" | Ouvre modale de paiement | Violet |
| `PAID` | Badge "Payé" | Affichage seul | Vert |

## 🔔 Notifications Automatiques

### Déclencheurs
- **Événement terminé** : "✅ Événement terminé - Prêt à facturer"
- **Facturation créée** : "💼 Facture créée"
- **Paiement reçu** : "💰 Paiement reçu"
- **Paiements en retard** : "⚠️ Paiement en retard" (après 30 jours)

### Configuration
```typescript
// Dans useEventStatusNotifications.ts
- Vérification toutes les 30 secondes pour nouveaux terminés
- Vérification toutes les heures pour impayés
- Nettoyage automatique des notifications anciennes (30 jours)
```

## 📊 Statistiques Disponibles

Le hook `useBillingWorkflow()` fournit :

```typescript
const stats = getBillingStats()

// Compteurs
stats.eventsToInvoice      // Nombre à facturer
stats.eventsInvoiced       // Nombre facturés
stats.eventsPaid           // Nombre payés
stats.eventsOverdue        // Nombre en retard

// Montants
stats.totalToInvoice       // CA à facturer
stats.totalInvoiced        // CA facturé
stats.totalPaid            // CA encaissé
stats.totalOverdue         // CA en retard

// Délais moyens
stats.avgDaysToInvoice     // Jours événement → facture
stats.avgDaysToPay         // Jours facture → paiement
```

## 🔧 Customisation

### Messages des Modales
Les messages peuvent être modifiés dans :
- `ArchiveEventModal.tsx` : Ligne 67-72
- `PaymentTrackingModal.tsx` : Ligne 89-94

### Délais d'Urgence
Dans `PaymentTrackingModal.tsx`, ligne 25-29 :
```typescript
const getUrgencyStatus = () => {
  if (daysSinceInvoiced > 30) return { level: 'critical', ... }  // Modifiable
  if (daysSinceInvoiced > 15) return { level: 'warning', ... }   // Modifiable
  return { level: 'normal', ... }
}
```

### Fréquence des Notifications
Dans `useEventStatusNotifications.ts` :
```typescript
setInterval(checkForCompletedEvents, 30000)     // 30 sec → modifiable
setInterval(checkOverduePayments, 60 * 60 * 1000) // 1h → modifiable
```

## 🚀 Test du Workflow

1. **Créer un événement** avec statut `COMPLETED`
2. **Cliquer "Terminer"** → Modale d'archivage
3. **Confirmer** → Notification + Statut `INVOICED`
4. **Cliquer "Facturé"** → Modale de paiement
5. **Cliquer "Paiement Encaissé"** → Notification + Statut `PAID`

## 📈 Prochaines Améliorations

- [ ] Email automatique au client lors de la facturation
- [ ] Export PDF des factures
- [ ] Relances automatiques par email
- [ ] Dashboard de trésorerie avancé
- [ ] Intégration comptabilité externe

---

**✅ Le workflow est maintenant opérationnel !** 🎯