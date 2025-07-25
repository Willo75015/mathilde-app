import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, AlertTriangle, Activity, Lock, Unlock, Eye, Trash2 } from 'lucide-react'
import { useAuth, useAuthSecurity, useSessionManagement } from '@/contexts/AuthContextPro'

interface SecurityEvent {
  id: string
  event_type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  created_at: string
  user_agent: string
  fingerprint: string
}

interface UserSession {
  id: string
  fingerprint: string
  user_agent: string
  created_at: string
  last_activity: string
  is_active: boolean
  failed_attempts: number
}

export const SecurityDashboard: React.FC = () => {
  const { user, getSecurityEvents } = useAuth()
  const { securityMetrics } = useAuthSecurity()
  const { getUserSessions, terminateSession, terminateAllSessions, currentSessionId } = useSessionManagement()
  
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Charger les données
  const loadSecurityData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const [securityEvents, userSessions] = await Promise.all([
        getSecurityEvents(20),
        getUserSessions()
      ])
      
      setEvents(securityEvents)
      setSessions(userSessions)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erreur chargement données sécurité:', error)
    } finally {
      setLoading(false)
    }
  }

  // Terminer une session
  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateSession(sessionId)
      await loadSecurityData() // Recharger les données
    } catch (error) {
      console.error('Erreur terminaison session:', error)
    }
  }

  // Terminer toutes les sessions
  const handleTerminateAllSessions = async () => {
    try {
      await terminateAllSessions()
      await loadSecurityData()
    } catch (error) {
      console.error('Erreur terminaison toutes sessions:', error)
    }
  }

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    loadSecurityData()
    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Obtenir l'icône selon le type d'événement
  const getEventIcon = (eventType: string, severity: string) => {
    if (severity === 'critical') return '🚨'
    if (severity === 'warning') return '⚠️'
    if (eventType.includes('success')) return '✅'
    if (eventType.includes('failed')) return '❌'
    return 'ℹ️'
  }

  // Obtenir la couleur selon la sévérité
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Extraire le navigateur depuis user agent
  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return '🌐 Chrome'
    if (userAgent.includes('Firefox')) return '🦊 Firefox'
    if (userAgent.includes('Safari')) return '🧭 Safari'
    if (userAgent.includes('Edge')) return '🔷 Edge'
    return '🌐 Navigateur'
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Connectez-vous pour voir le dashboard de sécurité</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-500" />
            Dashboard Sécurité
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dernière mise à jour : {formatDate(lastUpdate.toISOString())}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadSecurityData}
          disabled={loading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualisation...' : 'Actualiser'}
        </motion.button>
      </div>

      {/* Métriques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tentatives échouées</p>
              <p className="text-2xl font-bold text-red-600">{securityMetrics.failedAttempts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut compte</p>
              <p className={`text-2xl font-bold ${securityMetrics.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                {securityMetrics.isBlocked ? 'BLOQUÉ' : 'ACTIF'}
              </p>
            </div>
            {securityMetrics.isBlocked ? (
              <Lock className="w-8 h-8 text-red-500" />
            ) : (
              <Unlock className="w-8 h-8 text-green-500" />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sessions actives</p>
              <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Activité suspecte</p>
              <p className={`text-2xl font-bold ${securityMetrics.suspiciousActivity ? 'text-orange-600' : 'text-green-600'}`}>
                {securityMetrics.suspiciousActivity ? 'DÉTECTÉE' : 'AUCUNE'}
              </p>
            </div>
            <Eye className={`w-8 h-8 ${securityMetrics.suspiciousActivity ? 'text-orange-500' : 'text-green-500'}`} />
          </div>
        </motion.div>
      </div>

      {/* Sessions actives */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sessions actives ({sessions.length})
          </h2>
          {sessions.length > 1 && (
            <button
              onClick={handleTerminateAllSessions}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Terminer toutes
            </button>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune session active</p>
          ) : (
            sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  session.id === currentSessionId 
                    ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/20' 
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {getBrowserInfo(session.user_agent)}
                      </span>
                      {session.id === currentSessionId && (
                        <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                          Session actuelle
                        </span>
                      )}
                      {session.failed_attempts > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {session.failed_attempts} échecs
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>📅 Créée : {formatDate(session.created_at)}</p>
                      <p>🔄 Dernière activité : {formatDate(session.last_activity)}</p>
                      <p>🔍 Empreinte : {session.fingerprint}</p>
                    </div>
                  </div>
                  
                  {session.id !== currentSessionId && (
                    <button
                      onClick={() => handleTerminateSession(session.id)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Terminer cette session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Événements de sécurité */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Événements de sécurité récents ({events.length})
          </h2>
        </div>
        
        <div className="p-4">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun événement de sécurité</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getEventIcon(event.event_type, event.severity)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {event.event_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          event.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {event.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {event.message}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>📅 {formatDate(event.created_at)}</p>
                        <p>🌐 {getBrowserInfo(event.user_agent)}</p>
                        <p>🔍 {event.fingerprint}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default SecurityDashboard

