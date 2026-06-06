import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStore } from '../store/AppStore';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-wrapper">
      <!-- SIDEBAR -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span class="logo-text">Ativos Cart</span>
          </div>
          <button class="close-sidebar-btn" (click)="toggleSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/usuarios" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Usuários</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-badge">
            <div class="user-avatar">
              {{ (store.currentUser()?.nome || 'U')[0].toUpperCase() }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ store.currentUser()?.nome || 'Carregando...' }}</span>
              <span class="user-role">{{ store.currentUser()?.profile?.perfil || 'Membro' }}</span>
            </div>
          </div>
        </div>
      </aside>

     
      @if (sidebarOpen()) {
        <div class="sidebar-overlay animate-fade-in" (click)="toggleSidebar()"></div>
      }

      <!-- MAIN CONTENT CONTAINER -->
      <div class="main-container">
        <!-- HEADER -->
        <header class="main-header">
          <div class="header-left">
            <button class="toggle-sidebar-btn" (click)="toggleSidebar()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 class="header-title">Gestão de Ativos Cartões</h1>
          </div>

          <div class="header-right">
            <!-- Usuário -->
            <div class="header-user">
              <span class="role-pill">{{ store.currentUser()?.profile?.perfil || 'Acesso Geral' }}</span>
            </div>

            <!-- Logout -->
            <button class="logout-btn" (click)="handleLogout()" title="Sair do aplicativo">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="logout-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </header>

        <!-- CHILD CONTENT -->
        <main class="content-body">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      background-color: #0f172a;
      color: #f1f5f9;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }

    /* SIDEBAR */
    .sidebar {
      width: 260px;
      background-color: #1e293b;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 50;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      color: #818cf8;
    }

    .logo-text {
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.025em;
      background: linear-gradient(to right, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .close-sidebar-btn {
      display: none;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .sidebar-nav {
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .nav-item:hover {
      color: #f1f5f9;
      background-color: rgba(255, 255, 255, 0.03);
    }

    .nav-item.active {
      color: #ffffff;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .nav-item.active .nav-icon {
      color: #818cf8;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background-color: rgba(15, 23, 42, 0.2);
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 700;
      font-size: 1.1rem;
      box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .user-role {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* MAIN CONTAINER */
    .main-container {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: relative;
    }

    /* HEADER */
    .main-header {
      height: 70px;
      background-color: #1e293b;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .toggle-sidebar-btn {
      display: none;
      background: transparent;
      border: none;
      color: #f1f5f9;
      cursor: pointer;
    }

    .header-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
      color: #f8fafc;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .role-pill {
      background: rgba(129, 140, 248, 0.15);
      border: 1px solid rgba(129, 140, 248, 0.25);
      color: #a5b4fc;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.025em;
    }

    .logout-btn {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .content-body {
      padding: 2rem;
      flex: 1;
      background-color: #0f172a;
      box-sizing: border-box;
    }

    /* RESPONSIVIDADE */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .close-sidebar-btn {
        display: block;
      }

      .main-container {
        margin-left: 0;
      }

      .toggle-sidebar-btn {
        display: block;
      }

      .main-header {
        padding: 0 1rem;
      }

      .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 45;
      }

      .header-user {
        display: none;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class LayoutComponent {
  store = inject(AppStore);

  sidebarOpen = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  handleLogout() {
    this.store.logout();
  }
}
