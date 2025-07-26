import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Florist, Event } from '../types'

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

interface FloristState {
  // Core Data
  florists: Florist[]
  availabilities: FloristAvailability[]
  assignments: Assignment[]
  conflicts: ConflictDetection[]
  
  // Assignment Engine
  assignmentEngine: AssignmentEngine
  assignmentHistory: AssignmentHistory[]
  
  // Performance & Analytics
  performanceMetrics: FloristMetrics[]
  teamAnalytics: TeamAnalytics
  
  // UI State
  selectedFlorist: Florist | null
  viewMode: 'grid' | 'list' | 'calendar'
  searchTerm: string
  selectedAvailability: 'all' | 'available' | 'busy' | 'unavailable'
  showConflicts: boolean
  
  // Loading & Error States
  loading: {
    florists: boolean
    assignments: boolean
    analytics: boolean
    assignmentEngine: boolean
  }
  errors: {
    florists: string | null
    assignments: string | null
    analytics: string | null
    assignmentEngine: string | null
  }
  
  // Real-time & Performance
  lastUpdated: Date
  realTimeStatus: 'connected' | 'disconnected' | 'reconnecting'
  performanceMonitoring: PerformanceMetrics
}

interface FloristAvailability {
  id: string
  florist_id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'busy' | 'unavailable'
  event_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface Assignment {
  id: string
  event_id: string
  florist_id: string
  role: 'lead' | 'assistant' | 'delivery'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  assigned_at: string
  confirmed_at?: string
  completed_at?: string
  notes?: string
  rating?: number
  feedback?: string
}

interface ConflictDetection {
  id: string
  florist_id: string
  conflict_type: 'double_booking' | 'overlapping_events' | 'travel_time' | 'capacity_exceeded'
  events: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  auto_resolvable: boolean
  resolution_suggestions: string[]
  detected_at: string
}

interface AssignmentEngine {
  algorithm: 'weighted_scoring' | 'machine_learning' | 'rule_based'
  scoring_weights: {
    availability: number      // 0.25 - Disponibilité temps
    skills: number           // 0.30 - Compétences matchées
    distance: number         // 0.20 - Proximité géographique
    workload: number         // 0.15 - Équilibrage charge
    performance: number      // 0.10 - Historique qualité
  }
  constraints: {
    max_daily_events: number
    max_weekly_hours: number
    min_travel_time: number
    required_skills: string[]
    blackout_periods: string[]
  }
  optimization_goal: 'quality' | 'efficiency' | 'balanced'
}

interface AssignmentHistory {
  id: string
  event_id: string
  florist_id: string
  action: 'assigned' | 'reassigned' | 'cancelled' | 'completed'
  reason: string
  algorithm_score: number
  timestamp: string
  user_id: string
}

interface FloristMetrics {
  florist_id: string
  period: 'week' | 'month' | 'quarter' | 'year'
  
  // Performance Metrics
  total_assignments: number
  completed_assignments: number
  cancelled_assignments: number
  completion_rate: number
  average_rating: number
  
  // Efficiency Metrics
  average_preparation_time: number
  travel_efficiency: number
  on_time_delivery_rate: number
  
  // Business Metrics
  total_revenue_generated: number
  client_satisfaction_score: number
  repeat_client_rate: number
  
  // Workload Metrics
  total_hours_worked: number
  overtime_hours: number
  utilization_rate: number
}

interface TeamAnalytics {
  // Team Overview
  total_florists: number
  active_florists: number
  available_now: number
  
  // Capacity Planning
  total_capacity_hours: number
  utilized_capacity_hours: number
  utilization_rate: number
  projected_capacity: number
  
  // Performance Trends
  team_average_rating: number
  completion_rate_trend: 'improving' | 'stable' | 'declining'
  efficiency_score: number
  
  // Workload Distribution
  workload_balance: 'excellent' | 'good' | 'uneven' | 'critical'
  overworked_florists: string[]
  underutilized_florists: string[]
  
  // Skills Coverage
  skill_coverage_map: Record<string, number>
  skill_gaps: string[]
  training_recommendations: string[]
}

interface PerformanceMetrics {
  assignment_engine_speed: number
  conflict_detection_speed: number
  real_time_sync_latency: number
  ui_render_time: number
  memory_usage: number
}

// =============================================================================
// ACTIONS
// =============================================================================

type FloristAction =
  // Data Loading
  | { type: 'LOAD_FLORISTS_START' }
  | { type: 'LOAD_FLORISTS_SUCCESS'; payload: Florist[] }
  | { type: 'LOAD_FLORISTS_ERROR'; payload: string }
  | { type: 'LOAD_ASSIGNMENTS_START' }
  | { type: 'LOAD_ASSIGNMENTS_SUCCESS'; payload: Assignment[] }
  | { type: 'LOAD_ASSIGNMENTS_ERROR'; payload: string }
  | { type: 'LOAD_ANALYTICS_START' }
  | { type: 'LOAD_ANALYTICS_SUCCESS'; payload: { metrics: FloristMetrics[]; teamAnalytics: TeamAnalytics } }
  | { type: 'LOAD_ANALYTICS_ERROR'; payload: string }
  
