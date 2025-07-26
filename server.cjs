const express = require('express');
const path = require('path');
const { createServer } = require('http');

const app = express();
const PORT = process.env.PORT || 3009;

console.log('🌸 Démarrage du serveur Mathilde Fleurs...');

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Headers pour PWA
app.use((req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'dist')));

// API mock pour développement
app.get('/api/events', (req, res) => {
  res.json([
    {
      id: '1',
      title: 'Mariage Sophie & Pierre',
      date: '2024-08-15T14:00:00Z',
      location: 'Château de Versailles',
      status: 'confirmed',
      budget: 2500
    },
    {
      id: '2',
      title: 'Anniversaire Marie',
      date: '2024-07-20T18:00:00Z', 
      location: 'Restaurant Le Jardin',
      status: 'draft',
      budget: 800
    }
  ]);
});

app.get('/api/clients', (req, res) => {
  res.json([
    {
      id: '1',
      firstName: 'Sophie',
      lastName: 'Martin',
      email: 'sophie@email.com',
      phone: '0123456789'
    }
  ]);
});

// Fallback pour SPA - toutes les routes vers index.html
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Démarrage serveur
const server = createServer(app);

server.listen(PORT, () => {
  console.log('🚀 Serveur démarré !');
  console.log(`📱 PWA accessible sur: http://localhost:${PORT}`);
  console.log('⚡ Prêt pour le développement !');
});
