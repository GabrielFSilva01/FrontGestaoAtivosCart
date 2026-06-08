import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/AuthService';
import { AppStore } from '../store/AppStoreService';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const appStore = inject(AppStore);
  const router = inject(Router);

  try {
    const user = await authService.getCurrentUser();
    if (user) {
      // Sincroniza o estado global com o usuário autenticado
      appStore.setCurrentUser(user);
      return true;
    }
  } catch (err) {
    console.error('Erro de validação no AuthGuard:', err);
  }

  // Redireciona para o login caso não esteja autenticado
  return router.createUrlTree(['/login']);
};
