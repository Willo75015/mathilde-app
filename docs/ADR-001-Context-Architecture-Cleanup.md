# ADR-001: Context Architecture Cleanup & Reorganization

**Date:** 2025-07-25  
**Status:** APPROVED  
**Authors:** Claude Sonnet 4 + Bill  

## 🎯 Context & Problem Statement

**CURRENT SITUATION - AUDIT RESULTS:**
- **21 contexts total** dans `/src/contexts/`
- **10+ backups** d'AppContext avec noms comme `AppContext-EMERGENCY.tsx`, `AppContext-AVEC-BOUCLES.tsx`
- **AppContext principal** = 496 lignes avec TOUT mélangé (fleuristes hardcodés, business logic, state management)
- **Architecture spaghetti** = zero separation of concerns
- **Supabase backend** = PARFAIT (tables clean, RLS OK, relations proper)

**PROBLEMES CRITIQUES IDENTIFIES:**
1. **Duplication massive** - 10+ versions d'AppContext 
2. **God Context** - AppContext fait TOUT (auth, events, florists, clients, theme, notifications)
3. **Data hardcodée** - fleuristes en dur dans le context au lieu du backend
4. **No Domain Separation** - logique métier mélangée partout
5. **No TypeScript proper** - types flous, any partout
6. **Performance issues** - re-renders en cascade sur tout changement

## 🚀 Decision: Architecture Cible "Context7-Inspired"

### **PATTERN: Context par Domaine Métier**

```
src/contexts/
├── AuthContext.tsx          # ✅ KEEP - déjà bien fait
├── AppContext.tsx           # 🔄 REFACTOR - global app state seulement  
├── EventContext.tsx         # 🆕 CREATE - events + real-time
├── FloristContext.tsx       # 🆕 CREATE - florists + assignments
├── ClientContext.tsx        # 🆕 CREATE - clients + preferences
├── ThemeContext.tsx         # ✅ KEEP - déjà minimal
└── [SUPPRIME 15+ BACKUPS]   # 🗑️ DELETE - tous les doublons
```

### **RESPONSABILITES CLAIRES:**
- **AuthContext** : Session, user, login/logout (GARDE tel quel - déjà bien)
- **AppContext** : Navigation, loading global, error global, current page
- **EventContext** : CRUD events, real-time sync, status transitions  
- **FloristContext** : CRUD florists, availability, assignment logic
- **ClientContext** : CRUD clients, preferences, historique
- **ThemeContext** : UI theme seulement

## 📋 Implementation Plan - CHUNK 1 Immediate Actions

### **PHASE 1: Backup & Safety (30 min)**
1. Create backup branch `backup/pre-cleanup`
2. Git commit current state 
3. Create working branch `maintenance/contexts-cleanup`

### **PHASE 2: Suppression Sécurisée (2h)**
**ORDRE DE SUPPRESSION - ZERO RISK:**

```bash
# 1. Supprimer les backups évidents (0 impact UX)
DELETE: AppContext-EMERGENCY.tsx
DELETE: AppContext-AVEC-BOUCLES.tsx  
DELETE: AppContext-ORIGINAL-AVEC-BOUCLES.tsx
DELETE: AppContext-SUPER-SIMPLE.tsx
DELETE: AppContext.backup-before-clientname-fix.tsx
DELETE: AppContext.tsx.backup-avant-fix-boucle
DELETE: AppContext.tsx.backup-before-refresh-fix
DELETE: AppContext.tsx.BACKUP-INFINITE-REFRESH  
DELETE: AppContext.tsx.backup-sync-fix-20250717
DELETE: ThemeContext.backup.tsx

# 2. Analyser et décider pour les contexts actifs
ANALYSE: AuthContextEnhanced.tsx vs AuthContext.tsx
ANALYSE: AuthContextPro.tsx vs AuthContext.tsx
ANALYSE: AppContextSupabase.tsx vs AppContext.tsx
ANALYSE: AppGlobalContext.tsx vs AppContext.tsx
```

### **PHASE 3: AppContext Refactor (3h)**
**PATTERN CIBLE:**
```typescript
// AppContext.tsx - MINIMAL GLOBAL STATE
interface AppContextType {
  // Navigation
  currentPage: string
  navigate: (page: string) => void
  
  // Global UI State  
  globalLoading: boolean
  globalError: string | null
  setGlobalLoading: (loading: boolean) => void
  setGlobalError: (error: string | null) => void
  
  // Theme shortcut (délègue au ThemeContext)
  currentTheme: Theme
}
```

**EXTRACTION RULES:**
- Events logic → EventContext (nouveau)
- Florists logic → FloristContext (nouveau)  
- Clients logic → ClientContext (nouveau)
- Auth logic → DEJA dans AuthContext ✅
- Theme logic → DEJA dans ThemeContext ✅

## ✅ Success Metrics - CHUNK 1

### **IMMEDIATE VALIDATION:**
- [ ] **Zero breaking changes** - app démarre identique
- [ ] **Bundle size reduced** - moins de contexts chargés
- [ ] **Clean contexts folder** - max 6 contexts vs 21 actuels
- [ ] **AppContext < 100 lignes** vs 496 actuels
- [ ] **TypeScript errors = 0** 
- [ ] **All workflows fonctionnels** (auth, events, assignments)

### **ARCHITECTURE VALIDATION:**
- [ ] **Single Responsibility** - chaque context = 1 domaine
- [ ] **Separation of Concerns** - business logic isolated
- [ ] **Type Safety** - interfaces claires pour chaque context
- [ ] **Performance** - pas de re-renders inutiles

## 🚨 Risk Mitigation

### **ZERO BREAKING CHANGES STRATEGY:**
1. **Backup first** - branch backup avant toute action
2. **Delete backups only** - ne toucher QUE aux doublons évidents  
3. **Test after each deletion** - `npm run dev` après chaque suppression
4. **Rollback ready** - git reset si problème
5. **Incremental commits** - commit après chaque étape validée

### **VALIDATION CONTINUE:**
```bash
# Après chaque suppression
npm run dev              # ✅ App démarre
npm run build            # ✅ Build OK  
npm run type-check       # ✅ TypeScript OK
```

## 📊 Expected Benefits

### **IMMEDIATE (CHUNK 1):**
- **-70% contexts files** (21 → 6)
- **-80% AppContext size** (496 → ~100 lignes)
- **-50% bundle initial** (moins de contexts chargés)
- **Clean architecture** - responsabilités claires

### **MEDIUM TERM (CHUNKS 2-3):**
- **useReducer patterns** - états complexes optimisés
- **Real-time efficiency** - subscriptions par domaine
- **Type safety 100%** - interfaces strictes
- **Team velocity +50%** - code facile à comprendre

## 🎬 Next Steps - EXECUTION READY

**IMMEDIATE ACTION PLAN:**
1. **Backup** : Create safety branches
2. **Clean** : Delete 15+ backup files  
3. **Refactor** : Extract AppContext logic to domain contexts
4. **Test** : Validate zero regression
5. **Commit** : Document changes with clear messages

**FOLLOW-UP CHUNKS:**
- CHUNK 2: Event workflow optimization
- CHUNK 3: Florist assignment logic
- CHUNK 4: Client management enhancement
- CHUNK 5: Real-time subscriptions optimization

---

**🚀 APPROVED FOR EXECUTION - Cette architecture va transformer le chaos en code propre !**