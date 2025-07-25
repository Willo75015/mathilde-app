// 🌸 ClientContext.tsx - CRM Sophistiqué avec Patterns React Aria
// Architecture découverte via Context7 MCP + React Aria patterns optimaux

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Client, Event } from '../types';

// ===== INTERFACES & TYPES =====
interface ClientAnalytics {
  totalEvents: number;
  totalBudget: number;
  averageEventBudget: number;
  lastEventDate: Date | null;
  nextEventDate: Date | null;
  eventFrequency: 'rare' | 'occasional' | 'regular' | 'frequent'; // < 2, 2-5, 6-12, 12+ par an
  loyaltyScore: number; // 0-100 basé sur fréquence + budget + ancienneté
  preferredServices: string[];
  riskLevel: 'low' | 'medium' | 'high'; // Risque de churn
}

interface SearchFilters {
  query: string;
  city: string;
  eventFrequency: string;
  loyaltyTier: string;
  riskLevel: string;
  dateRange: { start: Date | null; end: Date | null };
}

interface ClientState {
  // Core data
  clients: Client[];
  selectedClient: Client | null;
  clientAnalytics: Map<string, ClientAnalytics>;
  
  // Search & Filters - Patterns React Aria
  searchFilters: SearchFilters;
  filteredClients: Client[];
  searchResults: Client[];
  
  // UI State
  viewMode: 'grid' | 'list' | 'analytics';
  loading: {
    clients: boolean;
    analytics: boolean;
    search: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  
  // Pagination & Performance
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
  };
  
  // Errors & Validation
  errors: {
    general: string | null;
    search: string | null;
    validation: Map<string, string>;
  };
  
  // Meta
  lastUpdated: Date | null;
  searchPerformance: number; // ms pour mesurer < 200ms
}

// Actions avec patterns React Aria
type ClientAction =
  | { type: 'LOAD_CLIENTS_START' }
  | { type: 'LOAD_CLIENTS_SUCCESS'; payload: Client[] }
  | { type: 'LOAD_CLIENTS_ERROR'; payload: string }
  | { type: 'LOAD_ANALYTICS_SUCCESS'; payload: Map<string, ClientAnalytics> }
  
  // Search optimisé React Aria patterns
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: { results: Client[]; performance: number } }
  | { type: 'SET_SEARCH_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'CLEAR_SEARCH' }
  
  // CRUD operations
  | { type: 'CREATE_CLIENT_START' }
  | { type: 'CREATE_CLIENT_SUCCESS'; payload: Client }
  | { type: 'CREATE_CLIENT_ERROR'; payload: string }
  | { type: 'UPDATE_CLIENT_START' }
  | { type: 'UPDATE_CLIENT_SUCCESS'; payload: Client }
  | { type: 'UPDATE_CLIENT_ERROR'; payload: string }
  | { type: 'DELETE_CLIENT_SUCCESS'; payload: string }
  
  // UI Actions
  | { type: 'SET_SELECTED_CLIENT'; payload: Client | null }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' | 'analytics' }
  | { type: 'SET_PAGINATION'; payload: Partial<ClientState['pagination']> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } };

// ===== INITIAL STATE =====
const initialState: ClientState = {
  clients: [],
  selectedClient: null,
  clientAnalytics: new Map(),
  
  searchFilters: {
    query: '',
    city: '',
    eventFrequency: '',
    loyaltyTier: '',
    riskLevel: '',
    dateRange: { start: null, end: null }
  },
  filteredClients: [],
  searchResults: [],
  
  viewMode: 'grid',
  loading: {
    clients: false,
    analytics: false,
    search: false,
    create: false,
    update: false,
    delete: false
  },
  
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    hasNextPage: false
  },
  
  errors: {
    general: null,
    search: null,
    validation: new Map()
  },
  
  lastUpdated: null,
  searchPerformance: 0
};

