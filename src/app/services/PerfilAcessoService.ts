import { Injectable } from '@angular/core';
import { BaseService } from './BaseService';
import { Database } from '../../lib/supabase/types';

type PerfilAcessoRow = Database['public']['Tables']['perfil_acesso']['Row'];

@Injectable({
  providedIn: 'root',
})
export class PerfilAcessoService extends BaseService<PerfilAcessoRow> {
  protected override tableName = 'perfil_acesso' as const;
}
