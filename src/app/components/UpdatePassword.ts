import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { AppStore } from '../store/AppStore';
import { SkeletonComponent } from './ui/skeleton.component';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkeletonComponent],
  template: `
    <div class="update-container">
      <div class="glass-card">
        <!-- Logo / Cabeçalho -->
        <div class="header">
          <div class="logo-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
          </div>
          <h2>Nova Senha</h2>
          <p class="subtitle">Defina sua nova credencial de acesso de forma segura.</p>
        </div>

        <!-- Feedback de Erro / Sucesso -->
        @if (errorMessage()) {
          <div class="alert alert-error animate-fade-in">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div class="alert alert-success animate-fade-in">
            {{ successMessage() }}
          </div>
        }

        <!-- ESTADO DE CARREGAMENTO (SKELETONS) -->
        @if (isLoading()) {
          <div class="skeleton-form">
            <div class="skeleton-field">
              <app-skeleton width="90px" height="14px" radius="4px" class="mb-2"></app-skeleton>
              <app-skeleton width="100%" height="45px" radius="8px"></app-skeleton>
            </div>
            
            <div class="skeleton-field">
              <app-skeleton width="130px" height="14px" radius="4px" class="mb-2"></app-skeleton>
              <app-skeleton width="100%" height="45px" radius="8px"></app-skeleton>
            </div>

            <app-skeleton width="100%" height="48px" radius="8px" class="mt-6"></app-skeleton>
          </div>
        } @else {
          <!-- FORMULÁRIO REAL -->
          <form (submit)="$event.preventDefault()" class="auth-form">
            <!-- Nova Senha -->
            <div class="form-group">
              <label for="password">Nova Senha</label>
              <div class="input-wrapper">
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  [(ngModel)]="password" 
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <!-- Confirmar Nova Senha -->
            <div class="form-group">
              <label for="confirmPassword">Confirmar Nova Senha</label>
              <div class="input-wrapper">
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  [(ngModel)]="confirmPassword" 
                  placeholder="Confirme sua nova senha"
                  required
                />
              </div>
            </div>

            <!-- Botão de Salvar -->
            <button 
              type="submit" 
              (click)="handleUpdatePassword()" 
              class="btn btn-primary mt-4" 
              [disabled]="actionLoading()"
            >
              {{ actionLoading() ? 'Salvando...' : 'Definir Nova Senha' }}
            </button>
            
            <div class="form-footer mt-4">
              <a (click)="goToLogin()" class="back-link">Cancelar e Voltar ao Login</a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .update-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
      font-family: 'Inter', sans-serif;
      padding: 1.5rem;
      box-sizing: border-box;
    }

    .glass-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px rgba(255, 255, 255, 0.08) solid;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      color: #f1f5f9;
      box-sizing: border-box;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem auto;
      box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
    }

    .lock-icon {
      width: 28px;
      height: 28px;
      color: #ffffff;
    }

    h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.025em;
      background: linear-gradient(to right, #f8fafc, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 0.9rem;
      margin: 0;
    }

    .alert {
      padding: 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .alert-success {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.25);
      color: #86efac;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
    }

    .input-wrapper {
      position: relative;
    }

    input[type="password"] {
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #f8fafc;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    input:focus {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
    }

    .btn {
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      box-sizing: border-box;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .back-link {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.875rem;
      cursor: pointer;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #f1f5f9;
      text-decoration: underline;
    }

    .form-footer {
      text-align: center;
    }

    /* Skeleton Styles */
    .skeleton-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .skeleton-field {
      display: flex;
      flex-direction: column;
    }

    .mb-2 {
      margin-bottom: 0.5rem;
    }

    .mt-4 {
      margin-top: 1rem;
    }

    .mt-6 {
      margin-top: 1.5rem;
    }

    /* Animações */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease forwards;
    }
  `]
})
export class UpdatePasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private appStore = inject(AppStore);
  private router = inject(Router);


  password = '';
  confirmPassword = '';


  isLoading = signal<boolean>(false);
  actionLoading = signal<boolean>(false);


  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.checkSession();
  }

  async checkSession() {
    this.isLoading.set(true);
    try {
      // Verifica se o usuário de fato tem uma sessão (o Supabase estabelece isso a partir do link de reset)
      const user = await this.authService.getCurrentUser();
      if (!user) {
        this.errorMessage.set('Sessão expirada ou link inválido. Por favor, solicite a recuperação de senha novamente.');
      }
    } catch (err) {
      console.error('Erro de validação de sessão para nova senha:', err);
      this.errorMessage.set('Erro ao validar sessão. Redirecionando...');
      setTimeout(() => this.goToLogin(), 3000);
    } finally {
      setTimeout(() => this.isLoading.set(false), 300);
    }
  }

  async handleUpdatePassword() {
    if (!this.password || !this.confirmPassword) {
      this.errorMessage.set('Por favor, preencha ambos os campos de senha.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('As senhas não coincidem.');
      return;
    }

    this.actionLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.authService.updatePassword(this.password);
      this.successMessage.set('Senha atualizada com sucesso! Redirecionando para o login...');


      this.appStore.setCurrentUser(null);
      this.appStore.setInventory([]);

      setTimeout(async () => {
        await this.router.navigate(['/login']);
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      this.errorMessage.set(err.message || 'Erro ao definir nova senha. Tente novamente.');
    } finally {
      this.actionLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
