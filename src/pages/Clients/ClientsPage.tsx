// 🌸 ClientsPage.tsx - Page CRM Sophistiquée avec ClientContext
// Interface moderne avec search < 200ms + analytics + patterns React Aria

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Grid, List, BarChart3, Users, Download, RefreshCw,
  Filter, Search, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useClients, useClientSearch } from '../../contexts/ClientContext';
import ClientList from '../../components/clients/ClientList';
import ClientSearch from '../../components/clients/ClientSearch';
import ClientAnalytics from '../../components/clients/ClientAnalytics';
import { CreateClientModal, EditClientModal } from '../../components/modals';

interface ClientsPageProps {
  navigate?: (page: string, params?: any) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ navigate }) => {
  const { 
    state, 
    clientsCount, 
    activeClientsCount, 
    averageClientValue,
    setViewMode, 
    setSelectedClient,
    loadClients
  } = useClients();
  
  const { searchFilters, searchResults, searchPerformance } = useClientSearch();
  
  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<'clients' | 'analytics'>('clients');
  
  // Handlers
  const handleCreateClient = () => {
    setShowCreateModal(true);
  };
  
  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };
  
  const handleClientSelect = (client: any) => {
    navigate?.('clients/profile', { clientId: client.id });
  };
  
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clients data');
  };
  
  const handleRefresh = () => {
    loadClients();
  };
  
  // Quick stats pour header
  const quickStats = {
    total: clientsCount,
    active: activeClientsCount,
    avgValue: averageClientValue,
    performance: searchPerformance
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Titre et actions principales */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Clients CRM</h1>
                  <p className="text-sm text-gray-500">
                    Gestion complète de votre portefeuille client
                  </p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={state.loading.clients}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
                           text-gray-700 bg-white border border-gray-300 rounded-md
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${state.loading.clients ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
                           text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
                
                <button
                  onClick={handleCreateClient}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                           text-white bg-pink-600 border border-transparent rounded-md
                           hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau Client
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{quickStats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Clients Actifs</p>
                    <p className="text-2xl font-bold text-green-900">{quickStats.active}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Valeur Moyenne</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {quickStats.avgValue.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR',
                        maximumFractionDigits: 0 
                      })}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className={`rounded-lg px-4 py-3 ${
                quickStats.performance <= 200 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      quickStats.performance <= 200 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Performance Search
                    </p>
                    <p className={`text-2xl font-bold ${
                      quickStats.performance <= 200 ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {quickStats.performance || 0}ms
                    </p>
                  </div>
                  <Search className={`w-8 h-8 ${
                    quickStats.performance <= 200 ? 'text-green-400' : 'text-red-400'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setCurrentTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'clients'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Liste Clients
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {quickStats.total}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'analytics'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics CRM
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'clients' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search & Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <ClientSearch
                placeholder="Rechercher par nom, email, téléphone, ville..."
                onClientSelect={handleClientSelect}
                showFilters={true}
              />
            </div>
            
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  {searchFilters.query ? (
                    <>
                      <span className="font-medium">{searchResults.length}</span> résultat{searchResults.length > 1 ? 's' : ''} 
                      pour "{searchFilters.query}"
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{quickStats.total}</span> client{quickStats.total > 1 ? 's' : ''} au total
                    </>
                  )}
                </p>
                
                {quickStats.performance > 200 && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Recherche lente ({quickStats.performance}ms)
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      state.viewMode === 'list' 
                        ? 'bg-pink-100 text-pink-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      state.viewMode === 'grid' 
                        ? 'bg-pink-100 text-pink-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label="Vue grille"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Liste des clients */}
            {state.loading.clients ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Chargement des clients...
                </div>
              </div>
            ) : (
              <ClientList
                viewMode={state.viewMode}
                onEditClient={handleEditClient}
                onClientSelect={handleClientSelect}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              />
            )}
          </motion.div>
        )}
        
        {currentTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClientAnalytics />
          </motion.div>
        )}
      </div>
      
      {/* Modals */}
      {showCreateModal && (
        <CreateClientModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          navigate={navigate}
        />
      )}
      
      {showEditModal && state.selectedClient && (
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
          client={state.selectedClient}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default ClientsPage;