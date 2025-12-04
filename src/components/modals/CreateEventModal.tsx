import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import EventModal from '../events/EventModal'
import TemplateSelector from '../events/TemplateSelector'
import { EventTemplate, EventStatus } from '@/types'
import { useEventTemplates } from '@/hooks/useEventTemplates'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated?: (event: any) => void
}

type Step = 'template' | 'form'

/**
 * 🎯 MODAL UNIFIÉ DE CRÉATION AVEC TEMPLATES
 *
 * Ce composant propose 2 étapes :
 * 1. Sélection optionnelle d'un template
 * 2. EventModal complet pré-rempli avec les valeurs du template
 */
const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null)
  const { incrementUsage } = useEventTemplates()

  // Reset quand le modal se ferme
  const handleClose = useCallback(() => {
    setStep('template')
    setSelectedTemplate(null)
    onClose()
  }, [onClose])

  // Sélection d'un template
  const handleTemplateSelect = useCallback((template: EventTemplate) => {
    setSelectedTemplate(template)
    incrementUsage(template.id)
    setStep('form')
  }, [incrementUsage])

  // Skip template selection
  const handleSkipTemplate = useCallback(() => {
    setSelectedTemplate(null)
    setStep('form')
  }, [])

  // Retour à la sélection de template
  const handleBackToTemplates = useCallback(() => {
    setStep('template')
  }, [])

  // Création d'un événement pré-rempli depuis le template
  const getPrefilledEvent = useCallback(() => {
    if (!selectedTemplate) return null

    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '',  // Le titre reste vide pour que l'utilisateur le remplisse
      description: selectedTemplate.description,
      date: new Date(),
      time: '10:00',
      location: '',
      clientId: '',
      budget: selectedTemplate.defaultBudget,
      status: EventStatus.DRAFT,
      flowers: [],
      floristsRequired: selectedTemplate.defaultFloristsRequired,
      notes: selectedTemplate.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }, [selectedTemplate])

  const handleSave = useCallback((event: any) => {
    console.log('✅ Événement créé depuis CreateEventModal:', event.title)
    if (onEventCreated) {
      onEventCreated(event)
    }
    handleClose()
  }, [onEventCreated, handleClose])

  if (!isOpen) return null

  // Étape 1 : Sélection du template
  if (step === 'template') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nouvel événement
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <TemplateSelector
                onSelect={handleTemplateSelect}
                onSkip={handleSkipTemplate}
                selectedTemplateId={selectedTemplate?.id}
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Étape 2 : Formulaire EventModal avec données pré-remplies
  return (
    <EventModal
      event={getPrefilledEvent()}
      isOpen={true}
      onClose={handleClose}
      onEdit={handleSave}
    />
  )
}

export default CreateEventModal