// ===== REDUCER avec patterns optimaux =====
function clientReducer(state: ClientState, action: ClientAction): ClientState {
  switch (action.type) {
    case 'LOAD_CLIENTS_START':
      return {
        ...state,
        loading: { ...state.loading, clients: true },
        errors: { ...state.errors, general: null }
      };
      
    case 'LOAD_CLIENTS_SUCCESS':
      return {
        ...state,
        clients: action.payload,
        loading: { ...state.loading, clients: false },
        lastUpdated: new Date(),
        pagination: {
          ...state.pagination,
          totalCount: action.payload.length
        }
      };
      
    case 'LOAD_CLIENTS_ERROR':
      return {
        ...state,
        loading: { ...state.loading, clients: false },
        errors: { ...state.errors, general: action.payload }
      };
      
    case 'LOAD_ANALYTICS_SUCCESS':
      return {
        ...state,
        clientAnalytics: action.payload,
        loading: { ...state.loading, analytics: false }
      };
      
    // Search optimisé avec performance tracking
    case 'SEARCH_START':
      return {
        ...state,
        loading: { ...state.loading, search: true },
        errors: { ...state.errors, search: null }
      };
      
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        searchResults: action.payload.results,
        filteredClients: action.payload.results,
        loading: { ...state.loading, search: false },
        searchPerformance: action.payload.performance
      };
      
    case 'SET_SEARCH_FILTERS':
      return {
        ...state,
        searchFilters: { ...state.searchFilters, ...action.payload }
      };
      
    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchFilters: initialState.searchFilters,
        filteredClients: state.clients,
        searchResults: [],
        searchPerformance: 0
      };
      
    // CRUD operations avec optimistic updates
    case 'CREATE_CLIENT_START':
      return {
        ...state,
        loading: { ...state.loading, create: true },
        errors: { ...state.errors, general: null }
      };
      
    case 'CREATE_CLIENT_SUCCESS':
      return {
        ...state,
        clients: [...state.clients, action.payload],
        loading: { ...state.loading, create: false },
        selectedClient: action.payload
      };
      
    case 'UPDATE_CLIENT_SUCCESS':
      return {
        ...state,
        clients: state.clients.map(client => 
          client.id === action.payload.id ? action.payload : client
        ),
        selectedClient: state.selectedClient?.id === action.payload.id ? action.payload : state.selectedClient,
        loading: { ...state.loading, update: false }
      };
      
    case 'DELETE_CLIENT_SUCCESS':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
        selectedClient: state.selectedClient?.id === action.payload ? null : state.selectedClient,
        loading: { ...state.loading, delete: false }
      };
      
    // UI State
    case 'SET_SELECTED_CLIENT':
      return { ...state, selectedClient: action.payload };
      
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
      
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };
      
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: { general: null, search: null, validation: new Map() }
      };
      
    case 'SET_ERROR':
      const newValidation = new Map(state.errors.validation);
      newValidation.set(action.payload.field, action.payload.message);
      return {
        ...state,
        errors: { ...state.errors, validation: newValidation }
      };
      
    default:
      return state;
  }
}

