import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../app/store/AppStore';

// Re-export original Angular authGuard for compilation compatibility
export * from '../app/guards/auth.guard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAppStore();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'sans-serif'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.profile?.perfil || 'Membro Comum';
    const hasRole = allowedRoles.some(
      r => r.toLowerCase() === userRole.toLowerCase()
    );
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
