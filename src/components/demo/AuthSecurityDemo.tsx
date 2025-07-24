import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, AlertTriangle, Clock, User, Lock, 
  Activity, CheckCircle, XCircle, RefreshCw,
  Eye, Bell, Settings
} from 'lucide-react'
import { useAuth, useAuthSecurity, useAuthActions } from '@/contexts/AuthContextPro'

// =============================================================================
// COMPOSANT DÉMO DES FONCTIONNALITÉS DE SÉCURITÉ
// =============================================================================

export const AuthSecurityDemo = () => {
  const { user, profile, loading, error } = useAuth()
  const { securityMetrics, getTimeUntilUnblock } = useAuthSecurity()
  const { requestReauthentication, refreshSession } = useAuthActions()
  const [showReauthPrompt, setShowReauthPrompt] = useState(false)

  // =============================================================================
  // INDICATEUR DE STATUT SÉCURITÉ
  // =============================================================================

  const SecurityStatusCard = () => {
    const getStatusColor = () => {
      if (securityMetrics.isBlocked) return 'red'
      if (securityMetrics.failedAttempts > 2) return 'yellow'
      return 'green'
    }

    const getStatusText = () => {
      if (securityMetrics.isBlocked) {
        const minutes = Math.ceil(getTimeUntilUnblock() / 60000)
        return `Compte temporairement bloqué (${minutes}min restantes)`
      }
      if (securityMetrics.failedAttempts > 0) {
        return `${securityMetrics.failedAttempts} tentative(s) échouée(s) récente(s)`
      }
      return 'Statut de sécurité optimal'
    }

    const statusColor = getStatusColor()

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border-2 ${
          statusColor === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
          statusColor === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
          'border-green-500 bg-green-50 dark:bg-green-900/20'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            statusColor === 'red' ? 'bg-red-500' :
            statusColor === 'yellow' ? 'bg-yellow-500' :
            'bg-green-500'
          }`}>
            {statusColor === 'red' ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : statusColor === 'yellow' ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-semibold ${
              statusColor === 'red' ? 'text-red-800 dark:text-red-200' :
              statusColor === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
              'text-green-800 dark:text-green-200'
            }`}>
              Sécurité du compte
            </h3>
            <p className={`text-sm ${
              statusColor === 'red' ? 'text-red-600 dark:text-red-300' :
              statusColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-300' :
              'text-green-600 dark:text-green-300'
            }`}>
              {getStatusText()}
            </p>
          </div>

          {securityMetrics.isBlocked && (
            <div className="text-right">
              <Clock className="w-4 h-4 text-red-500 mx-auto mb-1" />
              <span className="text-xs text-red-600 dark:text-red-300">
                {Math.ceil(getTimeUntilUnblock() / 1000)}s
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression des tentatives */}
        {!securityMetrics.isBlocked && securityMetrics.failedAttempts > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                Tentatives échouées
              </span>
              <span className={statusColor === 'yellow' ? 'text-yellow-600' : 'text-gray-600'}>
                {securityMetrics.failedAttempts}/5
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(securityMetrics.failedAttempts / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // =============================================================================
  // INFORMATIONS DE SESSION
  // =============================================================================

  const SessionInfoCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Session actuelle
          </h3>
        </div>
        
        <motion.button
          onClick={() => refreshSession()}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Utilisateur :</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {user?.email}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Rôle :</span>
          <span className="font-medium text-gray-900 dark:text-white capitalize">
            {profile?.role || 'user'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Dernière connexion :</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {profile?.last_login 
              ? new Date(profile.last_login).toLocaleDateString('fr-FR')
              : 'Première connexion'
            }
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Connexions totales :</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {profile?.login_count || 0}
          </span>
        </div>
      </div>
    </motion.div>
  )

  // =============================================================================
  // ACTIONS SÉCURISÉES
  // =============================================================================

  const SecurityActionsCard = () => {
    const handleSensitiveAction = async () => {
      setShowReauthPrompt(true)
      
      const { error } = await requestReauthentication()
      
      if (error) {
        console.error('Réauthentification échouée:', error)
        setShowReauthPrompt(false)
      } else {
        // Simuler une action sensible
        setTimeout(() => {
          alert('Action sensible exécutée avec succès !')
          setShowReauthPrompt(false)
        }, 1000)
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-2 mb-3">
          <Lock className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Actions sécurisées
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Ces actions nécessitent une réauthentification pour votre sécurité.
        </p>

        <div className="space-y-2">
          <motion.button
            onClick={handleSensitiveAction}
            disabled={loading || showReauthPrompt}
            className="w-full p-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            whileHover={{ scale: showReauthPrompt ? 1 : 1.02 }}
            whileTap={{ scale: showReauthPrompt ? 1 : 0.98 }}
          >
            {showReauthPrompt ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Changer le mot de passe</span>
              </>
            )}
          </motion.button>

          <motion.button
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres de sécurité</span>
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // =============================================================================
  // MONITORING DES ÉVÉNEMENTS
  // =============================================================================

  const SecurityEventsCard = () => {
    // En vrai, tu récupérerais les événements du SecurityAuditor
    const mockEvents = [
      { id: '1', type: 'signin_success', timestamp: new Date(Date.now() - 300000), severity: 'low' },
      { id: '2', type: 'profile_updated', timestamp: new Date(Date.now() - 1800000), severity: 'low' },
      { id: '3', type: 'token_refreshed', timestamp: new Date(Date.now() - 3600000), severity: 'low' },
    ]

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical': return 'text-red-500'
        case 'high': return 'text-orange-500' 
        case 'medium': return 'text-yellow-500'
        default: return 'text-green-500'
      }
    }

    const getEventIcon = (type: string) => {
      if (type.includes('signin')) return <User className="w-4 h-4" />
      if (type.includes('profile')) return <Settings className="w-4 h-4" />
      if (type.includes('token')) return <RefreshCw className="w-4 h-4" />
      return <Activity className="w-4 h-4" />
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-2 mb-3">
          <Eye className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Activité récente
          </h3>
        </div>

        <div className="space-y-3">
          {mockEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className={`flex-shrink-0 ${getSeverityColor(event.severity)}`}>
                {getEventIcon(event.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {event.timestamp.toLocaleString('fr-FR')}
                </p>
              </div>
              
              <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                event.severity === 'critical' ? 'bg-red-500' :
                event.severity === 'high' ? 'bg-orange-500' :
                event.severity === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
            </div>
          ))}
        </div>

        <motion.button
          className="w-full mt-3 p-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Voir tous les événements
        </motion.button>
      </motion.div>
    )
  }

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connectez-vous pour voir le dashboard sécurité
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Les informations de sécurité ne sont disponibles que pour les utilisateurs connectés.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Sécurité
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitoring en temps réel de la sécurité de votre compte
        </p>
      </div>

      {/* Alerte d'erreur globale */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300 font-medium">
                Erreur d'authentification
              </span>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille des cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SecurityStatusCard />
        <SessionInfoCard />
        <SecurityActionsCard />
        <SecurityEventsCard />
      </div>

      {/* Prompt de réauthentification */}
      <AnimatePresence>
        {showReauthPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowReauthPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Vérification de sécurité
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Un email de vérification a été envoyé. Cliquez sur le lien pour confirmer votre identité.
                </p>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => setShowReauthPrompt(false)}
                    className="flex-1 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Annuler
                  </motion.button>
                  
                  <motion.button
                    className="flex-1 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Vérifier
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AuthSecurityDemo