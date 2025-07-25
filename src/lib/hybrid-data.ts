// 🌐 HYBRID DATA MANAGER - Supabase + LocalStorage
// Utilise Supabase quand disponible, fallback sur localStorage

import { supabase } from './supabase'
import { StorageManager } from './storage'

export class HybridDataManager {
  private static instance: HybridDataManager
  private storageManager: StorageManager
  private isSupabaseAvailable = false
  
  static getInstance(): HybridDataManager {
    if (!HybridDataManager.instance) {
      HybridDataManager.instance = new HybridDataManager()
    }
    return HybridDataManager.instance
  }
  
  constructor() {
    this.storageManager = StorageManager.getInstance()
    this.checkSupabaseConnection()
  }
  
  // 🔍 Vérifier la disponibilité de Supabase
  private async checkSupabaseConnection(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('flowers')
        .select('id')
        .limit(1)
      
      this.isSupabaseAvailable = !error
      console.log(
        this.isSupabaseAvailable 
          ? '✅ Supabase connecté - Mode cloud' 
          : '📱 Mode local - Supabase indisponible'
      )
    } catch (err) {
      this.isSupabaseAvailable = false
      console.log('📱 Mode local - Supabase inaccessible')
    }
  }
  
  // 📥 CHARGEMENT HYBRIDE DES ÉVÉNEMENTS
  async loadEvents(): Promise<any[]> {
    // Toujours charger d'abord les données locales
    const localEvents = this.storageManager.loadEvents()
    
    if (!this.isSupabaseAvailable) {
      console.log('📱 Chargement local:', localEvents.length, 'événements')
      return localEvents
    }
    
    try {
      // Essayer de charger depuis Supabase
      const { data: supabaseEvents, error } = await supabase
        .from('events')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('date', { ascending: true })
      
      if (error) {
        console.warn('⚠️ Erreur Supabase, fallback local:', error.message)
        return localEvents
      }
      
      // Convertir le format Supabase vers le format app
      const convertedEvents = supabaseEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.date + 'T' + event.time),
        location: event.location,
        client: event.clients ? {
          id: event.clients.id,
          firstName: event.clients.first_name,
          lastName: event.clients.last_name,
          email: event.clients.email,
          phone: event.clients.phone
        } : undefined,
        clientId: event.client_id,
        budget: parseFloat(event.budget),
        status: event.status,
        flowers: event.flowers || [],
        notes: event.notes,
        images: event.images || [],
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
        paymentStatus: event.payment_status || 'pending',
        paymentAmount: parseFloat(event.payment_amount || '0')
      }))
      
      // Sauvegarder en local pour la prochaine fois
      this.storageManager.saveEvents(convertedEvents)
      
      console.log('☁️ Chargement Supabase:', convertedEvents.length, 'événements')
      return convertedEvents
      
    } catch (err) {
      console.warn('⚠️ Erreur connexion Supabase, fallback local:', err)
      return localEvents
    }
  }
  
  // 📥 CHARGEMENT HYBRIDE DES CLIENTS
  async loadClients(): Promise<any[]> {
    const localClients = this.storageManager.loadClients()
    
    if (!this.isSupabaseAvailable) {
      console.log('📱 Chargement local:', localClients.length, 'clients')
      return localClients
    }
    
    try {
      const { data: supabaseClients, error } = await supabase
        .from('clients')
        .select('*')
        .order('last_name', { ascending: true })
      
      if (error) {
        console.warn('⚠️ Erreur Supabase clients, fallback local:', error.message)
        return localClients
      }
      
      const convertedClients = supabaseClients.map(client => ({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        preferences: client.preferences,
        notes: client.notes,
        isActive: true, // Default active since no is_active column
        createdAt: new Date(client.created_at),
        updatedAt: new Date(client.updated_at)
      }))
      
      this.storageManager.saveClients(convertedClients)
      
      console.log('☁️ Chargement Supabase:', convertedClients.length, 'clients')
      return convertedClients
      
    } catch (err) {
      console.warn('⚠️ Erreur connexion Supabase clients, fallback local:', err)
      return localClients
    }
  }
  
  // 💾 SAUVEGARDE HYBRIDE EVENT
  async saveEvent(event: any): Promise<{ success: boolean; error?: string }> {
    // Toujours sauvegarder en local d'abord
    const localEvents = this.storageManager.loadEvents()
    const existingIndex = localEvents.findIndex(e => e.id === event.id)
    
    if (existingIndex >= 0) {
      localEvents[existingIndex] = { ...event, updatedAt: new Date() }
    } else {
      localEvents.push({ ...event, createdAt: new Date(), updatedAt: new Date() })
    }
    
    this.storageManager.saveEvents(localEvents)
    
    // Si Supabase disponible, synchroniser
    if (this.isSupabaseAvailable) {
      try {
        const supabaseEvent = {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date.toISOString().split('T')[0],
          time: event.date.toTimeString().split(' ')[0].substring(0, 5),
          location: event.location,
          client_id: event.clientId,
          budget: event.budget,
          status: event.status,
          flowers: event.flowers,
          notes: event.notes,
          images: event.images,
          payment_status: event.paymentStatus || 'pending',
          payment_amount: event.paymentAmount || 0
        }
        
        const { error } = await supabase
          .from('events')
          .upsert(supabaseEvent)
        
        if (error) {
          console.warn('⚠️ Erreur sync Supabase event:', error.message)
          return { success: true, error: 'Sauvé localement seulement' }
        }
        
        console.log('☁️ Event synchronisé avec Supabase')
        return { success: true }
        
      } catch (err) {
        console.warn('⚠️ Erreur sync event:', err)
        return { success: true, error: 'Sauvé localement seulement' }
      }
    }
    
    return { success: true }
  }
  
  // 💾 SAUVEGARDE HYBRIDE CLIENT
  async saveClient(client: any): Promise<{ success: boolean; error?: string }> {
    const localClients = this.storageManager.loadClients()
    const existingIndex = localClients.findIndex(c => c.id === client.id)
    
    if (existingIndex >= 0) {
      localClients[existingIndex] = { ...client, updatedAt: new Date() }
    } else {
      localClients.push({ ...client, createdAt: new Date(), updatedAt: new Date() })
    }
    
    this.storageManager.saveClients(localClients)
    
    if (this.isSupabaseAvailable) {
      try {
        const supabaseClient = {
          id: client.id,
          first_name: client.firstName,
          last_name: client.lastName,
          email: client.email,
          phone: client.phone,
          address: client.address,
          preferences: client.preferences,
          notes: client.notes
        }
        
        const { error } = await supabase
          .from('clients')
          .upsert(supabaseClient)
        
        if (error) {
          console.warn('⚠️ Erreur sync Supabase client:', error.message)
          return { success: true, error: 'Sauvé localement seulement' }
        }
        
        console.log('☁️ Client synchronisé avec Supabase')
        return { success: true }
        
      } catch (err) {
        console.warn('⚠️ Erreur sync client:', err)
        return { success: true, error: 'Sauvé localement seulement' }
      }
    }
    
    return { success: true }
  }
  
  // 📊 INFORMATIONS SYSTÈME
  getConnectionInfo() {
    return {
      supabaseAvailable: this.isSupabaseAvailable,
      mode: this.isSupabaseAvailable ? 'hybrid' : 'local',
      storage: this.storageManager.getStorageInfo()
    }
  }
  
  // 🔄 FORCER LA VÉRIFICATION SUPABASE
  async recheckSupabase(): Promise<boolean> {
    await this.checkSupabaseConnection()
    return this.isSupabaseAvailable
  }
}

// Instance globale
export const hybridData = HybridDataManager.getInstance()

