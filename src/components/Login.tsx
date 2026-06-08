import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../app/store/AppStore';
import { AuthService } from '../app/services/AuthService';
import { 
  Lock, 
  Mail, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    setCurrentUser, 
    initializeStore,
    loading: storeLoading,
    addAcessoLog
  } = useAppStore();

  const [currentView, setCurrentView] = useState<'login' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepConnected, setKeepConnected] = useState(false);

  // Status feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);

  const authService = React.useMemo(() => new AuthService(), []);

  // Redirect automatically to Dashboard if user is already logged in
  useEffect(() => {
    if (currentUser && !storeLoading) {
      navigate('/', { replace: true });
    }
  }, [currentUser, storeLoading, navigate]);

  // Load remember me preference
  useEffect(() => {
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    setKeepConnected(rememberMe);
  }, []);

  const onKeepConnectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setKeepConnected(checked);
    localStorage.setItem('remember_me', String(checked));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowResendButton(false);

    try {
      // 1. Sign in with password
      await authService.signIn(email, password);

      // 2. Fetch completed user profile
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('Não foi possível obter os dados de perfil do usuário.');
      }

      // Check if user is inactive
      const profile = user.profile as any;
      if (profile && (profile.active === false || profile.ativo === false)) {
        await authService.signOut();
        throw new Error('Sua conta está inativa. Entre em contato com um administrador.');
      }

      // 3. Hydrate state
      setCurrentUser(user);
      await initializeStore();
      await addAcessoLog('Login efetuado com sucesso', 'Sucesso', email);

      setSuccessMessage('Login realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      
      await addAcessoLog('Tentativa de login falhou - ' + msg, 'Falha', email);

      if (msg.includes('Email not confirmed') || msg.includes('confirmação')) {
        setErrorMessage('Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada.');
        setShowResendButton(true);
      } else if (msg.includes('Invalid login credentials') || msg.includes('invalida') || msg.includes('inválido')) {
        setErrorMessage('E-mail ou senha incorretos. Tente novamente.');
      } else {
        setErrorMessage(msg || 'Erro ao realizar login.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authService.resetPassword(email);
      setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada para redefinir a senha.');
      await addAcessoLog('Recuperação de senha solicitada', 'Sucesso', email);
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setActionLoading(false);
    }
  };

  const resendConfirmation = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await authService.resendConfirmationEmail(email);
      setSuccessMessage('E-mail de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
      setShowResendButton(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao reenviar e-mail de confirmação.');
    } finally {
      setActionLoading(false);
    }
  };

  // If store is checking initial session, show standard loading skeleton
  if (storeLoading && !currentUser) {
    return (
      <div className="login-container">
        <div className="glass-card">
          <div className="header animate-pulse">
            <div className="logo-circle" style={{ backgroundColor: 'rgba(255,255,255,0.05)', boxShadow: 'none' }}></div>
            <div style={{ height: '28px', width: '180px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', margin: '0 auto 8px auto' }}></div>
            <div style={{ height: '16px', width: '240px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', margin: '0 auto' }}></div>
          </div>
          <div className="skeleton-form animate-pulse">
            <div style={{ height: '45px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem' }}></div>
            <div style={{ height: '45px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.5rem' }}></div>
            <div style={{ height: '48px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="glass-card animate-fade-in">
        {/* LOGO & TITLE */}
        <div className="header">
          <div className="logo-circle">
            <Lock className="lock-icon" size={24} />
          </div>
          <h2>{currentView === 'login' ? 'Gestão de Ativos' : 'Recuperar Senha'}</h2>
          <p className="subtitle">
            {currentView === 'login' 
              ? 'Acesse sua conta para gerenciar os cartões' 
              : 'Insira seu e-mail para receber as instruções'}
          </p>
        </div>

        {/* FEEDBACK LABELS */}
        {errorMessage && (
          <div className="alert alert-error animate-fade-in mb-4">
            <span className="alert-message">{errorMessage}</span>
            {showResendButton && (
              <button 
                type="button" 
                onClick={resendConfirmation} 
                className="resend-btn" 
                disabled={actionLoading}
                style={{
                  marginTop: '0.5rem',
                  display: 'block',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Enviando...' : 'Reenviar link de confirmação'}
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success animate-fade-in mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={currentView === 'login' ? handleLogin : handleForgotPassword} className="auth-form">
          {/* Email input */}
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#94a3b8' 
                }} 
              />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                style={{ paddingLeft: '2.5rem' }}
                disabled={actionLoading}
                required
              />
            </div>
          </div>

          {/* Password input (login view only) */}
          {currentView === 'login' && (
            <>
              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#94a3b8' 
                    }} 
                  />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={actionLoading}
                    required
                  />
                </div>
              </div>

              {/* Keep connected checkbox */}
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <label className="checkbox-container" style={{ paddingLeft: '1.75rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={keepConnected}
                    onChange={onKeepConnectedChange}
                    disabled={actionLoading}
                  />
                  <span className="checkmark"></span>
                  Manter conectado
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('forgot-password');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="forgot-link"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Session Persistence feedback banner */}
              <div 
                className={`persistence-feedback ${keepConnected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: keepConnected ? '#86efac' : '#94a3b8',
                  background: keepConnected ? 'rgba(34, 197, 94, 0.05)' : 'rgba(15, 23, 42, 0.4)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: keepConnected ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(148, 163, 184, 0.1)',
                  marginTop: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                <span>
                  {keepConnected 
                    ? 'Sua sessão ficará salva neste navegador.' 
                    : 'Sua sessão expirará quando você fechar o navegador.'}
                </span>
              </div>
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', borderRadius: '10px' }}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span>Processando...</span>
            ) : currentView === 'login' ? (
              <span>Entrar</span>
            ) : (
              <span>Enviar Link de Recuperação</span>
            )}
          </button>

          {/* Return link */}
          {currentView === 'forgot-password' && (
            <div className="form-footer" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setCurrentView('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="back-link"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
