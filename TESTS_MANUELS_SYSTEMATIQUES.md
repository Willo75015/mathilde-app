# 🧪 TESTS MANUELS SYSTÉMATIQUES - MATHILDE FLEURS
## Priorité 1: Fonctionnel vs Placeholder - 18 juillet 2025

---

## 🎯 MÉTHODE DE TEST

**App accessible sur** : http://127.0.0.1:3027  
**Approche** : Tester chaque bouton comme un utilisateur réel  
**Documentation** : ✅ Fonctionnel | ❌ Placeholder | 🔧 Besoin réparation

---

## 🏠 PAGE D'ACCUEIL / DASHBOARD

### Navigation Principale (Sidebar)
- [ ] **Bouton "Accueil"** → Redirige vers dashboard
- [ ] **Bouton "Calendrier"** → Ouvre page calendrier  
- [ ] **Bouton "Événements"** → Liste des événements
- [ ] **Bouton "Fleuriste"** → Page gestion fleuristes
- [ ] **Bouton "Clients"** → Liste des clients
- [ ] **Bouton "Statistiques"** → Page analytics

### Section Événements Urgents
- [ ] **Affichage événements** → Liste des événements urgents affichée
- [ ] **Bouton "Voir plus/moins"** → Expand/collapse liste
- [ ] **Clic sur événement** → Ouvre détails événement
- [ ] **Bouton "Modifier"** sur événement → Ouvre modal édition
- [ ] **Bouton "Attribuer fleuriste"** → Ouvre sélection fleuriste
- [ ] **Bouton "Annuler événement"** → Confirmation + suppression

### Bouton Principal Création
- [ ] **Bouton "+ Nouvel Événement"** → Ouvre modal création
  - [ ] Formulaire s'ouvre
  - [ ] Champs pré-remplis ou vides
  - [ ] Validation fonctionne
  - [ ] Bouton "Sauvegarder" enregistre
  - [ ] Modal se ferme après création

### Section Facturation
- [ ] **Affichage événements à facturer** → Liste événements terminés
- [ ] **Bouton "Facturer"** → Process de facturation
- [ ] **Bouton "Marquer payé"** → Change statut paiement

### Section Planification Stratégique
- [ ] **Calendrier mini** → Affiche dates avec événements
- [ ] **Navigation mois** → Flèches précédent/suivant
- [ ] **Clic sur date** → Affiche événements du jour

### Section Métriques Business
- [ ] **KPIs affichés** → Chiffres réels ou mock
- [ ] **Graphiques** → Données réelles ou placeholders

---

## 📅 PAGE CALENDRIER

### Affichage Calendrier
- [ ] **Vue mensuelle** → Calendrier mois complet
- [ ] **Événements sur dates** → Points/badges sur dates
- [ ] **Navigation mois** → Boutons < >
- [ ] **Sélection date** → Highlight date courante

### Interactions Calendrier
- [ ] **Clic date vide** → Création nouvel événement
- [ ] **Clic événement** → Détails événement
- [ ] **Drag & drop** → Déplacement événement (si implémenté)

### Vue Kanban (si disponible)
- [ ] **Switch Calendrier/Kanban** → Change d'affichage
- [ ] **Colonnes Kanban** → DRAFT, IN_PROGRESS, CONFIRMED, COMPLETED
- [ ] **Drag entre colonnes** → Change statut événement

---

## 🌸 PAGE ÉVÉNEMENTS

### Liste Événements
- [ ] **Affichage liste** → Tous les événements
- [ ] **Barre de recherche** → Filtre événements
- [ ] **Filtres statut** → Filtre par DRAFT, CONFIRMED, etc.
- [ ] **Tri colonnes** → Sort par date, client, budget

### Actions sur Événements
- [ ] **Bouton "Créer"** → Modal création événement
- [ ] **Bouton "Modifier"** → Modal édition pré-remplie
- [ ] **Bouton "Supprimer"** → Confirmation + suppression
- [ ] **Bouton "Dupliquer"** → Copie événement (si disponible)
- [ ] **Change statut** → Dropdown statuts fonctionne

