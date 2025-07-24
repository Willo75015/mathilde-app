import React from 'react'
import { motion } from 'framer-motion'
import { Users, Flower, DollarSign, 
  TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react'
import Card, { CardContent } from '@/components/ui/Card'
import { useEvents, useClients } from '@/contexts/AppContext'

const StatsCards = () => {
  const { getEventStats } = useEvents()
  const { clients } = useClients()
  
  const { total: totalEvents, completed, upcoming } = getEventStats()
  
  const stats = [
    {
      title: 'Événements totaux',
      value: totalEvents,
      icon: Clock,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Clients actifs',
      value: clients.length,
      icon: Users,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Événements terminés',
      value: completed,
      icon: Flower,
      color: 'bg-purple-500',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Événements à venir',
      value: upcoming,
      icon: DollarSign,
      color: 'bg-orange-500',
      trend: '-2%',
      trendUp: false
    }
  ]
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card variant="elevated" className="hover:shadow-xl transition-shadow h-full">
            <CardContent className="p-1.5 sm:p-2 lg:p-3">
              {/* Layout adaptatif selon la taille d'écran */}
              <div className="flex flex-col space-y-1 sm:space-y-2">
                {/* Header avec icône et titre */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-600 dark:text-gray-400 leading-tight truncate">
                      {stat.title}
                    </p>
                  </div>
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ${stat.color} rounded flex items-center justify-center ml-1 flex-shrink-0`}>
                    <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                </div>
                
                {/* Valeur principale */}
                <div>
                  <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                
                {/* Tendance */}
                <div className="flex items-center space-x-1">
                  <div className={`flex items-center space-x-0.5 text-xs ${
                    stat.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trendUp ? (
                      <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    <span className="font-medium text-xs">{stat.trend}</span>
                  </div>
                  <span className="text-xs text-gray-500">ce mois</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default StatsCards