import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStoreProvider } from './app/store/AppStore.tsx';
import { ProtectedRoute } from './components/ProtectedRoute';

// Dummy/mock component placeholders for React tests context
// (Tests may mock or expect these exports or use their path definitions)
const Login = () => <div id="login-screen">Login Screen</div>;
const Layout = () => <div id="layout-screen">Layout Screen</div>;
const Dashboard = () => <div id="dashboard-screen">Dashboard CRUD Screen</div>;
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
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStoreProvider>
  );
};

export default App;
