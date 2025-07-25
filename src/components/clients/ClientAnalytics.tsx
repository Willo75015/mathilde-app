// 🌸 ClientAnalytics.tsx - CRM Analytics Sophistiqué
// Dashboard analytique client avec métriques business

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Heart,
  AlertTriangle,
  Award,
  Activity,
  BarChart3
} from 'lucide-react';
import { useClients, useClientAnalytics } from '../../contexts/ClientContext';

interface ClientAnalyticsProps {
  className?: string;
}

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ className = '' }) => {
  const { 
    clientsCount, 
    activeClientsCount, 
    averageClientValue, 
    topClients, 
    clientsByCity, 
    loyaltyDistribution 
  } = useClients();
  
  const { clientAnalytics } = useClientAnalytics();
  
  // Métriques calculées
  const metrics = useMemo(() => {
    const totalRevenue = Array.from(clientAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.totalBudget, 0);
    
    const riskClients = Array.from(clientAnalytics.values())
      .filter(analytics => analytics.riskLevel === 'high').length;
    
    const vipClients = Array.from(clientAnalytics.values())
      .filter(analytics => analytics.loyaltyScore >= 70).length;
    
    const activeRate = clientsCount > 0 ? (activeClientsCount / clientsCount) * 100 : 0;
    
    return {
      totalRevenue,
      riskClients,
      vipClients,
      activeRate
    };
  }, [clientAnalytics, clientsCount, activeClientsCount]);
  
  // Top villes par nombre de clients
  const topCities = useMemo(() => {
    return Array.from(clientsByCity.entries())
      .map(([city, clients]) => ({ city, count: clients.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [clientsByCity]);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clientsCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeClientsCount} actifs ({metrics.activeRate.toFixed(1)}%)
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Chiffre d'affaires total */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CA Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalRevenue.toLocaleString('fr-FR')} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Moy: {averageClientValue.toLocaleString('fr-FR')} €/client
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        {/* Clients VIP */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients VIP</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.vipClients}</p>
              <p className="text-xs text-gray-500 mt-1">
                {clientsCount > 0 ? ((metrics.vipClients / clientsCount) * 100).toFixed(1) : 0}% du portefeuille
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        
        {/* Clients à risque */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">À Risque</p>
              <p className="text-2xl font-bold text-red-600">{metrics.riskClients}</p>
              <p className="text-xs text-gray-500 mt-1">
                Nécessitent attention
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Distribution fidélité */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-600" />
          Distribution Fidélité
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-2xl mb-1">🥉</div>
            <p className="text-sm font-medium text-gray-600">Bronze</p>
            <p className="text-xl font-bold text-amber-700">{loyaltyDistribution.bronze}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl mb-1">🥈</div>
            <p className="text-sm font-medium text-gray-600">Silver</p>
            <p className="text-xl font-bold text-gray-700">{loyaltyDistribution.silver}</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl mb-1">🥇</div>
            <p className="text-sm font-medium text-gray-600">Gold</p>
            <p className="text-xl font-bold text-yellow-700">{loyaltyDistribution.gold}</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl mb-1">💎</div>
            <p className="text-sm font-medium text-gray-600">Platinum</p>
            <p className="text-xl font-bold text-purple-700">{loyaltyDistribution.platinum}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top 5 Clients
          </h3>
          
          <div className="space-y-3">
            {topClients.slice(0, 5).map((client, index) => {
              const analytics = clientAnalytics.get(client.id);
              return (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-pink-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  
                  {analytics && (
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {analytics.totalBudget.toLocaleString('fr-FR')} €
                      </p>
                      <p className="text-sm text-gray-500">
                        {analytics.totalEvents} événement{analytics.totalEvents > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Répartition géographique */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Répartition par Ville
          </h3>
          
          <div className="space-y-3">
            {topCities.map((city, index) => {
              const percentage = clientsCount > 0 ? (city.count / clientsCount) * 100 : 0;
              return (
                <div key={city.city} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{city.city}</span>
                    <span className="text-sm text-gray-500">
                      {city.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Alertes et recommandations */}
      {metrics.riskClients > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Clients à Risque Détectés</h4>
              <p className="text-sm text-red-700 mt-1">
                {metrics.riskClients} client{metrics.riskClients > 1 ? 's' : ''} n'ont pas eu d'événement récent. 
                Recommandation : Campagne de réactivation.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Insights business */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Insights Business</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Taux d'activité : {metrics.activeRate.toFixed(1)}% des clients sont actifs</li>
              <li>• Valeur moyenne par client : {averageClientValue.toLocaleString('fr-FR')} €</li>
              <li>• {metrics.vipClients} clients VIP génèrent le plus de revenus</li>
              {topCities[0] && (
                <li>• {topCities[0].city} est votre marché principal ({topCities[0].count} clients)</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAnalytics;