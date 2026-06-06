import { Injectable } from '@angular/core';
import { BaseService } from './BaseService';
import { Database } from '../interfaces/database.types';

type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];

@Injectable({
  providedIn: 'root',
})
export class UsuarioService extends BaseService<UsuarioRow> {
  protected override tableName = 'usuarios' as const;


  async getAllWithPerfil(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('id, nome, perfil_acesso_id, created_at, perfil_acesso(id, nome)');
    if (error) throw error;
    return data;
  }
}