### Gestion Fleuristes
- [ ] **Attribution fleuriste** → Sélection dans dropdown
- [ ] **Statut confirmation** → Pending/Confirmed
- [ ] **Détection conflits** → Warnings si fleuriste occupé

---

## 👥 PAGE CLIENTS

### Liste Clients
- [ ] **Affichage liste** → Tous les clients
- [ ] **Barre recherche** → Trouve clients par nom/email
- [ ] **Tri alphabétique** → Sort par nom
- [ ] **Vue carte/liste** → Switch d'affichage

### Actions Clients
- [ ] **Bouton "Nouveau client"** → Modal création
  - [ ] Formulaire complet
  - [ ] Validation email/téléphone
  - [ ] Sauvegarde fonctionne
- [ ] **Bouton "Modifier"** → Modal édition pré-remplie
- [ ] **Bouton "Supprimer"** → Confirmation + gestion événements liés
- [ ] **Clic profil client** → Page détails + historique

---

## 🌺 PAGE FLEURISTE

### Gestion Fleuristes
- [ ] **Liste fleuristes** → Affichage avec statuts
- [ ] **Disponibilités** → Calendrier par fleuriste
- [ ] **Attribution missions** → Assignment aux événements
- [ ] **Détection conflits** → Warnings automatiques

---

## 📊 PAGE ANALYTICS

### Dashboards
- [ ] **Graphiques revenus** → Données réelles ou mock
- [ ] **Métriques événements** → Stats temps réel
- [ ] **Performance fleuristes** → KPIs équipe
- [ ] **Export rapports** → PDF/Excel (si disponible)

---

## 🔧 TESTS MODALES (Priorité 2)

### Modal Création Événement
- [ ] **Ouverture** → S'ouvre correctement
- [ ] **Champs formulaire** → Tous visibles et fonctionnels
- [ ] **Validation** → Erreurs affichées si champs invalides
- [ ] **Sauvegarde** → Données persistées après création
- [ ] **Fermeture** → Se ferme après action

### Modal Édition Événement
- [ ] **Pré-remplissage** → Données existantes chargées
- [ ] **Modifications** → Changements pris en compte
- [ ] **Sauvegarde** → Modifications persistées
- [ ] **Annulation** → Retour état initial

### Modal Création Client
- [ ] **Formulaire complet** → Tous champs présents
- [ ] **Validation** → Email/téléphone vérifiés
- [ ] **Sauvegarde** → Client ajouté à la liste

---

## 📱 TESTS RESPONSIVITÉ (Priorité 4)

### Mobile (< 768px)
- [ ] **Menu hamburger** → Fonctionne correctement
- [ ] **Navigation touch** → Boutons assez grands
- [ ] **Formulaires** → Utilisables au doigt
- [ ] **Modales** → S'adaptent à l'écran

### Tablet (768px - 1024px)
- [ ] **Layout adaptatif** → Utilise l'espace disponible
- [ ] **Sidebar** → Comportement approprié

### Desktop (> 1024px)
- [ ] **Interface complète** → Toutes sections visibles
- [ ] **Interactions souris** → Hover effects, tooltips

---

## 💾 TESTS GESTION DONNÉES (Priorité 3)

### Persistance
- [ ] **Refresh page** → Données conservées
- [ ] **Nouveau navigateur** → Données accessibles
- [ ] **Modifications** → Sauvegardées automatiquement

### Synchronisation
- [ ] **Temps réel** → Changes reflétés immédiatement
- [ ] **Cohérence** → Pas de données dupliquées

---

## 📊 RÉSULTATS DES TESTS

**Status** : 🔄 EN COURS  
**Tests completés** : 0/50+  
**Bugs identifiés** : À documenter  
**Fonctionnalités à réparer** : À lister

---

**Prochain step** : Commencer tests depuis page d'accueil
