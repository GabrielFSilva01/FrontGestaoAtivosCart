import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Database } from '../../lib/supabase/types';

export abstract class BaseService<T> {
  protected supabase = (() => {
    try {
      return inject(SupabaseService);
    } catch {
      return new SupabaseService();
    }
  })();
  protected abstract tableName: keyof Database['public']['Tables'];

  /**
   * Busca todos os registros da tabela
   */
  async getAll(): Promise<T[]> {
    try {
      const { data, error } = await (this.supabase.client
        .from(this.tableName as any) as any)
        .select('*');
      if (error) {
        console.warn(`[BaseService] Erro ao carregar tabela '${String(this.tableName)}':`, error.message);
        return [];
      }
      return (data || []) as T[];
    } catch (err: any) {
      console.warn(`[BaseService] Falha de conexão/exceção na tabela '${String(this.tableName)}':`, err.message || err);
      return [];
    }
  }

  /**
   * Busca um registro por ID
   */
  async getById(id: string | number): Promise<T | null> {
    try {
      const { data, error } = await (this.supabase.client
        .from(this.tableName as any) as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.warn(`[BaseService] Erro ao buscar ID ${id} na tabela '${String(this.tableName)}':`, error.message);
        return null;
      }
      return data as T;
    } catch (err: any) {
      console.warn(`[BaseService] Exceção ao buscar ID ${id} na tabela '${String(this.tableName)}':`, err.message || err);
      return null;
    }
  }

  /**
   * Cria um novo registro
   */
  async create(item: Partial<T>): Promise<T> {
    const { data, error } = await (this.supabase.client
      .from(this.tableName as any) as any)

      .insert(item as any)
      .select('*')
      .single();
    if (error) throw error;
    return data as T;
  }

  /**
   * Atualiza um registro existente
   */
  async update(id: string | number, item: Partial<T>): Promise<T> {
    const { data, error } = await (this.supabase.client
      .from(this.tableName as any) as any)

      .update(item as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as T;
  }


  async delete(id: string | number): Promise<void> {
    const { error } = await (this.supabase.client
      .from(this.tableName as any) as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
