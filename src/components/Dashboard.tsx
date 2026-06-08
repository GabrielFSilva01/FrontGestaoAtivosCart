import React, { useState, useEffect } from 'react';
import { useAppStore } from '../app/store/AppStore';
import { 
  User as UserIcon, 
  UserPlus, 
  Mail, 
  Shield, 
  ShieldCheck, 
  Trash2, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { AcessoLogRow, ConviteRow, Database } from '../lib/supabase/types';

type PerfilAcessoRow = Database['public']['Tables']['perfil_acesso']['Row'];

export const Dashboard: React.FC = () => {
  const {
    usuariosList,
    perfisList,
    acessoLogsList,
    convitesList,
    loading,
    syncCreateUsuario,
    syncUpdateUsuario,
    syncDeleteUsuario,
    inviteUser,
    initializeStore
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'usuarios' | 'convites' | 'logs'>('usuarios');
  
  // Local error/toast state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // User Form fields
  const [formId, setFormId] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formPerfilId, setFormPerfilId] = useState(4);
  const [formNotas, setFormNotas] = useState('');

  // Invite Form fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePerfilId, setInvitePerfilId] = useState(4);

  // Logs Filter field
  const [logSearchQuery, setLogSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setErrorMessage(null);
    try {
      await initializeStore();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao carregar dados do painel.');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getRoleCount = (roleName: string): number => {
    return usuariosList.filter((u: any) => u.perfil_nome === roleName).length;
  };

  const getRoleClass = (roleName: string): string => {
    switch (roleName) {
      case 'Gestor': return 'badge-gestor';
      case 'Gerente': return 'badge-gerente';
      case 'Supervisor': return 'badge-supervisor';
      default: return 'badge-membro';
    }
  };

  const getRoleClassById = (id: number): string => {
    switch (id) {
      case 1: return 'badge-gestor';
      case 2: return 'badge-gerente';
      case 3: return 'badge-supervisor';
      default: return 'badge-membro';
    }
  };

  const getRoleName = (id: number): string => {
    switch (id) {
      case 1: return 'Gestor';
      case 2: return 'Gerente';
      case 3: return 'Supervisor';
      default: return 'Membro Comum';
    }
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // User Actions
  const openCreateModal = () => {
    setIsEditing(false);
    setFormId('');
    setFormNome('');
    setFormPerfilId(4);
    setFormNotas('');
    setEditingUserId(null);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setIsEditing(true);
    setFormId(user.id);
    setFormNome(user.nome);
    setFormPerfilId(user.perfil_acesso_id);
    setFormNotas('');
    setEditingUserId(user.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !formNome || !formPerfilId) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await syncUpdateUsuario(editingUserId!, {
          nome: formNome.trim(),
          perfil_acesso_id: Number(formPerfilId)
        });
        showToast('Usuário atualizado com sucesso!');
      } else {
        await syncCreateUsuario({
          id: formId.trim(),
          nome: formNome.trim(),
          perfil_acesso_id: Number(formPerfilId)
        });
        showToast('Usuário cadastrado com sucesso!');
      }
      closeModal();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao salvar o usuário.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) {
      return;
    }

    try {
      await syncDeleteUsuario(id);
      showToast('Usuário removido com sucesso!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao excluir o usuário.', 'error');
    }
  };

  // Invite Action
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmitting(true);
    try {
      await inviteUser(inviteEmail.trim(), Number(invitePerfilId));
      showToast('Convite de acesso enviado com sucesso!');
      setInviteEmail('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao enviar convite.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logs
  const getFilteredLogs = () => {
    const query = logSearchQuery.toLowerCase().trim();
    if (!query) return acessoLogsList;
    return acessoLogsList.filter((log: AcessoLogRow) => 
      log.usuario_email.toLowerCase().includes(query) ||
      log.acao.toLowerCase().includes(query) ||
      log.status.toLowerCase().includes(query)
    );
  };

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <div className="dashboard-header animate-fade-in">
        <h2>Dashboard Geral e Governança</h2>
        <p className="subtitle">Gerencie o time, convide novos colaboradores e inspecione os logs de auditoria de segurança.</p>
      </div>

      {/* SUCCESS/ERROR TOAST */}
      {toastMessage && (
        <div className={`toast-container success-toast animate-fade-in ${toastType}`}>
          <div className="toast-content">
            {toastType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="alert alert-error animate-fade-in" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong>Erro de Integração</strong>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{errorMessage}</p>
          </div>
          <button className="retry-btn" onClick={loadDashboardData}>
            <RefreshCw size={14} style={{ marginRight: '0.25rem', display: 'inline' }} />
            Tentar Novamente
          </button>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="metrics-grid">
        {loading && usuariosList.length === 0 ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="metric-card loading animate-pulse">
              <div style={{ height: '14px', width: '100px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '0.75rem' }}></div>
              <div style={{ height: '32px', width: '60px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '12px', width: '130px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
            </div>
          ))
        ) : (
          <>
            <div className="metric-card animate-fade-in hover-glow purple">
              <div className="metric-header">
                <span className="metric-title">Total de Usuários</span>
                <div className="metric-icon-wrapper">
                  <UserIcon size={20} />
                </div>
              </div>
              <div className="metric-value">{usuariosList.length}</div>
              <div className="metric-subtext">Usuários ativos integrados</div>
            </div>

            <div className="metric-card animate-fade-in hover-glow red">
              <div className="metric-header">
                <span className="metric-title">Gestores (Admins)</span>
                <div className="metric-icon-wrapper">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="metric-value">{getRoleCount('Gestor')}</div>
              <div className="metric-subtext">Nível administrativo máximo</div>
            </div>

            <div className="metric-card animate-fade-in hover-glow blue">
              <div className="metric-header">
                <span className="metric-title">Auditores</span>
                <div className="metric-icon-wrapper">
                  <Shield size={20} />
                </div>
              </div>
              <div className="metric-value">{getRoleCount('Gerente') + getRoleCount('Supervisor')}</div>
              <div className="metric-subtext">Responsáveis por inventários</div>
            </div>

            <div className="metric-card animate-fade-in hover-glow gray">
              <div className="metric-header">
                <span className="metric-title">Operadores</span>
                <div className="metric-icon-wrapper">
                  <UserIcon size={20} />
                </div>
              </div>
              <div className="metric-value">{getRoleCount('Membro Comum')}</div>
              <div className="metric-subtext">Usuários gerais do sistema</div>
            </div>
          </>
        )}
      </div>

      {/* TABS SELECTOR */}
      <div className="dashboard-tabs animate-fade-in">
        <button className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>
          <UserIcon size={16} />
          <span>Usuários</span>
        </button>
        <button className={`tab-btn ${activeTab === 'convites' ? 'active' : ''}`} onClick={() => setActiveTab('convites')}>
          <Mail size={16} />
          <span>Painel de Convites</span>
        </button>
        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <Shield size={16} />
          <span>Logs de Acesso</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'usuarios' && (
        <div className="users-list-card animate-fade-in">
          <div className="card-header flex-header">
            <div>
              <h3>Visualização de Usuários</h3>
              <p className="subtitle">Lista detalhada dos usuários cadastrados no banco de dados e seus respectivos níveis de acesso.</p>
            </div>
            <button className="btn btn-primary btn-sm flex-btn" onClick={openCreateModal}>
              <UserPlus size={16} />
              <span>Novo Usuário (Manual)</span>
            </button>
          </div>

          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>UID no Supabase</th>
                  <th>Perfil de Acesso</th>
                  <th>Data de Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && usuariosList.length === 0 ? (
                  [1, 2, 3].map(row => (
                    <tr key={row} className="skeleton-row animate-pulse">
                      <td><div style={{ height: '16px', width: '140px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div></td>
                      <td><div style={{ height: '14px', width: '280px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div></td>
                      <td><div style={{ height: '22px', width: '90px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}></div></td>
                      <td><div style={{ height: '14px', width: '110px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div></td>
                      <td><div style={{ height: '22px', width: '60px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div></td>
                    </tr>
                  ))
                ) : (
                  usuariosList.map((user: any) => (
                    <tr key={user.id} className="user-row">
                      <td className="user-name-cell">
                        <div className="avatar-cell">
                          {user.nome[0].toUpperCase()}
                        </div>
                        <span>{user.nome}</span>
                      </td>
                      <td className="uid-cell">
                        <code>{user.id}</code>
                      </td>
                      <td>
                        <span className={`role-badge ${getRoleClass(user.perfil_nome)}`}>
                          {user.perfil_nome}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="actions-cell">
                        <button className="action-btn edit" onClick={() => openEditModal(user)} title="Editar Usuário">
                          <Edit size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(user.id)} title="Excluir Usuário">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && usuariosList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVITATIONS */}
      {activeTab === 'convites' && (
        <div className="admin-panel-card animate-fade-in">
          <div className="panel-layout">
            {/* Invite Form */}
            <div className="form-panel glass-card-dark">
              <h4>Convidar Novo Colaborador</h4>
              <p className="subtitle mb-4">Envie um convite de acesso seguro via e-mail e defina seu papel correspondente.</p>
              
              <form onSubmit={handleInviteSubmit} className="invite-form">
                <div className="form-group">
                  <label htmlFor="inviteEmail">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    id="inviteEmail" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colaborador@empresa.com" 
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="inviteRole">Papel Organizacional</label>
                  <select 
                    id="inviteRole" 
                    value={invitePerfilId}
                    onChange={e => setInvitePerfilId(Number(e.target.value))}
                    disabled={isSubmitting}
                  >
                    <option value={1}>Administrador (Gestor)</option>
                    <option value={2}>Auditor (Gerente)</option>
                    <option value={4}>Operador (Membro Comum)</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary mt-4" 
                  disabled={isSubmitting || !inviteEmail}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      <span>Enviando Convite...</span>
                    </>
                  ) : (
                    <span>Enviar Convite</span>
                  )}
                </button>
              </form>
            </div>

            {/* Invitations History */}
            <div className="history-panel">
              <div className="card-header">
                <h3>Convites de Acesso Enviados</h3>
                <p className="subtitle">Verifique quem foi convidado e o respectivo status de ativação.</p>
              </div>

              <div className="table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>E-mail Convidado</th>
                      <th>Papel</th>
                      <th>Enviado por</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convitesList.map((invite: ConviteRow) => (
                      <tr key={invite.id}>
                        <td><strong>{invite.email}</strong></td>
                        <td>
                          <span className={`role-badge ${getRoleClassById(invite.perfil_acesso_id)}`}>
                            {getRoleName(invite.perfil_acesso_id)}
                          </span>
                        </td>
                        <td>{invite.enviado_por}</td>
                        <td>
                          <span className={`status-pill ${invite.status.toLowerCase()}`}>
                            {invite.status}
                          </span>
                        </td>
                        <td className="date-cell">{formatDate(invite.created_at)}</td>
                      </tr>
                    ))}
                    {convitesList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="empty-state">Nenhum convite enviado ainda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCESS LOGS */}
      {activeTab === 'logs' && (
        <div className="admin-panel-card animate-fade-in">
          <div className="card-header flex-header">
            <div>
              <h3>Logs de Acesso e Auditoria de Segurança</h3>
              <p className="subtitle">Registros detalhados de logins, ações críticas e governança sobre o inventário.</p>
            </div>
            <div className="search-input-container" style={{ maxWidth: '300px', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Filtrar logs..." 
                value={logSearchQuery}
                onChange={e => setLogSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
              <Search size={14} className="search-icon" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Usuário</th>
                  <th>Ação Principal</th>
                  <th>IP de Origem</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredLogs().map((log: AcessoLogRow) => (
                  <tr key={log.id}>
                    <td className="date-cell" style={{ fontWeight: 600 }}>{formatDate(log.data_hora)}</td>
                    <td>{log.usuario_email}</td>
                    <td><code>{log.acao}</code></td>
                    <td className="date-cell">{log.ip_origem}</td>
                    <td>
                      <span className={`status-pill ${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {getFilteredLogs().length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">Nenhum log de auditoria encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay animate-fade-in" onClick={closeModal}>
          <div className="modal-container glass-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="close-modal-btn" onClick={closeModal} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="uid">UID do Supabase</label>
                <input 
                  type="text" 
                  id="uid" 
                  value={formId}
                  onChange={e => setFormId(e.target.value)}
                  disabled={isEditing || isSubmitting}
                  placeholder="Ex: 88cfb463-ae7c-473d-82d2-881ad394fa93"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nome">Nome Completo</label>
                <input 
                  type="text" 
                  id="nome" 
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Digite o nome do usuário"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="perfil">Perfil de Acesso</label>
                <select 
                  id="perfil" 
                  value={formPerfilId}
                  onChange={e => setFormPerfilId(Number(e.target.value))}
                  disabled={isSubmitting}
                >
                  {perfisList.map((perfil: PerfilAcessoRow) => (
                    <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notas">Notas / Observações</label>
                <textarea 
                  id="notas" 
                  value={formNotas}
                  onChange={e => setFormNotas(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Observações internas..."
                  rows={3}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal} 
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Confirmar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
