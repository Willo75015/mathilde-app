# 🚀 Configuration Supabase pour Mathilde Fleurs

## 1. Créer un projet Supabase

1. Va sur [app.supabase.com](https://app.supabase.com)
2. Crée un nouveau projet "mathilde-fleurs"
3. Note bien ton URL et ta clé anon

## 2. Configurer la base de données

### Option A : Via l'interface Supabase
1. Va dans l'éditeur SQL
2. Copie/colle le contenu de `supabase/schema.sql`
3. Execute

### Option B : Via le CLI Supabase
```bash
# Installer le CLI
npm install -g supabase

# Se connecter
supabase login

# Link ton projet
supabase link --project-ref <ton-project-ref>

# Exécuter le schema
supabase db push
```

## 3. Configurer l'authentification

Dans Supabase Dashboard :
1. Authentication > Providers
2. Active "Email" 
3. Configure les templates d'emails en français

## 4. Configurer le .env local

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. Sécurité RLS (Row Level Security)

### Policies recommandées :

```sql
-- Clients : lecture pour tous les authentifiés, écriture pour admin/florist
CREATE POLICY "Lecture clients" ON clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Écriture clients" ON clients
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'florist')
    )
  );

-- Events : liés au client ou créés par florist/admin
CREATE POLICY "Lecture events" ON events
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      client_id IN (SELECT id FROM clients WHERE email = auth.email()) OR
      auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'florist'))
    )
  );
```

## 6. Synchronisation temps réel (optionnel)

Pour activer les updates temps réel :

```typescript
// Dans ton composant React
useEffect(() => {
  const subscription = supabase
    .channel('events-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'events' }, 
      (payload) => {
        console.log('Change received!', payload)
        // Refresh les données
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

## 7. Backup & Migration

### Backup automatique
Supabase fait des backups automatiques toutes les 24h (gratuit) ou toutes les heures (pro).

### Export manuel
```bash
supabase db dump -f backup.sql
```

## 8. Monitoring

Dans Supabase Dashboard :
- Database > Logs : pour voir les requêtes
- Database > Performance : pour optimiser
- Authentication > Users : pour gérer les utilisateurs

## 🎯 Checklist de déploiement

- [ ] Schema SQL exécuté
- [ ] RLS activé sur toutes les tables
- [ ] Policies configurées
- [ ] Variables d'environnement configurées
- [ ] Auth email configuré
- [ ] Données de test insérées
- [ ] Tests de connexion OK
