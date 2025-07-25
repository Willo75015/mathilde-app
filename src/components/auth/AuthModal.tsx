import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Loader2, MailCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const AuthModal = () => {
  const { signIn, signUp, loading, resendConfirmationEmail } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  const [lastResendTime, setLastResendTime] = useState(0)
  const [countdown, setCountdown] = useState(0)

  // Countdown pour le bouton resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setShowEmailConfirmation(false)

    // Protection contre le spam (2 secondes minimum entre tentatives)
    const now = Date.now()
    if (now - lastSubmitTime < 2000) {
      setError('Veuillez attendre 2 secondes entre chaque tentative.')
      return
    }
    setLastSubmitTime(now)

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer un email valide')
      return
    }

    // Validation mot de passe pour l'inscription
    if (!isLogin) {
      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        setError(passwordError)
        return
      }
    }

    try {
      const result = isLogin 
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password)

      console.log('Auth result:', result, { isLogin, email: formData.email }) // Debug

      if (result.error) {
        // Gestion spécifique de l'erreur email non confirmé
        if (result.error.includes('Email not confirmed') || result.error.includes('email_not_confirmed')) {
          setShowEmailConfirmation(true)
          setConfirmationEmail(formData.email)
          setError('Votre email n\'est pas encore confirmé. Veuillez vérifier votre boîte de réception.')
        } else {
          setError(result.error)
        }
      } else if (!isLogin) {
        // Inscription réussie - afficher message de confirmation
        console.log('Signup successful, showing confirmation') // Debug
        setSuccessMessage('✅ Inscription réussie ! Un email de confirmation a été envoyé à votre adresse.')
        setShowEmailConfirmation(true)
        setConfirmationEmail(formData.email)
        setError('') // Clear any existing errors
        
        // Force l'affichage même si l'utilisateur est auto-connecté
        setTimeout(() => {
          setSuccessMessage('📧 Vérifiez votre boîte email pour confirmer votre compte.')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Auth error:', err) // Debug
      setError(err.message || 'Une erreur est survenue')
    }
  }

  const handleResendConfirmation = async () => {
    setError('')
    setSuccessMessage('')
    
    // Protection contre le spam pour resend aussi (5 secondes)
    const now = Date.now()
    if (now - lastResendTime < 5000) {
      setError('Veuillez attendre 5 secondes avant de renvoyer un nouvel email.')
      return
    }
    setLastResendTime(now)
    setCountdown(5) // Démarrer le countdown
    
    try {
      const { error } = await resendConfirmationEmail(confirmationEmail)
      
      if (error) {
        setError(error)
      } else {
        setSuccessMessage('Email de confirmation renvoyé ! Vérifiez votre boîte de réception.')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du renvoi de l\'email')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mathilde Fleurs</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Email Confirmation Section */}
        {showEmailConfirmation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6"
          >
            <div className="flex items-center mb-3">
              <MailCheck className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Confirmation email requise</h3>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Un email de confirmation a été envoyé à <strong>{confirmationEmail}</strong>
            </p>
            <button
              onClick={handleResendConfirmation}
              disabled={loading || countdown > 0}
              className="text-sm bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Envoi...
                </span>
              ) : countdown > 0 ? (
                `Attendre ${countdown}s`
              ) : (
                'Renvoyer l\'email'
              )}
            </button>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="votre@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isLogin && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  ✓ Minimum 6 caractères
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              'Se connecter'
            ) : (
              'Créer un compte'
            )}
          </motion.button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccessMessage('')
              setShowEmailConfirmation(false)
              setFormData({ email: '', password: '' })
            }}
            className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            disabled={loading}
          >
            {isLogin ? (
              <>Pas encore de compte ? <span className="font-medium">Créer un compte</span></>
            ) : (
              <>Déjà un compte ? <span className="font-medium">Se connecter</span></>
            )}
          </button>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            💡 <strong>Mode démo :</strong> Créez un compte ou connectez-vous pour accéder à l'application
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthModal