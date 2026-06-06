import { Routes } from '@angular/router';
import { LoginComponent } from './components/Login';
import { UpdatePasswordComponent } from './components/UpdatePassword';
import { LayoutComponent } from './components/Layout';
import { DashboardComponent } from './components/Dashboard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'update-password', component: UpdatePasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'usuarios', component: DashboardComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