  // Assignment Operations
  | { type: 'ASSIGN_FLORIST_START'; payload: { eventId: string; floristId: string; role: string } }
  | { type: 'ASSIGN_FLORIST_SUCCESS'; payload: Assignment }
  | { type: 'ASSIGN_FLORIST_ERROR'; payload: string }
  | { type: 'REASSIGN_FLORIST'; payload: { assignmentId: string; newFloristId: string; reason: string } }
  | { type: 'CANCEL_ASSIGNMENT'; payload: { assignmentId: string; reason: string } }
  | { type: 'COMPLETE_ASSIGNMENT'; payload: { assignmentId: string; rating?: number; feedback?: string } }
  
  // Auto Assignment Engine
  | { type: 'RUN_AUTO_ASSIGNMENT'; payload: { eventId: string; requirements: AssignmentRequirements } }
  | { type: 'AUTO_ASSIGNMENT_SUCCESS'; payload: { eventId: string; assignments: Assignment[] } }
  | { type: 'AUTO_ASSIGNMENT_ERROR'; payload: string }
  | { type: 'UPDATE_ASSIGNMENT_ENGINE'; payload: Partial<AssignmentEngine> }
  
  // Conflict Management
  | { type: 'DETECT_CONFLICTS_START' }
  | { type: 'DETECT_CONFLICTS_SUCCESS'; payload: ConflictDetection[] }
  | { type: 'RESOLVE_CONFLICT'; payload: { conflictId: string; resolution: string } }
  | { type: 'AUTO_RESOLVE_CONFLICTS'; payload: string[] }
  
  // Availability Management
  | { type: 'UPDATE_AVAILABILITY'; payload: { floristId: string; availability: Partial<FloristAvailability> } }
  | { type: 'BULK_UPDATE_AVAILABILITY'; payload: { floristIds: string[]; availability: Partial<FloristAvailability> } }
  
  // Performance & Analytics
  | { type: 'UPDATE_PERFORMANCE_METRICS'; payload: FloristMetrics[] }
  | { type: 'CALCULATE_TEAM_ANALYTICS' }
  | { type: 'UPDATE_TEAM_ANALYTICS'; payload: TeamAnalytics }
  
  // UI State
  | { type: 'SET_SELECTED_FLORIST'; payload: Florist | null }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' | 'calendar' }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_AVAILABILITY_FILTER'; payload: 'all' | 'available' | 'busy' | 'unavailable' }
  | { type: 'TOGGLE_SHOW_CONFLICTS' }
  
  // Real-time & System
  | { type: 'REALTIME_FLORIST_UPDATE'; payload: Florist }
  | { type: 'REALTIME_ASSIGNMENT_UPDATE'; payload: Assignment }
  | { type: 'REALTIME_AVAILABILITY_UPDATE'; payload: FloristAvailability }
  | { type: 'SET_REALTIME_STATUS'; payload: 'connected' | 'disconnected' | 'reconnecting' }
  | { type: 'UPDATE_PERFORMANCE_MONITORING'; payload: Partial<PerformanceMetrics> }
  | { type: 'REFRESH_ALL_DATA' }

