import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface AuthCallbackHandler {
  handleAuthCallback: () => Promise<{ error: string | null }>
}

// Gestion du callback d'authentification (pour les magic links, OAuth, etc.)
export const handleAuthCallback = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erreur lors du callback d\'auth:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Erreur inattendue lors du callback:', error)
    return { error: error.message || 'Erreur lors de l\'authentification' }
  }
}

// Utilitaires pour la gestion des utilisateurs
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Vérification des permissions
export const checkUserRole = (user: User | null, requiredRole: string): boolean => {
  if (!user) return false
  
  // Récupérer le rôle depuis les métadonnées ou la table users
  const userRole = user.user_metadata?.role || user.app_metadata?.role
  
  // Hiérarchie des rôles
  const roleHierarchy = {
    'admin': 3,
    'florist': 2,
    'client': 1
  }
  
  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

// Middleware de protection des routes
export const requireAuth = (user: User | null): boolean => {
  return !!user
}

export const requireRole = (user: User | null, role: string): boolean => {
  return requireAuth(user) && checkUserRole(user, role)
}
