import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../lib/supabase/types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }
}