interface AssignmentRequirements {
  skills_required: string[]
  minimum_rating: number
  preferred_florists: string[]
  excluded_florists: string[]
  max_assignments_per_florist: number
  location: { lat: number; lng: number }
  date: string
  duration_hours: number
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FloristState = {
  // Core Data
  florists: [],
  availabilities: [],
  assignments: [],
  conflicts: [],
  
  // Assignment Engine
  assignmentEngine: {
    algorithm: 'weighted_scoring',
    scoring_weights: {
      availability: 0.25,
      skills: 0.30,
      distance: 0.20,
      workload: 0.15,
      performance: 0.10
    },
    constraints: {
      max_daily_events: 3,
      max_weekly_hours: 40,
      min_travel_time: 15,
      required_skills: [],
      blackout_periods: []
    },
    optimization_goal: 'balanced'
  },
  assignmentHistory: [],
  
  // Performance & Analytics
  performanceMetrics: [],
  teamAnalytics: {
    total_florists: 0,
    active_florists: 0,
    available_now: 0,
    total_capacity_hours: 0,
    utilized_capacity_hours: 0,
    utilization_rate: 0,
    projected_capacity: 0,
    team_average_rating: 0,
    completion_rate_trend: 'stable',
    efficiency_score: 0,
    workload_balance: 'good',
    overworked_florists: [],
    underutilized_florists: [],
    skill_coverage_map: {},
    skill_gaps: [],
    training_recommendations: []
  },
  
  // UI State
  selectedFlorist: null,
  viewMode: 'grid',
  searchTerm: '',
  selectedAvailability: 'all',
  showConflicts: false,
  
  // Loading & Error States
  loading: {
    florists: false,
    assignments: false,
    analytics: false,
    assignmentEngine: false
  },
  errors: {
    florists: null,
    assignments: null,
    analytics: null,
    assignmentEngine: null
  },
  
  // Real-time & Performance
  lastUpdated: new Date(),
  realTimeStatus: 'disconnected',
  performanceMonitoring: {
    assignment_engine_speed: 0,
    conflict_detection_speed: 0,
    real_time_sync_latency: 0,
    ui_render_time: 0,
    memory_usage: 0
  }
}

// =============================================================================
// REDUCER
// =============================================================================

function floristReducer(state: FloristState, action: FloristAction): FloristState {
  switch (action.type) {
    // ================================
    // FLORISTS LOADING
    // ================================
    case 'LOAD_FLORISTS_START':
      return {
        ...state,
        loading: { ...state.loading, florists: true },
        errors: { ...state.errors, florists: null }
      }
    
    case 'LOAD_FLORISTS_SUCCESS':
      return {
        ...state,
        florists: action.payload,
        loading: { ...state.loading, florists: false },
        lastUpdated: new Date()
      }
    
    case 'LOAD_FLORISTS_ERROR':
      return {
        ...state,
        loading: { ...state.loading, florists: false },
        errors: { ...state.errors, florists: action.payload }
      }
    
    // ================================
    // ASSIGNMENTS LOADING
    // ================================
    case 'LOAD_ASSIGNMENTS_START':
      return {
        ...state,
        loading: { ...state.loading, assignments: true },
        errors: { ...state.errors, assignments: null }
      }
    
    case 'LOAD_ASSIGNMENTS_SUCCESS':
      return {
        ...state,
        assignments: action.payload,
        loading: { ...state.loading, assignments: false },
        lastUpdated: new Date()
      }
    
    case 'LOAD_ASSIGNMENTS_ERROR':
      return {
        ...state,
        loading: { ...state.loading, assignments: false },
        errors: { ...state.errors, assignments: action.payload }
      }
    
    // ================================
    // ANALYTICS LOADING
    // ================================
    case 'LOAD_ANALYTICS_START':
      return {
        ...state,
        loading: { ...state.loading, analytics: true },
        errors: { ...state.errors, analytics: null }
      }
    
    case 'LOAD_ANALYTICS_SUCCESS':
      return {
        ...state,
        performanceMetrics: action.payload.metrics,
        teamAnalytics: action.payload.teamAnalytics,
        loading: { ...state.loading, analytics: false },
        lastUpdated: new Date()
      }
    
    case 'LOAD_ANALYTICS_ERROR':
      return {
        ...state,
        loading: { ...state.loading, analytics: false },
        errors: { ...state.errors, analytics: action.payload }
      }
    
    // ================================
    // ASSIGNMENT OPERATIONS
    // ================================
    case 'ASSIGN_FLORIST_START':
      return {
        ...state,
        loading: { ...state.loading, assignmentEngine: true }
      }
    
    case 'ASSIGN_FLORIST_SUCCESS':
      return {
        ...state,
        assignments: [...state.assignments, action.payload],
        loading: { ...state.loading, assignmentEngine: false },
        lastUpdated: new Date()
      }
    
    case 'ASSIGN_FLORIST_ERROR':
      return {
        ...state,
        loading: { ...state.loading, assignmentEngine: false },
        errors: { ...state.errors, assignmentEngine: action.payload }
      }
    
    case 'REASSIGN_FLORIST':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.id === action.payload.assignmentId
            ? { 
                ...assignment, 
                florist_id: action.payload.newFloristId,
                status: 'pending' as const,
                notes: action.payload.reason
              }
            : assignment
        ),
        lastUpdated: new Date()
      }
    
