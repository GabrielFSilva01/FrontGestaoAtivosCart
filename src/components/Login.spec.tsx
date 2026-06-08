import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from './Login';
import { useAppStore } from '../app/store/AppStore';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthService using a class to support constructor invocation, stored in globalThis to avoid hoisting issues.
vi.mock('../app/services/AuthService', () => {
  const signIn = vi.fn();
  const getCurrentUser = vi.fn();
  const signOut = vi.fn();
  const resetPassword = vi.fn();
  const resendConfirmationEmail = vi.fn();

  (globalThis as any).__mockAuthService = {
    signIn,
    getCurrentUser,
    signOut,
    resetPassword,
    resendConfirmationEmail,
  };

  return {
    AuthService: class {
      signIn = signIn;
      getCurrentUser = getCurrentUser;
      signOut = signOut;
      resetPassword = resetPassword;
      resendConfirmationEmail = resendConfirmationEmail;
    }
  };
});

const getAuthMocks = () => (globalThis as any).__mockAuthService;

// Mock AppStore hook
const mockSetCurrentUser = vi.fn();
const mockInitializeStore = vi.fn();
const mockAddAcessoLog = vi.fn();

vi.mock('../app/store/AppStore', () => ({
  useAppStore: vi.fn(),
}));

describe('Login Component', () => {
  const defaultStoreState = {
    currentUser: null,
    setCurrentUser: mockSetCurrentUser,
    initializeStore: mockInitializeStore,
    loading: false,
    addAcessoLog: mockAddAcessoLog,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppStore).mockReturnValue(defaultStoreState as any);
    localStorage.clear();
    
    // Clear auth service method mocks
    getAuthMocks().signIn.mockReset();
    getAuthMocks().getCurrentUser.mockReset();
    getAuthMocks().signOut.mockReset();
    getAuthMocks().resetPassword.mockReset();
    getAuthMocks().resendConfirmationEmail.mockReset();
  });

  it('renders login form with fields and buttons correctly (happy path render)', () => {
    // Arrange: Render Login component
    render(<Login />);

    // Assert: Verify inputs and button exist
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Esqueceu a senha?' })).toBeInTheDocument();
  });

  it('renders skeleton loading screen when global store is checking session', () => {
    // Arrange: Mock store in loading state without active user
    vi.mocked(useAppStore).mockReturnValue({
      ...defaultStoreState,
      loading: true,
    } as any);

    // Act: Render Login
    const { container } = render(<Login />);

    // Assert: Check skeleton class/elements (pulse animations)
    expect(container.querySelector('.skeleton-form')).toBeInTheDocument();
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument();
  });

  it('toggles view between Login and Forgot Password recovery forms', async () => {
    // Arrange: Render component
    render(<Login />);

    // Act: Click 'Esqueceu a senha?' to go to recovery view
    const forgotBtn = screen.getByRole('button', { name: 'Esqueceu a senha?' });
    await fireEvent.click(forgotBtn);

    // Assert: Check view switches (Forgot Password title and instructions)
    expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
    expect(screen.getByText('Enviar Link de Recuperação')).toBeInTheDocument();
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();

    // Act: Click 'Voltar para o Login' to return
    const backBtn = screen.getByRole('button', { name: 'Voltar para o Login' });
    await fireEvent.click(backBtn);

    // Assert: Check view switches back to standard login screen
    expect(screen.getByText('Gestão de Ativos')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('performs successful login, sets store user, initializes store data and navigates to homepage', async () => {
    // Arrange: Use fake timers to advance the 1000ms redirect timeout
    vi.useFakeTimers();

    // Mock successful auth flow responses
    const mockUser = { id: 'u1', email: 'gabriel@exemplo.com', nome: 'Gabriel', profile: { id: 'p1', active: true } };
    getAuthMocks().signIn.mockResolvedValue(true);
    getAuthMocks().getCurrentUser.mockResolvedValue(mockUser);

    render(<Login />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitBtn = screen.getByRole('button', { name: 'Entrar' });

    // Act: Simulate typing user inputs
    fireEvent.change(emailInput, { target: { value: 'gabriel@exemplo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the login form
    fireEvent.click(submitBtn);

    // Wait for all promises in handleLogin to resolve
    await vi.runOnlyPendingTimersAsync();

    // Assert: Loading text and backend integrations are initiated
    expect(getAuthMocks().signIn).toHaveBeenCalledWith('gabriel@exemplo.com', 'password123');
    expect(getAuthMocks().getCurrentUser).toHaveBeenCalled();
    expect(mockSetCurrentUser).toHaveBeenCalledWith(mockUser);
    expect(mockInitializeStore).toHaveBeenCalled();
    expect(mockAddAcessoLog).toHaveBeenCalledWith('Login efetuado com sucesso', 'Sucesso', 'gabriel@exemplo.com');

    // Check successful feedback message is in the document
    expect(screen.getByText('Login realizado com sucesso! Redirecionando...')).toBeInTheDocument();

    // Fast-forward 1000ms timer for navigation redirect
    vi.advanceTimersByTime(1000);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });

    // Restore real timers for other tests
    vi.useRealTimers();
  });

  it('displays validation error if any inputs are blank upon submit', async () => {
    // Arrange: Render Login
    const { container } = render(<Login />);
    
    // Act: Submit the form directly to bypass HTML5 validation in jsdom
    const form = container.querySelector('form');
    fireEvent.submit(form!);

    // Assert: Client validation is shown, AuthService is not called
    expect(screen.getByText('Por favor, preencha todos os campos.')).toBeInTheDocument();
    expect(getAuthMocks().signIn).not.toHaveBeenCalled();
  });

  it('handles incorrect password error by displaying an validation message', async () => {
    // Arrange: Mock login credentials rejection error
    getAuthMocks().signIn.mockRejectedValue(new Error('Invalid login credentials'));
    render(<Login />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitBtn = screen.getByRole('button', { name: 'Entrar' });

    // Act: Fill inputs and click sign-in
    fireEvent.change(emailInput, { target: { value: 'fake@exemplo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    // Assert: Check login failure feedback error display and audit logging
    await waitFor(() => {
      expect(getAuthMocks().signIn).toHaveBeenCalledWith('fake@exemplo.com', 'wrongpass');
      expect(mockAddAcessoLog).toHaveBeenCalledWith(
        'Tentativa de login falhou - Invalid login credentials',
        'Falha',
        'fake@exemplo.com'
      );
    });
    expect(screen.getByText('E-mail ou senha incorretos. Tente novamente.')).toBeInTheDocument();
  });

  it('handles inactive account status by blocking access and signing out', async () => {
    // Arrange: Mock user profile as inactive
    const inactiveUser = { id: 'u2', email: 'inactive@exemplo.com', profile: { id: 'p2', active: false } };
    getAuthMocks().signIn.mockResolvedValue(true);
    getAuthMocks().getCurrentUser.mockResolvedValue(inactiveUser);

    render(<Login />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitBtn = screen.getByRole('button', { name: 'Entrar' });

    // Act: Submit form
    fireEvent.change(emailInput, { target: { value: 'inactive@exemplo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitBtn);

    // Assert: Logged out automatically and shows inactive warning feedback
    await waitFor(() => {
      expect(getAuthMocks().signIn).toHaveBeenCalled();
      expect(getAuthMocks().getCurrentUser).toHaveBeenCalled();
      expect(getAuthMocks().signOut).toHaveBeenCalled();
    });
    expect(
      screen.getByText('Sua conta está inativa. Entre em contato com um administrador.')
    ).toBeInTheDocument();
  });

  it('persists session preferences checkbox choice in localStorage', async () => {
    // Arrange: Render Login
    render(<Login />);
    const rememberMeCheckbox = screen.getByLabelText('Manter conectado');

    // Act: Click check
    fireEvent.click(rememberMeCheckbox);

    // Assert: State is saved to storage
    expect(localStorage.getItem('remember_me')).toBe('true');

    // Act: Uncheck it
    fireEvent.click(rememberMeCheckbox);

    // Assert: State updates to false
    expect(localStorage.getItem('remember_me')).toBe('false');
  });

  it('submits forgot password recovery email', async () => {
    // Arrange: Mock password recovery response
    getAuthMocks().resetPassword.mockResolvedValue(true);
    render(<Login />);

    // Go to forgot password view
    const forgotBtn = screen.getByRole('button', { name: 'Esqueceu a senha?' });
    await fireEvent.click(forgotBtn);

    const emailInput = screen.getByLabelText('E-mail');
    const submitBtn = screen.getByRole('button', { name: 'Enviar Link de Recuperação' });

    // Act: Enter recovery e-mail and submit
    fireEvent.change(emailInput, { target: { value: 'recupera@exemplo.com' } });
    fireEvent.click(submitBtn);

    // Assert: Recovery is processed
    await waitFor(() => {
      expect(getAuthMocks().resetPassword).toHaveBeenCalledWith('recupera@exemplo.com');
      expect(mockAddAcessoLog).toHaveBeenCalledWith('Recuperação de senha solicitada', 'Sucesso', 'recupera@exemplo.com');
    });

    expect(
      screen.getByText('E-mail de recuperação enviado! Verifique sua caixa de entrada para redefinir a senha.')
    ).toBeInTheDocument();
  });
});
