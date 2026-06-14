import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../store/AppStoreService';
import { SkeletonComponent } from './ui/skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent],
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-header animate-fade-in">
        <h2>Dashboard Geral e Governança</h2>
        <p class="subtitle">Gerencie o time, convide novos colaboradores e inspecione os logs de auditoria de segurança.</p>
      </div>

      <!-- ALERTAS DE ERRO -->
      @if (errorMessage()) {
        <div class="alert alert-error animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div class="alert-content">
            <span class="alert-title">Erro de Integração</span>
            <span class="alert-desc">{{ errorMessage() }}</span>
          </div>
          <button class="retry-btn" (click)="loadDashboardData()">Tentar Novamente</button>
        </div>
      }

      <!-- METRICS CARDS -->
      <div class="metrics-grid">
        @if (store.loading()) {
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="metric-card loading">
              <app-skeleton width="100px" height="14px" radius="4px" class="mb-3"></app-skeleton>
              <app-skeleton width="60px" height="32px" radius="6px" class="mb-2"></app-skeleton>
              <app-skeleton width="130px" height="12px" radius="4px"></app-skeleton>
            </div>
          }
        } @else {
          <!-- Card Total de Usuários -->
          <div class="metric-card animate-fade-in hover-glow purple">
            <div class="metric-header">
              <span class="metric-title">Total de Usuários</span>
              <div class="metric-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ store.usuariosList().length }}</div>
            <div class="metric-subtext">Usuários ativos integrados</div>
          </div>

          <!-- Card Gestores -->
          <div class="metric-card animate-fade-in hover-glow red">
            <div class="metric-header">
              <span class="metric-title">Gestores (Admins)</span>
              <div class="metric-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ getRoleCount('Gestor') }}</div>
            <div class="metric-subtext">Nível administrativo máximo</div>
          </div>

          <!-- Card Auditores -->
          <div class="metric-card animate-fade-in hover-glow blue">
            <div class="metric-header">
              <span class="metric-title">Auditores</span>
              <div class="metric-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ getRoleCount('Gerente') + getRoleCount('Supervisor') }}</div>
            <div class="metric-subtext">Responsáveis por inventários</div>
          </div>

          <!-- Card Operadores / Membros -->
          <div class="metric-card animate-fade-in hover-glow gray">
            <div class="metric-header">
              <span class="metric-title">Operadores</span>
              <div class="metric-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ getRoleCount('Membro Comum') }}</div>
            <div class="metric-subtext">Usuários gerais do sistema</div>
          </div>
        }
      </div>

      <!-- TABS SELECTOR -->
      <div class="dashboard-tabs animate-fade-in">
        <button class="tab-btn" [class.active]="activeTab() === 'usuarios'" (click)="activeTab.set('usuarios')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <span>Usuários</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'convites'" (click)="activeTab.set('convites')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>Painel de Convites</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'logs'" (click)="activeTab.set('logs')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Logs de Acesso</span>
        </button>
      </div>

      <!-- TAB 1: LISTAGEM DE USUÁRIOS -->
      @if (activeTab() === 'usuarios') {
        <div class="users-list-card animate-fade-in">
          <div class="card-header flex-header">
            <div>
              <h3>Visualização de Usuários</h3>
              <p class="subtitle">Lista detalhada dos usuários cadastrados no banco de dados e seus respectivos níveis de acesso.</p>
            </div>
            <button class="btn btn-primary btn-sm flex-btn" (click)="openCreateModal()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Novo Usuário (Manual)
            </button>
          </div>

          <div class="table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>UID no Supabase</th>
                  <th>Perfil de Acesso</th>
                  <th>Data de Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                @if (store.loading()) {
                  @for (row of [1, 2, 3, 4, 5]; track row) {
                    <tr class="skeleton-row">
                      <td><app-skeleton width="140px" height="16px" radius="4px"></app-skeleton></td>
                      <td><app-skeleton width="280px" height="14px" radius="4px"></app-skeleton></td>
                      <td><app-skeleton width="90px" height="22px" radius="12px"></app-skeleton></td>
                      <td><app-skeleton width="110px" height="14px" radius="4px"></app-skeleton></td>
                      <td><app-skeleton width="60px" height="22px" radius="6px"></app-skeleton></td>
                    </tr>
                  }
                } @else {
                  @for (user of store.usuariosList(); track user.id) {
                    <tr class="user-row">
                      <td class="user-name-cell">
                        <div class="avatar-cell">
                          {{ user.nome[0].toUpperCase() }}
                        </div>
                        <span>{{ user.nome }}</span>
                      </td>
                      <td class="uid-cell">
                        <code>{{ user.id }}</code>
                      </td>
                      <td>
                        <span class="role-badge" [ngClass]="getRoleClass(user.perfil_nome)">
                          {{ user.perfil_nome }}
                        </span>
                      </td>
                      <td class="date-cell">
                        {{ formatDate(user.created_at) }}
                      </td>
                      <td class="actions-cell">
                        <button class="action-btn edit" (click)="openEditModal(user)" title="Editar Usuário">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button class="action-btn delete" (click)="handleDelete(user.id)" title="Excluir Usuário">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="empty-state">
                        <p>Nenhum usuário cadastrado no sistema do Supabase.</p>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: PAINEL DE CONVITES -->
      @if (activeTab() === 'convites') {
        <div class="admin-panel-card animate-fade-in">
          <div class="panel-layout">
            <div class="form-panel glass-card-dark">
              <h4>Convidar Novo Colaborador</h4>
              <p class="subtitle mb-4">Envie um convite de acesso seguro via e-mail e defina seu papel correspondente.</p>
              
              <form (submit)="$event.preventDefault()" class="invite-form">
                <div class="form-group">
                  <label for="inviteEmail">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    id="inviteEmail" 
                    name="inviteEmail" 
                    [(ngModel)]="inviteEmail" 
                    placeholder="colaborador@empresa.com" 
                    [disabled]="isSubmitting()"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="inviteRole">Papel Organizacional</label>
                  <select 
                    id="inviteRole" 
                    name="inviteRole" 
                    [(ngModel)]="invitePerfilId"
                    [disabled]="isSubmitting()"
                  >
                    <option [value]="1">Administrador (Gestor)</option>
                    <option [value]="2">Auditor (Gerente)</option>
                    <option [value]="4">Operador (Membro Comum)</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  (click)="handleInviteSubmit()" 
                  class="btn btn-primary mt-4" 
                  [disabled]="isSubmitting() || !inviteEmail"
                >
                  @if (isSubmitting()) {
                    <span class="spinner"></span>
                    <span>Enviando Convite...</span>
                  } @else {
                    <span>Enviar Convite</span>
                  }
                </button>
              </form>
            </div>

            <div class="history-panel">
              <div class="card-header">
                <h3>Convites de Acesso Enviados</h3>
                <p class="subtitle">Verifique quem foi convidado e o respectivo status de ativação.</p>
              </div>

              <div class="table-container">
                <table class="users-table">
                  <thead>
                    <tr>
                      <th>E-mail Convidado</th>
                      <th>Papel</th>
                      <th>Enviado por</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (invite of store.convitesList(); track invite.id) {
                      <tr>
                        <td><strong>{{ invite.email }}</strong></td>
                        <td>
                          <span class="role-badge" [ngClass]="getRoleClassById(invite.perfil_acesso_id)">
                            {{ getRoleName(invite.perfil_acesso_id) }}
                          </span>
                        </td>
                        <td>{{ invite.enviado_por }}</td>
                        <td>
                          <span class="status-pill" [ngClass]="invite.status.toLowerCase()">
                            {{ invite.status }}
                          </span>
                        </td>
                        <td class="date-cell">{{ formatDate(invite.created_at) }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="empty-state">Nenhum convite enviado ainda.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: LOGS DE ACESSO -->
      @if (activeTab() === 'logs') {
        <div class="admin-panel-card animate-fade-in">
          <div class="card-header flex-header">
            <div>
              <h3>Logs de Acesso e Auditoria de Segurança</h3>
              <p class="subtitle">Registros detalhados de logins, ações críticas e governança sobre o inventário.</p>
            </div>
            <div class="search-input-container" style="max-width: 300px; position: relative;">
              <input 
                type="text" 
                placeholder="Filtrar logs..." 
                [(ngModel)]="logSearchQuery"
                name="logSearchQuery"
                style="padding-left: 2rem;"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #64748b;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          <div class="table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Usuário</th>
                  <th>Ação Principal</th>
                  <th>IP de Origem</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (log of getFilteredLogs(); track log.id) {
                  <tr>
                    <td class="date-cell" style="font-weight: 600;">{{ formatDate(log.data_hora) }}</td>
                    <td>{{ log.usuario_email }}</td>
                    <td><code>{{ log.acao }}</code></td>
                    <td class="date-cell">{{ log.ip_origem }}</td>
                    <td>
                      <span class="status-pill" [ngClass]="log.status.toLowerCase()">
                        {{ log.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty-state">Nenhum registro de log de auditoria encontrado.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- TOAST NOTIFICATION -->
    @if (toastMessage()) {
      <div class="toast-container success-toast animate-fade-in" [ngClass]="toastType()">
        <div class="toast-content">
          @if (toastType() === 'success') {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          }
          <span>{{ toastMessage() }}</span>
        </div>
      </div>
    }

    <!-- DIALOG FORM MODAL -->
    @if (showModal()) {
      <div class="modal-overlay animate-fade-in" (click)="closeModal()">
        <div class="modal-container glass-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
            <button class="close-modal-btn" (click)="closeModal()" [disabled]="isSubmitting()">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form (submit)="$event.preventDefault()" class="modal-form">
            <!-- UID/ID (Input) -->
            <div class="form-group">
              <label for="uid">UID do Supabase</label>
              <input 
                type="text" 
                id="uid" 
                name="uid" 
                [(ngModel)]="formId"
                [disabled]="isEditing() || isSubmitting()"
                placeholder="Ex: 88cfb463-ae7c-473d-82d2-881ad394fa93"
                required
              />
            </div>

            <!-- Nome (Input) -->
            <div class="form-group">
              <label for="nome">Nome Completo</label>
              <input 
                type="text" 
                id="nome" 
                name="nome" 
                [(ngModel)]="formNome"
                [disabled]="isSubmitting()"
                placeholder="Digite o nome do usuário"
                required
              />
            </div>

            <!-- Perfil de Acesso (Select) -->
            <div class="form-group">
              <label for="perfil">Perfil de Acesso</label>
              <select 
                id="perfil" 
                name="perfil" 
                [(ngModel)]="formPerfilId"
                [disabled]="isSubmitting()"
              >
                @for (perfil of store.perfisList(); track perfil.id) {
                  <option [value]="perfil.id">{{ perfil.nome }}</option>
                }
              </select>
            </div>

            <!-- Notas/Observações (Textarea) -->
            <div class="form-group">
              <label for="notas">Notas / Observações</label>
              <textarea 
                id="notas" 
                name="notas" 
                [(ngModel)]="formNotas"
                [disabled]="isSubmitting()"
                placeholder="Observações internas sobre o usuário..."
                rows="3"
              ></textarea>
            </div>

            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="closeModal()" 
                [disabled]="isSubmitting()"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                (click)="handleSubmit()" 
                class="btn btn-primary" 
                [disabled]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="spinner"></span>
                  <span>Salvando...</span>
                } @else {
                  <span>Confirmar</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .dashboard-header h2 {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.03em;
      background: linear-gradient(to right, #f8fafc, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .alert {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #fca5a5;
    }

    .alert-icon {
      flex-shrink: 0;
      color: #f87171;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .alert-title {
      font-weight: 700;
      font-size: 0.95rem;
    }

    .alert-desc {
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    .retry-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .retry-btn:hover {
      background: #dc2626;
    }

    /* GRID DE MÉTRICAS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
    }

    .metric-card.loading {
      background: rgba(30, 41, 59, 0.4);
    }

    .metric-card:hover {
      transform: translateY(-4px);
    }

    .hover-glow:hover {
      border-color: rgba(255, 255, 255, 0.1);
    }

    .hover-glow.purple:hover {
      box-shadow: 0 10px 25px rgba(129, 140, 248, 0.15);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(99, 102, 241, 0.05) 100%);
    }

    .hover-glow.red:hover {
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.1);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(239, 68, 68, 0.03) 100%);
    }

    .hover-glow.blue:hover {
      box-shadow: 0 10px 25px rgba(56, 189, 248, 0.1);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(56, 189, 248, 0.03) 100%);
    }

    .hover-glow.gray:hover {
      box-shadow: 0 10px 25px rgba(148, 163, 184, 0.1);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(148, 163, 184, 0.03) 100%);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .metric-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .metric-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .purple .metric-icon-wrapper { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .red .metric-icon-wrapper { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .blue .metric-icon-wrapper { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .gray .metric-icon-wrapper { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

    .metric-value {
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }

    .metric-subtext {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    /* CARD DA LISTA */
    .users-list-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      margin-bottom: 1.5rem;
    }

    .card-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.25rem 0;
      color: #f8fafc;
    }

    /* TABELA */
    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .users-table th {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .users-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      color: #cbd5e1;
    }

    .user-row {
      transition: background-color 0.2s ease;
    }

    .user-row:hover {
      background-color: rgba(255, 255, 255, 0.01);
    }

    .user-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
    }

    .avatar-cell {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
      border: 1px solid rgba(129, 140, 248, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: #a5b4fc;
    }

    .uid-cell code {
      font-family: 'JetBrains Mono', Courier, monospace;
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.4);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
    }

    .date-cell {
      color: #64748b;
      font-size: 0.85rem;
    }

    /* BADGES */
    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .badge-gestor {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
    }

    .badge-gerente {
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.25);
      color: #d8b4fe;
    }

    .badge-supervisor {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.25);
      color: #7dd3fc;
    }

    .badge-membro {
      background: rgba(148, 163, 184, 0.15);
      border: 1px solid rgba(148, 163, 184, 0.25);
      color: #cbd5e1;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem !important;
      color: #64748b;
    }

    .mb-3 { margin-bottom: 0.75rem; }
    .mb-2 { margin-bottom: 0.5rem; }

    /* ANIMAÇÕES */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `]
})
export class DashboardComponent implements OnInit {
  store = inject(AppStore);

  errorMessage = signal<string | null>(null);

  // Tabs
  activeTab = signal<'usuarios' | 'convites' | 'logs'>('usuarios');

  // Form de convites
  inviteEmail = '';
  invitePerfilId = 4;

  // Filtro de logs
  logSearchQuery = '';

  // MODAL & FORM STATE (Usuario Manual)
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error'>('success');

  formId = '';
  formNome = '';
  formPerfilId = 4;
  formNotas = '';
  editingUserId: string | null = null;

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.errorMessage.set(null);
    try {
      await this.store.initializeStore();
    } catch (err: any) {
      console.error('Erro ao carregar dados do painel:', err);
      this.errorMessage.set(err.message || 'Erro inesperado ao consultar a tabela usuarios do Supabase.');
    }
  }

  getRoleCount(roleName: string): number {
    const list = this.store.usuariosList();
    if (roleName === 'Gerente') {
      return list.filter(u => u.perfil_nome === 'Gerente' || u.perfil_nome === 'Auditor').length;
    }
    return list.filter(u => u.perfil_nome === roleName).length;
  }

  getRoleClass(roleName: string): string {
    switch (roleName) {
      case 'Gestor': return 'badge-gestor';
      case 'Gerente': return 'badge-gerente';
      case 'Supervisor': return 'badge-supervisor';
      default: return 'badge-membro';
    }
  }

  getRoleClassById(id: number): string {
    switch (id) {
      case 1: return 'badge-gestor';
      case 2: return 'badge-gerente';
      case 3: return 'badge-supervisor';
      default: return 'badge-membro';
    }
  }

  getRoleName(id: number): string {
    switch (id) {
      case 1: return 'Gestor';
      case 2: return 'Gerente';
      case 3: return 'Supervisor';
      default: return 'Membro Comum';
    }
  }

  formatDate(isoString: string): string {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  }

  getFilteredLogs(): any[] {
    const query = this.logSearchQuery.toLowerCase().trim();
    if (!query) return this.store.acessoLogsList();
    return this.store.acessoLogsList().filter(log => 
      log.usuario_email.toLowerCase().includes(query) || 
      log.acao.toLowerCase().includes(query) ||
      log.status.toLowerCase().includes(query)
    );
  }

  async handleInviteSubmit() {
    if (!this.inviteEmail) return;
    this.isSubmitting.set(true);
    try {
      await this.store.inviteUser(this.inviteEmail, Number(this.invitePerfilId));
      this.showToast('Convite de acesso enviado com sucesso!', 'success');
      this.inviteEmail = '';
    } catch (err: any) {
      console.error(err);
      this.showToast(err.message || 'Erro ao enviar convite.', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // MODAL LOGIC ACTIONS (Criar/Editar Manual)
  openCreateModal() {
    this.isEditing.set(false);
    this.formId = '';
    this.formNome = '';
    this.formPerfilId = 4;
    this.formNotas = '';
    this.editingUserId = null;
    this.showModal.set(true);
  }

  openEditModal(user: any) {
    this.isEditing.set(true);
    this.formId = user.id;
    this.formNome = user.nome;
    this.formPerfilId = user.perfil_acesso_id;
    this.formNotas = '';
    this.editingUserId = user.id;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.formId = '';
    this.formNome = '';
    this.formPerfilId = 4;
    this.formNotas = '';
    this.editingUserId = null;
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  async handleSubmit() {
    if (!this.formId || !this.formNome || !this.formPerfilId) {
      this.showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    try {
      if (this.isEditing()) {
        await this.store.syncUpdateUsuario(this.editingUserId!, {
          nome: this.formNome,
          perfil_acesso_id: Number(this.formPerfilId)
        });
        this.showToast('Usuário atualizado com sucesso!', 'success');
      } else {
        await this.store.syncCreateUsuario({
          id: this.formId,
          nome: this.formNome,
          perfil_acesso_id: Number(this.formPerfilId)
        });
        this.showToast('Usuário criado com sucesso!', 'success');
      }
      this.closeModal();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      this.showToast(err.message || 'Erro ao salvar o usuário no Supabase.', 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este usuário?')) {
      return;
    }

    try {
      await this.store.syncDeleteUsuario(id);
      this.showToast('Usuário excluído com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      this.showToast(err.message || 'Erro ao excluir o usuário no Supabase.', 'error');
    }
  }
}