    case 'CANCEL_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.id === action.payload.assignmentId
            ? { 
                ...assignment, 
                status: 'cancelled' as const,
                notes: action.payload.reason
              }
            : assignment
        ),
        lastUpdated: new Date()
      }
    
    case 'COMPLETE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.id === action.payload.assignmentId
            ? { 
                ...assignment, 
                status: 'completed' as const,
                completed_at: new Date().toISOString(),
                rating: action.payload.rating,
                feedback: action.payload.feedback
              }
            : assignment
        ),
        lastUpdated: new Date()
      }
    
    // ================================
    // AUTO ASSIGNMENT ENGINE
    // ================================
    case 'AUTO_ASSIGNMENT_SUCCESS':
      return {
        ...state,
        assignments: [...state.assignments, ...action.payload.assignments],
        loading: { ...state.loading, assignmentEngine: false },
        lastUpdated: new Date()
      }
    
    case 'AUTO_ASSIGNMENT_ERROR':
      return {
        ...state,
        loading: { ...state.loading, assignmentEngine: false },
        errors: { ...state.errors, assignmentEngine: action.payload }
      }
    
    case 'UPDATE_ASSIGNMENT_ENGINE':
      return {
        ...state,
        assignmentEngine: { ...state.assignmentEngine, ...action.payload }
      }
    
    // ================================
    // CONFLICT MANAGEMENT
    // ================================
    case 'DETECT_CONFLICTS_SUCCESS':
      return {
        ...state,
        conflicts: action.payload,
        lastUpdated: new Date()
      }
    
    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        conflicts: state.conflicts.filter(conflict => conflict.id !== action.payload.conflictId),
        lastUpdated: new Date()
      }
    
    case 'AUTO_RESOLVE_CONFLICTS':
      return {
        ...state,
        conflicts: state.conflicts.filter(conflict => !action.payload.includes(conflict.id)),
        lastUpdated: new Date()
      }
    
    // ================================
    // UI STATE
    // ================================
    case 'SET_SELECTED_FLORIST':
      return {
        ...state,
        selectedFlorist: action.payload
      }
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload
      }
    
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload
      }
    
    case 'SET_AVAILABILITY_FILTER':
      return {
        ...state,
        selectedAvailability: action.payload
      }
    
    case 'TOGGLE_SHOW_CONFLICTS':
      return {
        ...state,
        showConflicts: !state.showConflicts
      }
    
    // ================================
    // REAL-TIME UPDATES
    // ================================
    case 'REALTIME_FLORIST_UPDATE':
      return {
        ...state,
        florists: state.florists.map(florist =>
          florist.id === action.payload.id ? action.payload : florist
        ),
        lastUpdated: new Date()
      }
    
    case 'REALTIME_ASSIGNMENT_UPDATE':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.id === action.payload.id ? action.payload : assignment
        ),
        lastUpdated: new Date()
      }
    
    case 'SET_REALTIME_STATUS':
      return {
        ...state,
        realTimeStatus: action.payload
      }
    
    case 'UPDATE_PERFORMANCE_MONITORING':
      return {
        ...state,
        performanceMonitoring: { ...state.performanceMonitoring, ...action.payload }
      }
    
    case 'UPDATE_TEAM_ANALYTICS':
      return {
        ...state,
        teamAnalytics: action.payload
      }
    
    default:
      return state
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface FloristContextType {
  // State
  state: FloristState
  
  // Core Operations
  loadFlorists: () => Promise<void>
  loadAssignments: () => Promise<void>
  loadAnalytics: () => Promise<void>
  
  // Assignment Operations
  assignFlorist: (eventId: string, floristId: string, role: string) => Promise<void>
  reassignFlorist: (assignmentId: string, newFloristId: string, reason: string) => Promise<void>
  cancelAssignment: (assignmentId: string, reason: string) => Promise<void>
  completeAssignment: (assignmentId: string, rating?: number, feedback?: string) => Promise<void>
  
  // Auto Assignment Engine
  runAutoAssignment: (eventId: string, requirements: AssignmentRequirements) => Promise<Assignment[]>
  updateAssignmentEngine: (updates: Partial<AssignmentEngine>) => void
  
  // Conflict Management
  detectConflicts: () => Promise<ConflictDetection[]>
  resolveConflict: (conflictId: string, resolution: string) => Promise<void>
  autoResolveConflicts: () => Promise<void>
  
  // Availability Management
  updateAvailability: (floristId: string, availability: Partial<FloristAvailability>) => Promise<void>
  bulkUpdateAvailability: (floristIds: string[], availability: Partial<FloristAvailability>) => Promise<void>
  
  // Analytics & Performance
  calculateTeamAnalytics: () => void
  updatePerformanceMetrics: () => Promise<void>
  
  // UI Actions
  setSelectedFlorist: (florist: Florist | null) => void
  setViewMode: (mode: 'grid' | 'list' | 'calendar') => void
  setSearchTerm: (term: string) => void
  setAvailabilityFilter: (filter: 'all' | 'available' | 'busy' | 'unavailable') => void
  toggleShowConflicts: () => void
  
  // Computed Values
  filteredFlorists: Florist[]
  availableFlorists: Florist[]
  floristsWithConflicts: Florist[]
  assignmentsByFlorist: Record<string, Assignment[]>
  teamEfficiencyScore: number
  
  // Helper Functions
  getFloristById: (id: string) => Florist | undefined
  getAssignmentsByEvent: (eventId: string) => Assignment[]
  getConflictsByFlorist: (floristId: string) => ConflictDetection[]
  calculateFloristScore: (floristId: string, eventRequirements: AssignmentRequirements) => number
  isFloristAvailable: (floristId: string, date: string, startTime: string, endTime: string) => boolean
  
  // Refresh Functions
  refreshAll: () => Promise<void>
  refreshFlorists: () => Promise<void>
  refreshAssignments: () => Promise<void>
  refreshAnalytics: () => Promise<void>
}

