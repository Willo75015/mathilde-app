import React from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { TrendingUp, BarChart3 } from 'lucide-react'

// Mock data pour les graphiques
const monthlyData = [
  { month: 'Jan', events: 12, revenue: 4500 },
  { month: 'Fév', events: 19, revenue: 7200 },
  { month: 'Mar', events: 15, revenue: 5800 },
  { month: 'Avr', events: 22, revenue: 8500 },
  { month: 'Mai', events: 28, revenue: 10200 },
  { month: 'Jun', events: 25, revenue: 9500 }
]

const statusData = [
  { status: 'Confirmés', count: 45, color: '#3B82F6' },
  { status: 'En cours', count: 12, color: '#F59E0B' },
  { status: 'Terminés', count: 78, color: '#10B981' },
  { status: 'Annulés', count: 5, color: '#EF4444' }
]

const Charts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique des événements par mois */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Événements par mois</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month" 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--tw-color-white)',
                      border: '1px solid var(--tw-color-gray-200)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="events" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Total ce mois: <span className="font-medium text-gray-900 dark:text-white">25 événements</span>
              </span>
              <span className="text-green-600 font-medium">
                +15% vs mois dernier
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Graphique des statuts d'événements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Statuts des événements</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="status" 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-400"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--tw-color-white)',
                      border: '1px solid var(--tw-color-gray-200)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              {statusData.map(item => (
                <div key={item.status} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.status}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Charts