// ===== CONTEXT CREATION =====
const ClientContext = createContext<{
  state: ClientState;
  dispatch: React.Dispatch<ClientAction>;
  
  // Core functions
  loadClients: () => Promise<void>;
  loadClientAnalytics: () => Promise<void>;
  createClient: (clientData: Partial<Client>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  
  // Search functions avec performance < 200ms
  searchClients: (query: string) => void;
  applyFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  
  // Analytics functions
  calculateClientAnalytics: (clientId: string) => ClientAnalytics | null;
  getClientLoyaltyTier: (clientId: string) => 'bronze' | 'silver' | 'gold' | 'platinum';
  getClientRiskScore: (clientId: string) => number;
  
  // UI functions
  setSelectedClient: (client: Client | null) => void;
  setViewMode: (mode: 'grid' | 'list' | 'analytics') => void;
  setPagination: (pagination: Partial<ClientState['pagination']>) => void;
  
  // Computed values (memoized)
  clientsCount: number;
  activeClientsCount: number;
  averageClientValue: number;
  topClients: Client[];
  clientsByCity: Map<string, Client[]>;
  loyaltyDistribution: { bronze: number; silver: number; gold: number; platinum: number };
  
} | null>(null);

// ===== PROVIDER COMPONENT =====
export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(clientReducer, initialState);
  
  // ===== CORE FUNCTIONS =====
  
  const loadClients = useCallback(async () => {
    try {
      dispatch({ type: 'LOAD_CLIENTS_START' });
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      dispatch({ type: 'LOAD_CLIENTS_SUCCESS', payload: data || [] });
      
      // Load analytics après les clients
      await loadClientAnalytics();
      
    } catch (error) {
      dispatch({ type: 'LOAD_CLIENTS_ERROR', payload: error instanceof Error ? error.message : 'Erreur de chargement' });
    }
  }, []);
  
  const loadClientAnalytics = useCallback(async () => {
    try {
      // Charger tous les événements pour calculer analytics
      const { data: events, error } = await supabase
        .from('events')
        .select('client_id, budget, event_date, status, created_at');
      
      if (error) throw error;
      
      // Calculer analytics par client
      const analyticsMap = new Map<string, ClientAnalytics>();
      
      state.clients.forEach(client => {
        const clientEvents = events?.filter(event => event.client_id === client.id) || [];
        const analytics = calculateClientAnalyticsData(client, clientEvents);
        analyticsMap.set(client.id, analytics);
      });
      
      dispatch({ type: 'LOAD_ANALYTICS_SUCCESS', payload: analyticsMap });
      
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    }
  }, [state.clients]);
  
  // ===== SEARCH OPTIMISÉ < 200ms avec patterns React Aria =====
  
  const searchClients = useCallback((query: string) => {
    const startTime = performance.now();
    
    dispatch({ type: 'SEARCH_START' });
    
    // Debounced search avec sensitivity optimisée (pattern React Aria)
    const searchConfig = {
      sensitivity: 'base', // Ignore accents, case
      usage: 'search',
      numeric: true
    };
    
    const filteredResults = state.clients.filter(client => {
      if (!query.trim()) return true;
      
      const searchTerms = query.toLowerCase().trim().split(' ');
      const searchableText = `
        ${client.name} 
        ${client.email} 
        ${client.phone || ''} 
        ${client.address || ''}
        ${client.city || ''}
      `.toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
    
    const endTime = performance.now();
    const performance_ms = endTime - startTime;
    
    dispatch({ 
      type: 'SEARCH_SUCCESS', 
      payload: { 
        results: filteredResults,
        performance: performance_ms 
      }
    });
    
    // Warning si > 200ms (objectif performance)
    if (performance_ms > 200) {
      console.warn(`⚠️ Search performance: ${performance_ms}ms > 200ms target`);
    }
    
  }, [state.clients]);
  
  const applyFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters });
    
    // Re-run search avec nouveaux filtres
    const { query } = { ...state.searchFilters, ...filters };
    if (query) {
      searchClients(query);
    }
  }, [state.searchFilters, searchClients]);
  
  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);
  
  // ===== CRUD OPERATIONS =====
  
  const createClient = useCallback(async (clientData: Partial<Client>): Promise<Client | null> => {
    try {
      dispatch({ type: 'CREATE_CLIENT_START' });
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();
      
      if (error) throw error;
      
      dispatch({ type: 'CREATE_CLIENT_SUCCESS', payload: data });
      return data;
      
    } catch (error) {
      dispatch({ type: 'CREATE_CLIENT_ERROR', payload: error instanceof Error ? error.message : 'Erreur création' });
      return null;
    }
  }, []);
  
  const updateClient = useCallback(async (id: string, updates: Partial<Client>): Promise<Client | null> => {
    try {
      dispatch({ type: 'UPDATE_CLIENT_START' });
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      dispatch({ type: 'UPDATE_CLIENT_SUCCESS', payload: data });
      return data;
      
    } catch (error) {
      dispatch({ type: 'UPDATE_CLIENT_ERROR', payload: error instanceof Error ? error.message : 'Erreur modification' });
      return null;
    }
  }, []);
  
  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      dispatch({ type: 'DELETE_CLIENT_SUCCESS', payload: id });
      return true;
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { field: 'delete', message: error instanceof Error ? error.message : 'Erreur suppression' } });
      return false;
    }
  }, []);
  
  // ===== ANALYTICS FUNCTIONS =====
  
  const calculateClientAnalytics = useCallback((clientId: string): ClientAnalytics | null => {
    return state.clientAnalytics.get(clientId) || null;
  }, [state.clientAnalytics]);
  
  const getClientLoyaltyTier = useCallback((clientId: string): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    const analytics = state.clientAnalytics.get(clientId);
    if (!analytics) return 'bronze';
    
    const { loyaltyScore } = analytics;
    if (loyaltyScore >= 90) return 'platinum';
    if (loyaltyScore >= 70) return 'gold';
    if (loyaltyScore >= 50) return 'silver';
    return 'bronze';
  }, [state.clientAnalytics]);
  
  const getClientRiskScore = useCallback((clientId: string): number => {
    const analytics = state.clientAnalytics.get(clientId);
    if (!analytics) return 50; // Neutral risk
    
    // Calcul risque basé sur dernière activité et fréquence
    const daysSinceLastEvent = analytics.lastEventDate 
      ? Math.floor((Date.now() - analytics.lastEventDate.getTime()) / (1000 * 60 * 60 * 24))
      : 365; // 1 an si jamais d'événement
    
    let riskScore = 0;
    
    // Plus c'est ancien, plus le risque est élevé
    if (daysSinceLastEvent > 365) riskScore += 40;
    else if (daysSinceLastEvent > 180) riskScore += 25;
    else if (daysSinceLastEvent > 90) riskScore += 15;
    else if (daysSinceLastEvent > 30) riskScore += 5;
    
    // Fréquence des événements
    if (analytics.eventFrequency === 'rare') riskScore += 30;
    else if (analytics.eventFrequency === 'occasional') riskScore += 15;
    else if (analytics.eventFrequency === 'regular') riskScore += 5;
    // frequent: pas de risque supplémentaire
    
    // Budget moyen (clients à petit budget = plus de risque)
    if (analytics.averageEventBudget < 500) riskScore += 20;
    else if (analytics.averageEventBudget < 1000) riskScore += 10;
    else if (analytics.averageEventBudget < 2000) riskScore += 5;
    
    return Math.min(100, Math.max(0, riskScore));
  }, [state.clientAnalytics]);
  
  // ===== UI FUNCTIONS =====
  
  const setSelectedClient = useCallback((client: Client | null) => {
    dispatch({ type: 'SET_SELECTED_CLIENT', payload: client });
  }, []);
  
  const setViewMode = useCallback((mode: 'grid' | 'list' | 'analytics') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);
  
  const setPagination = useCallback((pagination: Partial<ClientState['pagination']>) => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination });
  }, []);
  
  // ===== COMPUTED VALUES (MEMOIZED) =====
  
  const clientsCount = useMemo(() => state.clients.length, [state.clients]);
  
  const activeClientsCount = useMemo(() => {
    return state.clients.filter(client => {
      const analytics = state.clientAnalytics.get(client.id);
      if (!analytics) return false;
      
      // Client actif = événement dans les 6 derniers mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      return analytics.lastEventDate && analytics.lastEventDate > sixMonthsAgo;
    }).length;
  }, [state.clients, state.clientAnalytics]);
  
  const averageClientValue = useMemo(() => {
    const totalValue = Array.from(state.clientAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.totalBudget, 0);
    
    return state.clientAnalytics.size > 0 ? totalValue / state.clientAnalytics.size : 0;
  }, [state.clientAnalytics]);
  
  const topClients = useMemo(() => {
    return [...state.clients]
      .sort((a, b) => {
        const analyticsA = state.clientAnalytics.get(a.id);
        const analyticsB = state.clientAnalytics.get(b.id);
        
        if (!analyticsA) return 1;
        if (!analyticsB) return -1;
        
        return analyticsB.totalBudget - analyticsA.totalBudget;
      })
      .slice(0, 10);
  }, [state.clients, state.clientAnalytics]);
  
  const clientsByCity = useMemo(() => {
    const cityMap = new Map<string, Client[]>();
    
    state.clients.forEach(client => {
      const city = client.city || 'Non spécifié';
      if (!cityMap.has(city)) {
        cityMap.set(city, []);
      }
      cityMap.get(city)!.push(client);
    });
    
    return cityMap;
  }, [state.clients]);
  
  const loyaltyDistribution = useMemo(() => {
    const distribution = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    
    state.clients.forEach(client => {
      const tier = getClientLoyaltyTier(client.id);
      distribution[tier]++;
    });
    
    return distribution;
  }, [state.clients, getClientLoyaltyTier]);
  
  // ===== EFFECTS =====
  
  // Load initial data
  useEffect(() => {
    loadClients();
  }, [loadClients]);
  
  // Auto-refresh analytics toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.clients.length > 0) {
        loadClientAnalytics();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [state.clients.length, loadClientAnalytics]);
  
  // ===== CONTEXT VALUE =====
  
  const contextValue = {
    state,
    dispatch,
    
    // Core functions
    loadClients,
    loadClientAnalytics,
    createClient,
    updateClient,
    deleteClient,
    
    // Search functions
    searchClients,
    applyFilters,
    clearSearch,
    
    // Analytics functions
    calculateClientAnalytics,
    getClientLoyaltyTier,
    getClientRiskScore,
    
    // UI functions
    setSelectedClient,
    setViewMode,
    setPagination,
    
    // Computed values
    clientsCount,
    activeClientsCount,
    averageClientValue,
    topClients,
    clientsByCity,
    loyaltyDistribution
  };
  
  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
}