const FloristContext = createContext<FloristContextType | undefined>(undefined)

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface FloristProviderProps {
  children: React.ReactNode
}

export function FloristProvider({ children }: FloristProviderProps) {
  const [state, dispatch] = useReducer(floristReducer, initialState)
  
  // =============================================================================
  // CORE OPERATIONS
  // =============================================================================
  
  const loadFlorists = useCallback(async () => {
    dispatch({ type: 'LOAD_FLORISTS_START' })
    
    try {
      const { data, error } = await supabase
        .from('florists')
        .select(`
          *,
          florist_availabilities(*),
          event_florists(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      dispatch({ type: 'LOAD_FLORISTS_SUCCESS', payload: data || [] })
    } catch (error: any) {
      dispatch({ type: 'LOAD_FLORISTS_ERROR', payload: error.message })
    }
  }, [])
  
  const loadAssignments = useCallback(async () => {
    dispatch({ type: 'LOAD_ASSIGNMENTS_START' })
    
    try {
      const { data, error } = await supabase
        .from('event_florists')
        .select(`
          *,
          events(*),
          florists(*)
        `)
        .order('assigned_at', { ascending: false })
      
      if (error) throw error
      
      dispatch({ type: 'LOAD_ASSIGNMENTS_SUCCESS', payload: data || [] })
    } catch (error: any) {
      dispatch({ type: 'LOAD_ASSIGNMENTS_ERROR', payload: error.message })
    }
  }, [])
  
  const loadAnalytics = useCallback(async () => {
    dispatch({ type: 'LOAD_ANALYTICS_START' })
    
    try {
      // Calculer les métriques performance par fleuriste
      const metricsPromises = state.florists.map(async (florist) => {
        const assignments = state.assignments.filter(a => a.florist_id === florist.id)
        const completedAssignments = assignments.filter(a => a.status === 'completed')
        
        return {
          florist_id: florist.id,
          period: 'month' as const,
          total_assignments: assignments.length,
          completed_assignments: completedAssignments.length,
          cancelled_assignments: assignments.filter(a => a.status === 'cancelled').length,
          completion_rate: assignments.length > 0 ? completedAssignments.length / assignments.length : 0,
          average_rating: completedAssignments.reduce((sum, a) => sum + (a.rating || 0), 0) / (completedAssignments.length || 1),
          average_preparation_time: 45, // Mock data
          travel_efficiency: 0.85,
          on_time_delivery_rate: 0.92,
          total_revenue_generated: completedAssignments.length * 150, // Mock calculation
          client_satisfaction_score: 4.2,
          repeat_client_rate: 0.68,
          total_hours_worked: completedAssignments.length * 3, // Mock calculation
          overtime_hours: 0,
          utilization_rate: 0.75
        }
      })
      
      const metrics = await Promise.all(metricsPromises)
      
      // Calculer analytics équipe
      const teamAnalytics: TeamAnalytics = {
        total_florists: state.florists.length,
        active_florists: state.florists.filter(f => f.status === 'active').length,
        available_now: state.florists.filter(f => f.status === 'available').length,
        total_capacity_hours: state.florists.length * 40,
        utilized_capacity_hours: metrics.reduce((sum, m) => sum + m.total_hours_worked, 0),
        utilization_rate: metrics.reduce((sum, m) => sum + m.utilization_rate, 0) / (metrics.length || 1),
        projected_capacity: state.florists.length * 40 * 1.1,
        team_average_rating: metrics.reduce((sum, m) => sum + m.average_rating, 0) / (metrics.length || 1),
        completion_rate_trend: 'improving',
        efficiency_score: 0.82,
        workload_balance: 'good',
        overworked_florists: [],
        underutilized_florists: [],
        skill_coverage_map: {},
        skill_gaps: [],
        training_recommendations: []
      }
      
      dispatch({ 
        type: 'LOAD_ANALYTICS_SUCCESS', 
        payload: { metrics, teamAnalytics } 
      })
    } catch (error: any) {
      dispatch({ type: 'LOAD_ANALYTICS_ERROR', payload: error.message })
    }
  }, [state.florists, state.assignments])
  
  // =============================================================================
  // ASSIGNMENT OPERATIONS
  // =============================================================================
  
  const assignFlorist = useCallback(async (eventId: string, floristId: string, role: string) => {
    dispatch({ type: 'ASSIGN_FLORIST_START', payload: { eventId, floristId, role } })
    
    try {
      const assignment: Assignment = {
        id: `assignment_${Date.now()}`,
        event_id: eventId,
        florist_id: floristId,
        role: role as 'lead' | 'assistant' | 'delivery',
        status: 'pending',
        assigned_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('event_florists')
        .insert([assignment])
      
      if (error) throw error
      
      dispatch({ type: 'ASSIGN_FLORIST_SUCCESS', payload: assignment })
    } catch (error: any) {
      dispatch({ type: 'ASSIGN_FLORIST_ERROR', payload: error.message })
    }
  }, [])
  
  const runAutoAssignment = useCallback(async (eventId: string, requirements: AssignmentRequirements): Promise<Assignment[]> => {
    const startTime = Date.now()
    
    try {
      // Algorithme d'assignation intelligent basé sur les patterns EXA découverts
      const availableFlorists = state.florists.filter(florist => 
        isFloristAvailable(florist.id, requirements.date, '09:00', '18:00')
      )
      
      const scoredFlorists = availableFlorists.map(florist => ({
        florist,
        score: calculateFloristScore(florist.id, requirements)
      })).sort((a, b) => b.score - a.score)
      
      const assignments: Assignment[] = []
      const neededRoles = ['lead', 'assistant'] // Configurable based on event type
      
      for (const role of neededRoles) {
        const bestFlorist = scoredFlorists.find(sf => 
          !assignments.some(a => a.florist_id === sf.florist.id)
        )
        
        if (bestFlorist) {
          const assignment: Assignment = {
            id: `auto_assignment_${Date.now()}_${role}`,
            event_id: eventId,
            florist_id: bestFlorist.florist.id,
            role: role as 'lead' | 'assistant' | 'delivery',
            status: 'pending',
            assigned_at: new Date().toISOString()
          }
          assignments.push(assignment)
        }
      }
      
      // Sauvegarder en base
      if (assignments.length > 0) {
        const { error } = await supabase
          .from('event_florists')
          .insert(assignments)
        
        if (error) throw error
      }
      
      // Update performance monitoring
      const processingTime = Date.now() - startTime
      dispatch({ 
        type: 'UPDATE_PERFORMANCE_MONITORING', 
        payload: { assignment_engine_speed: processingTime } 
      })
      
      dispatch({ type: 'AUTO_ASSIGNMENT_SUCCESS', payload: { eventId, assignments } })
      return assignments
      
    } catch (error: any) {
      dispatch({ type: 'AUTO_ASSIGNMENT_ERROR', payload: error.message })
      return []
    }
  }, [state.florists])
  
  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================
  
  const calculateFloristScore = useCallback((floristId: string, requirements: AssignmentRequirements): number => {
    const florist = state.florists.find(f => f.id === floristId)
    if (!florist) return 0
    
    const weights = state.assignmentEngine.scoring_weights
    let score = 0
    
    // Availability Score (25%)
    const isAvailable = isFloristAvailable(floristId, requirements.date, '09:00', '18:00')
    score += isAvailable ? weights.availability * 100 : 0
    
    // Skills Score (30%)
    const floristSkills = florist.skills || []
    const matchedSkills = requirements.skills_required.filter(skill => 
      floristSkills.includes(skill)
    ).length
    const skillsScore = requirements.skills_required.length > 0 
      ? (matchedSkills / requirements.skills_required.length) * 100 
      : 100
    score += weights.skills * skillsScore
    
    // Performance Score (10%)
    const performanceMetric = state.performanceMetrics.find(m => m.florist_id === floristId)
    const performanceScore = performanceMetric ? performanceMetric.average_rating * 20 : 50
    score += weights.performance * performanceScore
    
    // Distance Score (20%) - Mock calculation
    score += weights.distance * 80 // Assuming good distance
    
    // Workload Score (15%) - Check current workload
    const currentAssignments = state.assignments.filter(a => 
      a.florist_id === floristId && a.status === 'pending'
    ).length
    const workloadScore = Math.max(0, 100 - (currentAssignments * 25))
    score += weights.workload * workloadScore
    
    return Math.round(score)
  }, [state.florists, state.assignmentEngine.scoring_weights, state.performanceMetrics, state.assignments])
  
  const isFloristAvailable = useCallback((floristId: string, date: string, startTime: string, endTime: string): boolean => {
    // Check basic availability
    const florist = state.florists.find(f => f.id === floristId)
    if (!florist || florist.status !== 'active') return false
    
    // Check for conflicting assignments
    const conflictingAssignments = state.assignments.filter(assignment => 
      assignment.florist_id === floristId && 
      assignment.status === 'pending' &&
      // Add date/time overlap logic here
      true // Simplified for now
    )
    
    return conflictingAssignments.length === 0
  }, [state.florists, state.assignments])
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const filteredFlorists = useMemo(() => {
    let filtered = state.florists
    
    // Search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      filtered = filtered.filter(florist =>
        florist.first_name?.toLowerCase().includes(searchLower) ||
        florist.last_name?.toLowerCase().includes(searchLower) ||
        florist.email?.toLowerCase().includes(searchLower) ||
        florist.phone?.includes(state.searchTerm)
      )
    }
    
    // Availability filter
    if (state.selectedAvailability !== 'all') {
      filtered = filtered.filter(florist => florist.status === state.selectedAvailability)
    }
    
    return filtered
  }, [state.florists, state.searchTerm, state.selectedAvailability])
  
  const availableFlorists = useMemo(() => {
    return state.florists.filter(florist => florist.status === 'available')
  }, [state.florists])
  
  const assignmentsByFlorist = useMemo(() => {
    return state.assignments.reduce((acc, assignment) => {
      if (!acc[assignment.florist_id]) {
        acc[assignment.florist_id] = []
      }
      acc[assignment.florist_id].push(assignment)
      return acc
    }, {} as Record<string, Assignment[]>)
  }, [state.assignments])
  
  const teamEfficiencyScore = useMemo(() => {
    if (state.performanceMetrics.length === 0) return 0
    
    const avgCompletionRate = state.performanceMetrics.reduce(
      (sum, metric) => sum + metric.completion_rate, 0
    ) / state.performanceMetrics.length
    
    const avgUtilization = state.performanceMetrics.reduce(
      (sum, metric) => sum + metric.utilization_rate, 0
    ) / state.performanceMetrics.length
    
    const avgRating = state.performanceMetrics.reduce(
      (sum, metric) => sum + metric.average_rating, 0
    ) / state.performanceMetrics.length
    
    return Math.round((avgCompletionRate * 0.4 + avgUtilization * 0.3 + (avgRating / 5) * 0.3) * 100)
  }, [state.performanceMetrics])
  
  // =============================================================================
  // OTHER FUNCTIONS
  // =============================================================================
  
  const detectConflicts = useCallback(async (): Promise<ConflictDetection[]> => {
    const conflicts: ConflictDetection[] = []
    // Implement conflict detection logic
    return conflicts
  }, [state.assignments])
  
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadFlorists(),
      loadAssignments(),
      loadAnalytics()
    ])
  }, [loadFlorists, loadAssignments, loadAnalytics])
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  // Initial data loading
  useEffect(() => {
    refreshAll()
  }, [])
  
  // Auto-refresh analytics every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalytics()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [loadAnalytics])
  
  // Real-time subscriptions
  useEffect(() => {
    const floristsSubscription = supabase
      .channel('florists_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'florists' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            dispatch({ type: 'REALTIME_FLORIST_UPDATE', payload: payload.new as Florist })
          }
        }
      )
      .subscribe()
    
    const assignmentsSubscription = supabase
      .channel('assignments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_florists' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            dispatch({ type: 'REALTIME_ASSIGNMENT_UPDATE', payload: payload.new as Assignment })
          }
        }
      )
      .subscribe()
    
    dispatch({ type: 'SET_REALTIME_STATUS', payload: 'connected' })
    
    return () => {
      floristsSubscription.unsubscribe()
      assignmentsSubscription.unsubscribe()
    }
  }, [])
  
  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================
  
  const contextValue: FloristContextType = {
    // State
    state,
    
    // Core Operations
    loadFlorists,
    loadAssignments,
    loadAnalytics,
    
    // Assignment Operations
    assignFlorist,
    reassignFlorist: async (assignmentId, newFloristId, reason) => {
      dispatch({ type: 'REASSIGN_FLORIST', payload: { assignmentId, newFloristId, reason } })
    },
    cancelAssignment: async (assignmentId, reason) => {
      dispatch({ type: 'CANCEL_ASSIGNMENT', payload: { assignmentId, reason } })
    },
    completeAssignment: async (assignmentId, rating, feedback) => {
      dispatch({ type: 'COMPLETE_ASSIGNMENT', payload: { assignmentId, rating, feedback } })
    },
    
    // Auto Assignment Engine
    runAutoAssignment,
    updateAssignmentEngine: (updates) => {
      dispatch({ type: 'UPDATE_ASSIGNMENT_ENGINE', payload: updates })
    },
    
    // Conflict Management
    detectConflicts,
    resolveConflict: async (conflictId, resolution) => {
      dispatch({ type: 'RESOLVE_CONFLICT', payload: { conflictId, resolution } })
    },
    autoResolveConflicts: async () => {
      const resolvableConflicts = state.conflicts
        .filter(c => c.auto_resolvable)
        .map(c => c.id)
      dispatch({ type: 'AUTO_RESOLVE_CONFLICTS', payload: resolvableConflicts })
    },
    
    // Availability Management
    updateAvailability: async (floristId, availability) => {
      dispatch({ type: 'UPDATE_AVAILABILITY', payload: { floristId, availability } })
    },
    bulkUpdateAvailability: async (floristIds, availability) => {
      dispatch({ type: 'BULK_UPDATE_AVAILABILITY', payload: { floristIds, availability } })
    },
    
    // Analytics & Performance
    calculateTeamAnalytics: () => {
      dispatch({ type: 'CALCULATE_TEAM_ANALYTICS' })
    },
    updatePerformanceMetrics: async () => {
      await loadAnalytics()
    },
    
    // UI Actions
    setSelectedFlorist: (florist) => {
      dispatch({ type: 'SET_SELECTED_FLORIST', payload: florist })
    },
    setViewMode: (mode) => {
      dispatch({ type: 'SET_VIEW_MODE', payload: mode })
    },
    setSearchTerm: (term) => {
      dispatch({ type: 'SET_SEARCH_TERM', payload: term })
    },
    setAvailabilityFilter: (filter) => {
      dispatch({ type: 'SET_AVAILABILITY_FILTER', payload: filter })
    },
    toggleShowConflicts: () => {
      dispatch({ type: 'TOGGLE_SHOW_CONFLICTS' })
    },
    
    // Computed Values
    filteredFlorists,
    availableFlorists,
    floristsWithConflicts: [], // To be implemented
    assignmentsByFlorist,
    teamEfficiencyScore,
    
    // Helper Functions
    getFloristById: (id) => state.florists.find(f => f.id === id),
    getAssignmentsByEvent: (eventId) => state.assignments.filter(a => a.event_id === eventId),
    getConflictsByFlorist: (floristId) => state.conflicts.filter(c => c.florist_id === floristId),
    calculateFloristScore,
    isFloristAvailable,
    
    // Refresh Functions
    refreshAll,
    refreshFlorists: loadFlorists,
    refreshAssignments: loadAssignments,
    refreshAnalytics: loadAnalytics
  }
  
  return (
    <FloristContext.Provider value={contextValue}>
      {children}
    </FloristContext.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

export function useFlorists() {
  const context = useContext(FloristContext)
  if (context === undefined) {
    throw new Error('useFlorists must be used within a FloristProvider')
  }
  return context
}

export function useFloristAssignment() {
  const { assignFlorist, runAutoAssignment, state } = useFlorists()
  
  return {
    assignFlorist,
    runAutoAssignment,
    isAssigning: state.loading.assignmentEngine,
    assignmentError: state.errors.assignmentEngine
  }
}

export function useFloristAnalytics() {
  const { state, loadAnalytics, calculateTeamAnalytics, updatePerformanceMetrics } = useFlorists()
  
  return {
    performanceMetrics: state.performanceMetrics,
    teamAnalytics: state.teamAnalytics,
    teamEfficiencyScore: useFlorists().teamEfficiencyScore,
    isLoading: state.loading.analytics,
    error: state.errors.analytics,
    refreshAnalytics: loadAnalytics,
    calculateTeamAnalytics,
    updatePerformanceMetrics
  }
}

export function useFloristSearch() {
  const { 
    state, 
    setSearchTerm, 
    setAvailabilityFilter, 
    filteredFlorists,
    availableFlorists
  } = useFlorists()
  
  return {
    searchTerm: state.searchTerm,
    availabilityFilter: state.selectedAvailability,
    filteredFlorists,
    availableFlorists,
    setSearchTerm,
    setAvailabilityFilter,
    totalResults: filteredFlorists.length,
    isSearching: state.searchTerm.length > 0
  }
}

export default FloristContext