import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../app/store/AppStore.tsx';

// Re-export original Angular authGuard for compilation compatibility
export * from '../app/guards/auth.guard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

  return <>{children}</>;
};
