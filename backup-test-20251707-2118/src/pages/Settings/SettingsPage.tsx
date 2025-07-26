import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, User, Shield, Bell, Palette, 
  Globe, Database, Download, Upload, RefreshCw
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePWA } from '@/hooks/usePWA'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import Toast from '@/components/ui/Toast'

const SettingsPage: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme()
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  }
  
  const handleExportData = () => {
    // Export all data as JSON
    const data = {
      events: JSON.parse(localStorage.getItem('mathilde_events') || '[]'),
      clients: JSON.parse(localStorage.getItem('mathilde_clients') || '[]'),
      settings: {
        theme,
        version: '1.0.0',
        exportDate: new Date().toISOString()
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mathilde-fleurs-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setToastMessage('Données exportées avec succès')
    setShowToast(true)
  }
  
  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            
            if (data.events) localStorage.setItem('mathilde_events', JSON.stringify(data.events))
            if (data.clients) localStorage.setItem('mathilde_clients', JSON.stringify(data.clients))
            
            setToastMessage('Données importées avec succès')
            setShowToast(true)
            
            // Reload page to refresh data
            setTimeout(() => window.location.reload(), 2000)
          } catch (error) {
            setToastMessage('Erreur lors de l\'importation')
            setShowToast(true)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
  
  const handleResetData = () => {
    if (window.confirm('⚠️ ATTENTION: Cette action supprimera toutes vos données de manière définitive. Êtes-vous sûr ?')) {
      localStorage.removeItem('mathilde_events')
      localStorage.removeItem('mathilde_clients')
      setToastMessage('Données réinitialisées')
      setShowToast(true)
      setTimeout(() => window.location.reload(), 2000)
    }
  }
  
  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'preferences', label: 'Préférences', icon: Palette }
  ]
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Paramètres
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configurez votre application selon vos préférences
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </motion.div>
      
      {/* Tab Content */}
      <motion.div variants={itemVariants}>
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* PWA Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Application Web Progressive</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Installation PWA
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isInstalled ? 'Application installée' : 'Installer l\'application sur votre appareil'}
                    </p>
                  </div>
                  <div>
                    {isInstalled ? (
                      <Badge variant="primary">Installée</Badge>
                    ) : isInstallable ? (
                      <Button variant="outline" size="sm" onClick={installApp}>
                        Installer
                      </Button>
                    ) : (
                      <Badge variant="secondary">Non disponible</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Mode hors ligne
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fonctionne sans connexion internet
                    </p>
                  </div>
                  <Badge variant="primary">Activé</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Notifications push
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recevez des rappels pour vos événements
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Data Management */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Gestion des données</span>
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleExportData}
                  >
                    Exporter les données
                  </Button>
                  
                  <Button
                    variant="outline"
                    leftIcon={<Upload className="w-4 h-4" />}
                    onClick={handleImportData}
                  >
                    Importer les données
                  </Button>
                  
                  <Button
                    variant="danger"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={handleResetData}
                  >
                    Réinitialiser
                  </Button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💾 Sauvegarde automatique
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Vos données sont automatiquement sauvegardées dans votre navigateur. 
                    Nous recommandons d'exporter régulièrement vos données par sécurité.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations du profil
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Configuration du profil disponible prochainement</p>
              <Button variant="outline" size="sm" className="mt-4" href="/settings/profile">
                Gérer le profil
              </Button>
            </div>
          </Card>
        )}
        
        {activeTab === 'security' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Paramètres de sécurité
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Paramètres de sécurité avancés</p>
              <Button variant="outline" size="sm" className="mt-4" href="/settings/security">
                Configurer la sécurité
              </Button>
            </div>
          </Card>
        )}
        
        {activeTab === 'preferences' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Préférences d'interface
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Personnalisez votre expérience utilisateur</p>
              <Button variant="outline" size="sm" className="mt-4" href="/settings/preferences">
                Personnaliser l'interface
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
      
      {/* Toast Notification */}
      {showToast && (
        <Toast
          type="success"
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </motion.div>
  )
}

export default SettingsPage