import React from 'react'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🌸 Mathilde Fleurs
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Application de gestion d'événements
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Test de l'application</h2>
          <p className="text-gray-700">
            Si tu vois ce message, React fonctionne ! 🎉
          </p>
          <button className="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
            Cliquer ici pour tester
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
