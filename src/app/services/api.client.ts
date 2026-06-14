export function uuidToId(uuid: string | null | undefined): number {
  if (!uuid) return 0;
  if (!isNaN(uuid as any)) return parseInt(uuid, 10);
  const parts = uuid.split('-');
  const lastPart = parts[parts.length - 1];
  return parseInt(lastPart, 16) || 0;
}

export function idToUuid(id: number | null | undefined): string {
  if (id === null || id === undefined) return '00000000-0000-0000-0000-000000000000';
  const hex = id.toString(16).padStart(12, '0');
  return `00000000-0000-0000-0000-${hex}`;
}

export class ApiClient {
  private static readonly baseUrl = 'http://localhost:8081';

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      console.log(`[ApiClient] Enviando requisição para: ${mergedOptions.method || 'GET'} ${url}`);
      const response = await fetch(url, mergedOptions);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        
        console.error(`[ApiClient] O servidor retornou um erro: ${errorMessage}`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
        });

        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      // Captura falhas de rede (ex: servidor desligado, porta errada) ou bloqueio de CORS
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error(`[ApiClient] Falha na requisição de rede (Failed to fetch).`, {
          url: url,
          method: mergedOptions.method || 'GET',
          possivelCausa: 'Isso normalmente ocorre quando o servidor está desligado, a porta está incorreta, ou a requisição foi bloqueada por CORS.',
          solucoes: [
            'Verifique se o backend Spring Boot está rodando no terminal (porta 8081).',
            'Confirme se as configurações de CORS do backend estão permitindo a origem desta aplicação frontend.'
          ]
        });
      } else {
        console.error(`[ApiClient] Erro inesperado ao realizar requisição para ${url}:`, error);
      }
      throw error;
    }
  }

  static get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  static post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static put<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
