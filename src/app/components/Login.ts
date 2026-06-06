import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { AppStore } from '../store/AppStore';
import { SkeletonComponent } from './ui/skeleton.component';

type AuthView = 'login' | 'forgot-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkeletonComponent],
  template: `
    <div class="login-container">
      <div class="glass-card">
        <!-- Logo / Cabeçalho -->
        <div class="header">
          <div class="logo-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>{{ currentView() === 'login' ? 'Gestão de Ativos' : 'Recuperar Senha' }}</h2>
          <p class="subtitle">
            {{ currentView() === 'login' ? 'Acesse sua conta para gerenciar os cartões' : 'Insira seu e-mail para receber as instruções' }}
          </p>
        </div>

        <!-- Feedback de Erro / Sucesso -->
        @if (errorMessage()) {
          <div class="alert alert-error animate-fade-in">
            <span class="alert-message">{{ errorMessage() }}</span>
            @if (showResendButton()) {
              <button (click)="resendConfirmation()" class="resend-btn" [disabled]="actionLoading()">
                {{ actionLoading() ? 'Enviando...' : 'Reenviar link de confirmação' }}
              </button>
            }
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
              <app-skeleton width="80px" height="14px" radius="4px" class="mb-2"></app-skeleton>
              <app-skeleton width="100%" height="45px" radius="8px"></app-skeleton>
            </div>
            
            @if (currentView() === 'login') {
              <div class="skeleton-field">
                <app-skeleton width="100px" height="14px" radius="4px" class="mb-2"></app-skeleton>
                <app-skeleton width="100%" height="45px" radius="8px"></app-skeleton>
              </div>
              
              <div class="skeleton-row">
                <app-skeleton width="130px" height="20px" radius="4px"></app-skeleton>
                <app-skeleton width="110px" height="16px" radius="4px"></app-skeleton>
              </div>
            }

            <app-skeleton width="100%" height="48px" radius="8px" class="mt-6"></app-skeleton>
            
            <div class="skeleton-footer">
              <app-skeleton width="150px" height="14px" radius="4px"></app-skeleton>
            </div>
          </div>
        } @else {
          <!-- FORMULÁRIO REAL -->
          <form (submit)="$event.preventDefault()" class="auth-form">
            <!-- E-mail -->
            <div class="form-group">
              <label for="email">E-mail</label>
              <div class="input-wrapper">
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="email" 
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </div>
            </div>

            <!-- Senha (Apenas Login) -->
            @if (currentView() === 'login') {
              <div class="form-group animate-fade-in">
                <label for="password">Senha</label>
                <div class="input-wrapper">
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    [(ngModel)]="password" 
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <!-- Sessão / Esqueci senha -->
              <div class="form-actions animate-fade-in">
                <label class="checkbox-container">
                  <input 
                    type="checkbox" 
                    name="keepConnected" 
                    [(ngModel)]="keepConnected" 
                    (change)="onKeepConnectedChange()"
                  />
                  <span class="checkmark"></span>
                  <span class="checkbox-label">Manter conectado</span>
                </label>
                
                <a (click)="switchView('forgot-password')" class="forgot-link">Esqueceu a senha?</a>
              </div>
              
              <!-- Feedback visual de persistência de sessão -->
              <div class="persistence-feedback animate-fade-in" [class.active]="keepConnected">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>
                  {{ keepConnected ? 'Sua sessão ficará salva neste navegador.' : 'Sua sessão expirará quando você fechar o navegador.' }}
                </span>
              </div>
            }

            <!-- Botões de Ação -->
            @if (currentView() === 'login') {
              <button 
                type="submit" 
                (click)="handleLogin()" 
                class="btn btn-primary mt-4" 
                [disabled]="actionLoading()"
              >
                {{ actionLoading() ? 'Entrando...' : 'Entrar' }}
              </button>
            } @else {
              <button 
                type="submit" 
                (click)="handleForgotPassword()" 
                class="btn btn-primary mt-4" 
                [disabled]="actionLoading()"
              >
                {{ actionLoading() ? 'Processando...' : 'Enviar Link de Recuperação' }}
              </button>

              <div class="form-footer mt-4">
                <a (click)="switchView('login')" class="back-link">Voltar para o Login</a>
              </div>
            }
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-container {
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

    .resend-btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      align-self: flex-start;
      transition: background 0.2s ease, transform 0.1s ease;
    }

    .resend-btn:hover {
      background: #b91c1c;
      transform: translateY(-1px);
    }

    .resend-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    input[type="email"],
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

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    /* Checkbox customizado */
    .checkbox-container {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 1.75rem;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      height: 16px;
      width: 16px;
      background-color: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 4px;
      transition: background-color 0.2s, border-color 0.2s;
    }

    .checkbox-container:hover input ~ .checkmark {
      border-color: #818cf8;
    }

    .checkbox-container input:checked ~ .checkmark {
      background-color: #6366f1;
      border-color: #6366f1;
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
    }

    .checkbox-container input:checked ~ .checkmark:after {
      display: block;
    }

    .checkbox-container .checkmark:after {
      left: 5px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-label {
      color: #94a3b8;
    }

    .forgot-link {
      color: #818cf8;
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: #a5b4fc;
      text-decoration: underline;
    }

    /* Feedback visual de persistência */
    .persistence-feedback {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.4);
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      margin-top: 0.5rem;
      transition: all 0.3s ease;
    }

    .persistence-feedback.active {
      color: #86efac;
      background: rgba(34, 197, 94, 0.05);
      border-color: rgba(34, 197, 94, 0.15);
    }

    .shield-icon {
      flex-shrink: 0;
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

    .skeleton-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.25rem;
    }

    .skeleton-footer {
      display: flex;
      justify-content: center;
      margin-top: 0.5rem;
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
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private appStore = inject(AppStore);
  private router = inject(Router);

  // Estados locais
  email = '';
  password = '';
  keepConnected = true;
  currentView = signal<AuthView>('login');
  
  // Estados de carregamento
  isLoading = signal<boolean>(false);     // Controla a exibição dos skeletons
  actionLoading = signal<boolean>(false); // Controla o estado desabilitado dos botões

  // Mensagens
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showResendButton = signal<boolean>(false);

  ngOnInit() {
    // Carrega a preferência de "manter conectado" do localStorage
    const savedPreference = localStorage.getItem('remember_me');
    if (savedPreference !== null) {
      this.keepConnected = savedPreference === 'true';
    }

    // Auto login check: se já estiver autenticado e configurado para lembrar, redireciona
    this.checkSession();
  }

  async checkSession() {
    this.isLoading.set(true);
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.appStore.setCurrentUser(user);
        
        // Se a preferência de lembrar estiver desativada e o usuário recém abriu o app, 
        // poderíamos fazer signOut. Mas a persistência é gerenciada pelo Supabase.
        // O checkbox serve para controle visual. Se o usuário estiver autenticado, redireciona.
        await this.router.navigate(['/']);
      }
    } catch (err) {
      console.warn('Sessão ativa não encontrada:', err);
    } finally {
      // Pequeno atraso para dar uma transição elegante com o skeleton
      setTimeout(() => {
        this.isLoading.set(false);
      }, 400);
    }
  }

  switchView(view: AuthView) {
    this.currentView.set(view);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showResendButton.set(false);
  }

  onKeepConnectedChange() {
    localStorage.setItem('remember_me', String(this.keepConnected));
  }

  async handleLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Por favor, preencha todos os campos.');
      return;
    }

    this.actionLoading.set(true);
    this.errorMessage.set(null);
    this.showResendButton.set(false);

    try {
      const data = await this.authService.signIn(this.email, this.password);
      
      if (data.user) {
        // Busca perfil completo
        this.isLoading.set(true);
        const userWithProfile = await this.authService.getCurrentUser();
        this.appStore.setCurrentUser(userWithProfile);
        
        this.successMessage.set('Login efetuado com sucesso! Redirecionando...');
        
        // Salva a preferência de persistência
        localStorage.setItem('remember_me', String(this.keepConnected));

        setTimeout(async () => {
          await this.router.navigate(['/']);
          this.isLoading.set(false);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Erro de Login:', err);
      
      const errMsg = err.message || '';
      if (errMsg.includes('Email not confirmed')) {
        this.errorMessage.set('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
        this.showResendButton.set(true);
      } else if (errMsg.includes('Invalid login credentials')) {
        this.errorMessage.set('E-mail ou senha incorretos.');
      } else {
        this.errorMessage.set(errMsg || 'Ocorreu um erro ao realizar o login.');
      }
    } finally {
      this.actionLoading.set(false);
    }
  }

  async handleForgotPassword() {
    if (!this.email) {
      this.errorMessage.set('Por favor, informe seu e-mail.');
      return;
    }

    this.actionLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.authService.resetPassword(this.email);
      this.successMessage.set(
        'E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.'
      );
    } catch (err: any) {
      console.error('Erro de recuperação de senha:', err);
      this.errorMessage.set(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async resendConfirmation() {
    if (!this.email) {
      this.errorMessage.set('Por favor, preencha o campo de e-mail.');
      return;
    }

    this.actionLoading.set(true);
    try {
      await this.authService.resendConfirmationEmail(this.email);
      this.successMessage.set('Link de confirmação reenviado! Verifique sua caixa de entrada.');
      this.showResendButton.set(false);
      this.errorMessage.set(null);
    } catch (err: any) {
      console.error('Erro ao reenviar e-mail de confirmação:', err);
      this.errorMessage.set(err.message || 'Erro ao reenviar e-mail de confirmação.');
    } finally {
      this.actionLoading.set(false);
    }
  }
}
