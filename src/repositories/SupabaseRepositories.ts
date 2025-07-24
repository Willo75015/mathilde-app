import { supabase, handleSupabaseError, Tables, Inserts, Updates } from '@/lib/supabase'
import { Repository } from '@/patterns/Repository'
import { Event, Client, Flower, EventStatus } from '@/types'

// Repository pour les événements avec Supabase
export class SupabaseEventRepository implements Repository<Event> {
  async findAll(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
      
      if (error) throw error
      
      return (data || []).map(this.mapToEvent)
    } catch (error) {
      console.error('Erreur findAll events:', handleSupabaseError(error))
      return []
    }
  }
  
  async findById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      return data ? this.mapToEvent(data) : null
    } catch (error) {
      console.error('Erreur findById event:', handleSupabaseError(error))
      return null
    }
  }
  
  async create(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date.toISOString(),
          time: eventData.time,
          location: eventData.location,
          client_id: eventData.clientId,
          budget: eventData.budget,
          status: eventData.status,
          flowers: eventData.flowers,
          notes: eventData.notes,
          images: eventData.images,
          reminder_sent: false,
          payment_status: 'pending',
          payment_amount: 0
        })
        .select()
        .single()
      
      if (error) throw error
      
      return this.mapToEvent(data)
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
  
  async update(id: string, eventData: Partial<Event>): Promise<Event> {
    try {
      const updateData: any = {}
      
      if (eventData.title !== undefined) updateData.title = eventData.title
      if (eventData.description !== undefined) updateData.description = eventData.description
      if (eventData.date !== undefined) updateData.date = eventData.date.toISOString()
      if (eventData.time !== undefined) updateData.time = eventData.time
      if (eventData.location !== undefined) updateData.location = eventData.location
      if (eventData.clientId !== undefined) updateData.client_id = eventData.clientId
      if (eventData.budget !== undefined) updateData.budget = eventData.budget
      if (eventData.status !== undefined) updateData.status = eventData.status
      if (eventData.flowers !== undefined) updateData.flowers = eventData.flowers
      if (eventData.notes !== undefined) updateData.notes = eventData.notes
      if (eventData.images !== undefined) updateData.images = eventData.images
      
      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return this.mapToEvent(data)
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
  
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
  
  // Méthodes spécifiques aux événements
  async findByClient(clientId: string): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true })
      
      if (error) throw error
      
      return (data || []).map(this.mapToEvent)
    } catch (error) {
      console.error('Erreur findByClient:', handleSupabaseError(error))
      return []
    }
  }
  
  async findByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true })
      
      if (error) throw error
      
      return (data || []).map(this.mapToEvent)
    } catch (error) {
      console.error('Erreur findByDateRange:', handleSupabaseError(error))
      return []
    }
  }
  
  // Mapper les données Supabase vers le type Event
  private mapToEvent(data: Tables<'events'>): Event {
    return {
      id: data.id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      time: data.time,
      location: data.location,
      clientId: data.client_id,
      budget: data.budget,
      status: data.status as EventStatus,
      flowers: data.flowers || [],
      notes: data.notes,
      images: data.images
    }
  }
}

// Repository pour les clients avec Supabase
export class SupabaseClientRepository implements Repository<Client> {
  async findAll(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('last_name', { ascending: true })
      
      if (error) throw error
      
      return (data || []).map(this.mapToClient)
    } catch (error) {
      console.error('Erreur findAll clients:', handleSupabaseError(error))
      return []
    }
  }
  
  async findById(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      return data ? this.mapToClient(data) : null
    } catch (error) {
      console.error('Erreur findById client:', handleSupabaseError(error))
      return null
    }
  }
  
  async create(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          first_name: clientData.firstName,
          last_name: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          preferences: clientData.preferences,
          notes: clientData.notes,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      return this.mapToClient(data)
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
  
  async update(id: string, clientData: Partial<Client>): Promise<Client> {
    try {
      const updateData: any = {}
      
      if (clientData.firstName !== undefined) updateData.first_name = clientData.firstName
      if (clientData.lastName !== undefined) updateData.last_name = clientData.lastName
      if (clientData.email !== undefined) updateData.email = clientData.email
      if (clientData.phone !== undefined) updateData.phone = clientData.phone
      if (clientData.address !== undefined) updateData.address = clientData.address
      if (clientData.preferences !== undefined) updateData.preferences = clientData.preferences
      if (clientData.notes !== undefined) updateData.notes = clientData.notes
      
      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return this.mapToClient(data)
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
  
  async delete(id: string): Promise<void> {
    try {
      // Soft delete - on marque juste comme inactif
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
  
  async findByEmail(email: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()
      
      if (error) throw error
      
      return data ? this.mapToClient(data) : null
    } catch (error) {
      console.error('Erreur findByEmail:', handleSupabaseError(error))
      return null
    }
  }
  
  // Mapper les données Supabase vers le type Client
  private mapToClient(data: Tables<'clients'>): Client {
    return {
      id: data.id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      preferences: data.preferences,
      notes: data.notes
    }
  }
}

// Export singleton instances
export const eventRepository = new SupabaseEventRepository()
export const clientRepository = new SupabaseClientRepository()
