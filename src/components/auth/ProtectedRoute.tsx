import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: string
  fallback?: ReactNode
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole: requiredRole,
  fallback,
  redirectTo = '/auth/signin'
}) => {
  const { user, loading, initialized } = useAuth()
  const location = useLocation()
  
  // Attendre que l'auth soit initialisée
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // Vérifier l'authentification
  if (!requireAuth(user)) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }
  
  // Vérifier le rôle si spécifié
  if (requiredRole && !requireRole(user, requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// Hook pour rediriger les utilisateurs authentifiés
export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
  const { user, initialized } = useAuth()
  const location = useLocation()
  
  useEffect(() => {
    if (initialized && user) {
      const from = (location.state as any)?.from?.pathname || redirectTo
      window.location.replace(from)
    }
  }, [user, initialized, redirectTo, location])
  
  return { isAuthenticated: !!user, initialized }
}

// Composant pour les routes publiques (redirect si authentifié)
export const PublicRoute: React.FC<{ children: ReactNode, redirectTo?: string }> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { user, loading, initialized } = useAuth()
  
  // Attendre que l'auth soit initialisée
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // Rediriger si authentifié
  if (user) {
    return <Navigate to={redirectTo} replace />
  }
  
  return <>{children}</>
}

// HOC pour les composants qui nécessitent une authentification
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requireRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
