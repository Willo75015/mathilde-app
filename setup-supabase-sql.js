import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://rbrvadxfeausahjzyyJh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicnZhZHhmZWF1c2Foanp5eWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDgzNjcsImV4cCI6MjA2ODkyNDM2N30.41Pu0jDwJGVrHpch3xWTKTZMkzedcnlx_cVhls8tn4Y'

const supabase = createClient(supabaseUrl, supabaseKey)

const setupDatabase = async () => {
  console.log('🚀 Configuration de la base de données Supabase...')
  
  try {
    // Test de connexion simple
    console.log('✅ Test de connexion...')
    const { data, error } = await supabase.from('flowers').select('count').limit(1)
    if (error && !error.message.includes('does not exist')) {
      throw error
    }
    console.log('✅ Connexion Supabase réussie!')
    
    console.log('📝 Pour créer les tables, va dans SQL Editor et colle ce SQL:')
    console.log('='.repeat(80))
    
    const fullSQL = `-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE event_status AS ENUM ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed');
CREATE TYPE user_role AS ENUM ('admin', 'florist', 'client');
CREATE TYPE flower_category AS ENUM ('roses', 'tulips', 'carnations', 'lilies', 'orchids', 'seasonal', 'exotic');

-- Table clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address JSONB NOT NULL,
  preferences JSONB,
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Table flowers
CREATE TABLE flowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(255) NOT NULL,
  category flower_category NOT NULL,
  color VARCHAR(50) NOT NULL,
  seasonality TEXT[] DEFAULT ARRAY[]::TEXT[],
  price_per_unit DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER DEFAULT 1000
);

-- Table events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(500) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  budget DECIMAL(10,2) NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  flowers JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  images TEXT[],
  reminder_sent BOOLEAN DEFAULT false,
  payment_status payment_status DEFAULT 'pending',
  payment_amount DECIMAL(10,2) DEFAULT 0
);

-- Table users (pour auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'florist',
  preferences JSONB DEFAULT '{}'::JSONB
);

-- Indexes pour performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_active ON clients(is_active);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_flowers_updated_at BEFORE UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies basiques
CREATE POLICY "Les fleurs sont visibles par tous" ON flowers
  FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent tout faire" ON clients
  FOR ALL USING (auth.uid() IS NOT NULL);
  
CREATE POLICY "Les utilisateurs authentifiés peuvent tout faire" ON events
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Données de test
INSERT INTO flowers (name, category, color, seasonality, price_per_unit, stock, description) VALUES
  ('Rose Rouge Passion', 'roses', 'Rouge', ARRAY['spring', 'summer', 'autumn', 'winter'], 3.50, 100, 'Rose rouge classique, symbole d''amour'),
  ('Tulipe Jaune Soleil', 'tulips', 'Jaune', ARRAY['spring'], 2.50, 50, 'Tulipe jaune éclatante'),
  ('Orchidée Phalaenopsis', 'orchids', 'Blanc', ARRAY['winter'], 25.00, 20, 'Orchidée élégante et raffinée'),
  ('Lys Royal', 'lilies', 'Blanc', ARRAY['summer'], 4.50, 30, 'Lys majestueux au parfum envoûtant');`
    
    console.log(fullSQL)
    console.log('='.repeat(80))
    console.log('✅ Configuration terminée!')
    console.log('📋 Maintenant:')
    console.log('1. Va dans SQL Editor sur Supabase')
    console.log('2. Clique sur "New query"')
    console.log('3. Colle le SQL ci-dessus')
    console.log('4. Clique sur "Run"')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

setupDatabase()
