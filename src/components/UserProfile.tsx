import React, { useState, useEffect } from 'react';
import { useAppStore } from '../app/store/AppStore';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { 
    currentUser, 
    syncUpdateUsuario, 
    loading 
  } = useAppStore();

  const [nome, setNome] = useState('');
  const [tema, setTema] = useState<'light' | 'dark'>('light');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '');
      const profile = currentUser.profile as any;
      setTema(profile?.tema === 'dark' ? 'dark' : 'light');
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!nome.trim()) {
      setErrorMessage('O nome não pode estar vazio.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // syncUpdateUsuario updates the database and syncs the local currentUser state
      await syncUpdateUsuario(currentUser.id, {
        nome: nome.trim(),
        tema: tema
      } as any);

      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao salvar as alterações de perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="profile-container" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>Por favor, realize o login para visualizar seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* SUCCESS TOAST */}
      {successMessage && (
        <div className="toast-container success animate-fade-in">
          <div className="toast-content">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="profile-header">
        <h2>Meu Perfil</h2>
        <p className="subtitle">Gerencie suas informações pessoais e preferências do sistema.</p>
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="alert alert-error animate-fade-in">
          <AlertTriangle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PROFILE CARD */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* User Large Avatar Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1.8rem',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
          }}>
            {(nome || 'U')[0].toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 600 }}>{nome}</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Shield size={12} className="text-primary" />
              <span>Função: <strong>{currentUser.profile?.perfil || 'Acesso Geral'}</strong></span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email read-only */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} />
              <span>E-mail Corporativo</span>
            </label>
            <input
              type="text"
              value={currentUser.email || ''}
              disabled
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                borderColor: 'rgba(255,255,255,0.03)',
                color: '#64748b',
                cursor: 'not-allowed'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
              O e-mail é gerido pela sua conta institucional e não pode ser alterado.
            </span>
          </div>

          {/* Name edit */}
          <div className="form-group">
            <label htmlFor="profile-nome" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserIcon size={14} />
              <span>Nome Completo</span>
            </label>
            <input
              type="text"
              id="profile-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              disabled={isSaving || loading}
              required
            />
          </div>

          {/* Theme selector */}
          <div className="form-group">
            <label>Preferência de Tema</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setTema('light')}
                disabled={isSaving || loading}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: tema === 'light' ? '2px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.2)',
                  backgroundColor: tema === 'light' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(15, 23, 42, 0.2)',
                  color: tema === 'light' ? '#818cf8' : '#cbd5e1',
                  fontWeight: tema === 'light' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Sun size={16} />
                <span>Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTema('dark')}
                disabled={isSaving || loading}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: tema === 'dark' ? '2px solid #818cf8' : '1px solid rgba(148, 163, 184, 0.2)',
                  backgroundColor: tema === 'dark' ? 'rgba(129, 140, 248, 0.1)' : 'rgba(15, 23, 42, 0.2)',
                  color: tema === 'dark' ? '#818cf8' : '#cbd5e1',
                  fontWeight: tema === 'dark' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Moon size={16} />
                <span>Escuro</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || loading}
              style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
            >
              {isSaving || loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