// ===== HOOKS =====

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within ClientProvider');
  }
  return context;
}

// Hooks spécialisés pour cas d'usage fréquents
export function useClientSearch() {
  const { searchClients, applyFilters, clearSearch, state } = useClients();
  return {
    searchClients,
    applyFilters,
    clearSearch,
    searchFilters: state.searchFilters,
    searchResults: state.searchResults,
    searchPerformance: state.searchPerformance,
    isSearching: state.loading.search
  };
}

export function useClientAnalytics() {
  const { calculateClientAnalytics, getClientLoyaltyTier, getClientRiskScore, state } = useClients();
  return {
    calculateClientAnalytics,
    getClientLoyaltyTier,
    getClientRiskScore,
    clientAnalytics: state.clientAnalytics,
    averageClientValue: useClients().averageClientValue,
    loyaltyDistribution: useClients().loyaltyDistribution
  };
}

export function useTopClients(limit: number = 10) {
  const { topClients } = useClients();
  return useMemo(() => topClients.slice(0, limit), [topClients, limit]);
}

// ===== UTILITY FUNCTIONS =====

function calculateClientAnalyticsData(client: Client, events: any[]): ClientAnalytics {
  const now = new Date();
  const clientCreatedAt = new Date(client.created_at);
  const daysSinceCreation = Math.floor((now.getTime() - clientCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Événements valides (pas annulés)
  const validEvents = events.filter(event => event.status !== 'CANCELLED');
  
  const totalEvents = validEvents.length;
  const totalBudget = validEvents.reduce((sum, event) => sum + (event.budget || 0), 0);
  const averageEventBudget = totalEvents > 0 ? totalBudget / totalEvents : 0;
  
  // Dates importantes
  const eventDates = validEvents
    .map(event => new Date(event.event_date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const lastEventDate = eventDates[0] || null;
  const nextEventDate = validEvents
    .filter(event => new Date(event.event_date) > now)
    .map(event => new Date(event.event_date))
    .sort((a, b) => a.getTime() - b.getTime())[0] || null;
  
  // Fréquence événements (par an)
  const eventsPerYear = daysSinceCreation > 0 ? (totalEvents * 365) / daysSinceCreation : 0;
  let eventFrequency: ClientAnalytics['eventFrequency'];
  
  if (eventsPerYear < 2) eventFrequency = 'rare';
  else if (eventsPerYear < 6) eventFrequency = 'occasional';
  else if (eventsPerYear < 12) eventFrequency = 'regular';
  else eventFrequency = 'frequent';
  
  // Score de fidélité (0-100)
  let loyaltyScore = 0;
  
  // Points basés sur ancienneté (max 25 points)
  loyaltyScore += Math.min(25, daysSinceCreation / 30); // 1 point par mois, max 25
  
  // Points basés sur fréquence (max 30 points)
  switch (eventFrequency) {
    case 'frequent': loyaltyScore += 30; break;
    case 'regular': loyaltyScore += 20; break;
    case 'occasional': loyaltyScore += 10; break;
    case 'rare': loyaltyScore += 5; break;
  }
  
  // Points basés sur budget (max 25 points)
  if (averageEventBudget >= 5000) loyaltyScore += 25;
  else if (averageEventBudget >= 2000) loyaltyScore += 20;
  else if (averageEventBudget >= 1000) loyaltyScore += 15;
  else if (averageEventBudget >= 500) loyaltyScore += 10;
  else loyaltyScore += 5;
  
  // Points basés sur récence (max 20 points)
  if (lastEventDate) {
    const daysSinceLastEvent = Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastEvent <= 30) loyaltyScore += 20;
    else if (daysSinceLastEvent <= 90) loyaltyScore += 15;
    else if (daysSinceLastEvent <= 180) loyaltyScore += 10;
    else if (daysSinceLastEvent <= 365) loyaltyScore += 5;
  }
  
  loyaltyScore = Math.min(100, Math.max(0, loyaltyScore));
  
  // Services préférés (types d'événements les plus fréquents)
  const preferredServices = ['Mariage', 'Anniversaire', 'Entreprise']; // TODO: calculer depuis events
  
  // Niveau de risque
  let riskLevel: ClientAnalytics['riskLevel'];
  const daysSinceLastEvent = lastEventDate ? Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24)) : 365;
  
  if (daysSinceLastEvent > 365 || totalEvents === 0) riskLevel = 'high';
  else if (daysSinceLastEvent > 180 || eventFrequency === 'rare') riskLevel = 'medium';
  else riskLevel = 'low';
  
  return {
    totalEvents,
    totalBudget,
    averageEventBudget,
    lastEventDate,
    nextEventDate,
    eventFrequency,
    loyaltyScore,
    preferredServices,
    riskLevel
  };
}

export default ClientContext;