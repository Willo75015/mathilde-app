# 🚀 SETUP MCP VERCEL - CONFIGURATION AUTOMATIQUE

## 📋 ÉTAPE 1 : Installation MCP Vercel

```bash
# Installer le SDK Vercel en global
npm install -g @vercel/sdk

# Ou localement dans le projet
npm install @vercel/sdk
```

## 🔑 ÉTAPE 2 : Configuration MCP Server

### Option A - Configuration Claude Desktop

Ajouter dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "Vercel": {
      "command": "npx",
      "args": [
        "-y", "--package", "@vercel/sdk",
        "--",
        "mcp", "start",
        "--bearer-token", "TON_VERCEL_TOKEN_ICI"
      ]
    }
  }
}
```

### Option B - Configuration Cursor

Ajouter dans la config Cursor :

```json
{
  "mcpServers": {
    "Vercel": {
      "command": "npx",
      "args": [
        "-y", "--package", "@vercel/sdk",
        "--",
        "mcp", "start",
        "--bearer-token", "TON_VERCEL_TOKEN_ICI"
      ]
    }
  }
}
```

## 🔐 ÉTAPE 3 : Récupérer le Bearer Token Vercel

1. Va sur https://vercel.com/account/tokens
2. Clique "Create Token"
3. Nomme-le "MCP-Claude-Mathilde"
4. Copie le token généré

## ⚡ ÉTAPE 4 : Fonctionnalités Disponibles

Une fois configuré, je pourrai :

### 🔑 **Variables d'environnement**
```typescript
// Créer/Mettre à jour des variables d'env
await vercel.projects.createProjectEnv({
  idOrName: "mathillde-originel-app",
  requestBody: {
    key: "VITE_SUPABASE_URL",
    value: "https://ton-projet.supabase.co",
    type: "plain",
    target: ["production", "preview", "development"]
  }
})
```

### 🚀 **Déploiements**
```typescript
// Lister les déploiements
await vercel.deployments.listDeployments()

// Redéployer
await vercel.deployments.createDeployment()
```

### 📊 **Monitoring**
```typescript
// Status du projet
await vercel.projects.getProject({ idOrName: "mathillde-originel-app" })
```

## 🎯 CE QU'ON PEUT FAIRE IMMÉDIATEMENT

1. **Configurer automatiquement** toutes les variables Supabase
2. **Redéployer** l'app après config
3. **Monitorer** le status des builds
4. **Gérer** les domaines personnalisés
5. **Debugger** les erreurs de déploiement

## 🚨 IMPORTANT

⚠️ **Garde ton Bearer Token secret !** Ne le commit jamais dans Git !

✅ **Avantages vs Dashboard :**
- **Automatisation complète**
- **Gestion par code** 
- **Monitoring en temps réel**
- **Rollbacks automatiques**
- **Configuration reproductible**

---

## 🎉 PROCHAINES ÉTAPES

1. Récupère ton Vercel Bearer Token
2. Configure le MCP (je t'aide)
3. Je configure automatiquement toutes tes variables d'env
4. L'app sera 100% fonctionnelle !
