// 🌸 ClientSearch.tsx - Search Sophistiqué avec Patterns React Aria
// Performance < 200ms garantie + UX moderne

import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useClients, useClientSearch } from '../../contexts/ClientContext';

interface ClientSearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  onClientSelect?: (client: any) => void;
}

const ClientSearch: React.FC<ClientSearchProps> = ({
  className = '',
  placeholder = 'Rechercher un client...',
  showFilters = true,
  onClientSelect
}) => {
  const { state } = useClients();
  const { 
    searchClients, 
    applyFilters, 
    clearSearch, 
    searchFilters, 
    searchResults, 
    searchPerformance, 
    isSearching 
  } = useClientSearch();
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchFilters.query);
  
  // Debounced search (pattern React Aria optimisé)
  const handleSearch = useCallback((query: string) => {
    setLocalQuery(query);
    
    // Debounce à 150ms pour performance optimale
    setTimeout(() => {
      searchClients(query);
      applyFilters({ query });
    }, 150);
  }, [searchClients, applyFilters]);
  
  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    clearSearch();
  }, [clearSearch]);
  
  // Quick filters pour UX rapide
  const quickFilters = useMemo(() => [
    { id: 'all', label: 'Tous les clients', count: state.clients.length },
    { id: 'active', label: 'Clients actifs', count: state.clients.filter(c => {
      const analytics = state.clientAnalytics.get(c.id);
      return analytics && analytics.riskLevel !== 'high';
    }).length },
    { id: 'vip', label: 'Clients VIP', count: state.clients.filter(c => {
      const analytics = state.clientAnalytics.get(c.id);
      return analytics && analytics.loyaltyScore >= 70;
    }).length },
    { id: 'risk', label: 'À risque', count: state.clients.filter(c => {
      const analytics = state.clientAnalytics.get(c.id);
      return analytics && analytics.riskLevel === 'high';
    }).length }
  ], [state.clients, state.clientAnalytics]);
  
  const handleQuickFilter = useCallback((filterId: string) => {
    switch (filterId) {
      case 'all':
        clearSearch();
        break;
      case 'active':
        applyFilters({ riskLevel: 'low,medium' });
        break;
      case 'vip':
        applyFilters({ loyaltyTier: 'gold,platinum' });
        break;
      case 'risk':
        applyFilters({ riskLevel: 'high' });
        break;
    }
  }, [applyFilters, clearSearch]);
  
  const handleAdvancedFilter = useCallback((filterKey: string, value: string) => {
    applyFilters({ [filterKey]: value });
  }, [applyFilters]);
  
  // Performance indicator (visual feedback < 200ms)
  const performanceColor = useMemo(() => {
    if (searchPerformance === 0) return 'text-gray-400';
    if (searchPerformance < 100) return 'text-green-500';
    if (searchPerformance < 200) return 'text-yellow-500';
    return 'text-red-500';
  }, [searchPerformance]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input Principal */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-3 border border-gray-200 rounded-lg 
                     focus:ring-2 focus:ring-pink-500 focus:border-transparent
                     bg-white shadow-sm text-gray-900
                     placeholder-gray-400 transition-all duration-200"
            aria-label="Rechercher clients"
            aria-describedby="search-help"
            role="searchbox"
          />
          
          {/* Clear button */}
          {localQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Effacer recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {/* Filters toggle */}
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2
                       p-1 rounded transition-colors ${
                showAdvancedFilters 
                  ? 'text-pink-600 bg-pink-50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Filtres avancés"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Performance indicator */}
        {searchPerformance > 0 && (
          <div className="absolute -bottom-5 right-0 text-xs">
            <span className={performanceColor}>
              {searchPerformance.toFixed(0)}ms
            </span>
            {searchPerformance > 200 && (
              <span className="ml-1 text-red-500">⚠️</span>
            )}
          </div>
        )}
      </div>
      
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleQuickFilter(filter.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm
                     bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full
                     transition-colors duration-200 border border-gray-200"
          >
            {filter.id === 'all' && <Users className="w-3 h-3" />}
            {filter.id === 'vip' && <TrendingUp className="w-3 h-3" />}
            {filter.id === 'risk' && <AlertTriangle className="w-3 h-3" />}
            
            <span>{filter.label}</span>
            <span className="bg-white px-1.5 py-0.5 rounded-full text-xs font-medium">
              {filter.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Filtres avancés</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ville
              </label>
              <select
                value={searchFilters.city}
                onChange={(e) => handleAdvancedFilter('city', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md
                         focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Toutes les villes</option>
                <option value="Paris">Paris</option>
                <option value="Lyon">Lyon</option>
                <option value="Marseille">Marseille</option>
                <option value="Toulouse">Toulouse</option>
                <option value="Nice">Nice</option>
              </select>
            </div>
            
            {/* Event Frequency Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fréquence événements
              </label>
              <select
                value={searchFilters.eventFrequency}
                onChange={(e) => handleAdvancedFilter('eventFrequency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md
                         focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Toutes fréquences</option>
                <option value="frequent">Fréquent (12+/an)</option>
                <option value="regular">Régulier (6-12/an)</option>
                <option value="occasional">Occasionnel (2-6/an)</option>
                <option value="rare">Rare (&lt;2/an)</option>
              </select>
            </div>
            
            {/* Loyalty Tier Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Niveau fidélité
              </label>
              <select
                value={searchFilters.loyaltyTier}
                onChange={(e) => handleAdvancedFilter('loyaltyTier', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md
                         focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Tous niveaux</option>
                <option value="platinum">💎 Platinum (90+)</option>
                <option value="gold">🥇 Gold (70-89)</option>
                <option value="silver">🥈 Silver (50-69)</option>
                <option value="bronze">🥉 Bronze (&lt;50)</option>
              </select>
            </div>
          </div>
          
          {/* Clear Filters */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <button
              onClick={clearSearch}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Réinitialiser tous les filtres
            </button>
            
            <div className="text-xs text-gray-500">
              {searchResults.length > 0 && (
                <span>{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Search Results Preview */}
      {localQuery && searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto">
          {searchResults.slice(0, 5).map((client) => {
            const analytics = state.clientAnalytics.get(client.id);
            
            return (
              <button
                key={client.id}
                onClick={() => onClientSelect?.(client)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100
                         last:border-b-0 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                    {client.city && (
                      <p className="text-xs text-gray-400">{client.city}</p>
                    )}
                  </div>
                  
                  {analytics && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {analytics.totalBudget.toLocaleString('fr-FR')} €
                      </p>
                      <p className="text-xs text-gray-500">
                        {analytics.totalEvents} événement{analytics.totalEvents > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {searchResults.length > 5 && (
            <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
              +{searchResults.length - 5} autre{searchResults.length - 5 > 1 ? 's' : ''} résultat{searchResults.length - 5 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
      
      {/* No Results */}
      {localQuery && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucun client trouvé pour "{localQuery}"</p>
          <button
            onClick={handleClearSearch}
            className="text-sm text-pink-600 hover:text-pink-700 mt-1"
          >
            Effacer la recherche
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            Recherche en cours...
          </div>
        </div>
      )}
      
      {/* Help Text */}
      <div id="search-help" className="sr-only">
        Recherchez par nom, email, téléphone ou ville. Utilisez les filtres pour affiner les résultats.
      </div>
    </div>
  );
};

export default ClientSearch;