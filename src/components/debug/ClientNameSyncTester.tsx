// 🧪 SCRIPT DE TEST POUR VÉRIFIER LA SYNCHRONISATION DES NOMS DE CLIENTS
// Créé le 17/07/2025 pour corriger le bug "Client non spécifié"

import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle, AlertTriangle, Users } from 'lucide-react'
import { useApp } from "@/contexts/AppContextSupabase"
import Button from '@/components/ui/Button'

const ClientNameSyncTester = () => {
  const { events, syncClientNames } = useEvents()
  const { clients } = useClients()
  
  // Analyser les événements pour détecter les problèmes
  const analysisResults = React.useMemo(() => {
    const total = events.length
    const withoutClientName = events.filter(e => !e.clientName || e.clientName === 'Client non spécifié').length
    const withValidClientName = events.filter(e => e.clientName && e.clientName !== 'Client non spécifié').length
    const missingClients = events.filter(e => {
      const client = clients.find(c => c.id === e.clientId)
      return !client
    }).length
    
    const problems = events.filter(e => {
      const client = clients.find(c => c.id === e.clientId)
      if (!client) return true
      const expectedName = `${client.firstName} ${client.lastName}`
      return !e.clientName || e.clientName !== expectedName
    })
    
    return {
      total,
      withoutClientName,
      withValidClientName,
      missingClients,
      problemsCount: problems.length,
      problems: problems.map(e => ({
        id: e.id,
        title: e.title,
        currentClientName: e.clientName || 'Non défini',
        clientId: e.clientId,
        expectedClientName: (() => {
          const client = clients.find(c => c.id === e.clientId)
          return client ? `${client.firstName} ${client.lastName}` : 'Client introuvable'
        })()
      }))
    }
  }, [events, clients])
  
  const handleSync = () => {
    console.log('🧪 TEST - Synchronisation manuelle déclenchée')
    syncClientNames()
  }
  
  const getStatusColor = () => {
    if (analysisResults.problemsCount === 0) return 'text-green-600'
    if (analysisResults.problemsCount <= 2) return 'text-orange-600'
    return 'text-red-600'
  }
  
  const getStatusIcon = () => {
    if (analysisResults.problemsCount === 0) return CheckCircle
    return AlertTriangle
  }
  
  const StatusIcon = getStatusIcon()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Synchronisation Noms Clients
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Outil de diagnostic et correction
            </p>
          </div>
        </div>
        
        <Button
          variant="primary"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={handleSync}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Synchroniser
        </Button>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analysisResults.total}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Événements total
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analysisResults.withValidClientName}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Avec nom client
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {analysisResults.withoutClientName}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Sans nom client
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {analysisResults.missingClients}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400">
            Clients introuvables
          </div>
        </div>
      </div>
      
      {/* Statut global */}
      <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg ${
        analysisResults.problemsCount === 0 
          ? 'bg-green-50 dark:bg-green-900/20' 
          : 'bg-orange-50 dark:bg-orange-900/20'
      }`}>
        <StatusIcon className={`w-5 h-5 ${getStatusColor()}`} />
        <div>
          <p className={`font-medium ${getStatusColor()}`}>
            {analysisResults.problemsCount === 0 
              ? '✅ Tous les noms de clients sont synchronisés' 
              : `⚠️ ${analysisResults.problemsCount} problème(s) détecté(s)`
            }
          </p>
          {analysisResults.problemsCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cliquez sur "Synchroniser" pour corriger automatiquement
            </p>
          )}
        </div>
      </div>
      
      {/* Liste des problèmes */}
      {analysisResults.problems.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Événements à corriger :
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analysisResults.problems.slice(0, 10).map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  "{problem.title}"
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  <span className="text-red-600">Actuel:</span> {problem.currentClientName}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="text-green-600">Attendu:</span> {problem.expectedClientName}
                </div>
              </motion.div>
            ))}
            {analysisResults.problems.length > 10 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                ... et {analysisResults.problems.length - 10} autre(s)
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ClientNameSyncTester


