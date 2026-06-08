import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppStoreProvider } from './app/store/AppStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import TreePage from './components/TreePage';
import Index from './components/Index';
import AuditFlow from './components/AuditFlow';
import AssetHistory from './components/AssetHistory';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import Dashboard from './components/Dashboard';

// Dummy/mock component placeholders for React tests context
// (Tests may mock or expect these exports or use their path definitions)
const Layout = () => (
  <div id="layout-screen">
    Layout Screen
    <Outlet />
  </div>
);
const UpdatePassword = () => <div id="update-password-screen">Update Password Screen</div>;

// Re-export original Angular components & routes for Angular compatibility
export * from './app/app.component';
export * from './app/app.routes';

export const App: React.FC = () => {
  return (
    <AppStoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Index />} />
            <Route 
              path="usuarios" 
              element={
                <ProtectedRoute allowedRoles={['Gestor', 'Administrador']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="tree" element={<TreePage />} />
            <Route 
              path="auditoria/:id" 
              element={
                <ProtectedRoute allowedRoles={['Gestor', 'Administrador', 'Auditor']}>
                  <AuditFlow />
                </ProtectedRoute>
              } 
            />
            <Route path="historico/:id" element={<AssetHistory />} />
            <Route path="perfil" element={<UserProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStoreProvider>
  );
};

export default App;
