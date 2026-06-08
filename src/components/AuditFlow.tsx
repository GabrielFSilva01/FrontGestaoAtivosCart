import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../app/store/AppStore';
import { SupabaseService } from '../app/services/supabase.service';
import { 
  ClipboardCopy, 
  Camera, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  FileSignature
} from 'lucide-react';

export const AuditFlow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const navigate = useNavigate();

  const { 
    inventory, 
    currentUser, 
    submitAudit 
  } = useAppStore();

  const asset = inventory.find(item => item.type === 'ativo' && Number(item.id) === itemId);

  // Form states
  const [condicao, setCondicao] = useState('bom');
  const [status, setStatus] = useState('ativo');
  const [notas, setNotas] = useState('');
  
  // Storage upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Signature states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check role permission: only Auditor or Gestor can perform audit checklists
  const isAuditor = (currentUser?.profile?.perfil as string) === 'Auditor' || (currentUser?.profile?.perfil as string) === 'Gestor';

  useEffect(() => {
    if (asset) {
      setCondicao(asset.condicao || 'bom');
      setStatus(asset.status || 'ativo');
    }
  }, [asset]);

  // Set up touch drawing defaults to block scroll gestures on signature block
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: Event) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    document.body.addEventListener('touchstart', preventDefault, { passive: false });
    document.body.addEventListener('touchend', preventDefault, { passive: false });
    document.body.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.body.removeEventListener('touchstart', preventDefault);
      document.body.removeEventListener('touchend', preventDefault);
      document.body.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  // Conditional Validation Checks
  const isDamageState = condicao === 'ruim'; // Danificado/Ruim
  const isPhotoRequired = isDamageState;
  const isNotesRequired = isDamageState;

  // Photo uploads
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);

    setIsUploadingPhoto(true);
    setErrorMessage(null);
    try {
      const supabase = new SupabaseService();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `audit-photos/${fileName}`;

      const { data, error } = await supabase.client.storage
        .from('audit-photos')
        .upload(filePath, file);

      if (error) {
        console.warn('Storage upload error (simulating fallback):', error.message);
        // Fallback for mock environment
        const localUrl = URL.createObjectURL(file);
        setPhotoUrl(localUrl);
      } else {
        const { data: publicUrlData } = supabase.client.storage
          .from('audit-photos')
          .getPublicUrl(filePath);
        setPhotoUrl(publicUrlData.publicUrl);
      }
    } catch (err: any) {
      console.warn('Fallback to local object URL:', err);
      setPhotoUrl(URL.createObjectURL(file));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // HTML5 Drawing Signature Pad Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.strokeStyle = '#f8fafc'; // white ink on dark canvas
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  // Touch drawing support
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuditor) {
      setErrorMessage('Permissão negada: Apenas auditores podem submeter checklist.');
      return;
    }

    if (!asset) {
      setErrorMessage('Ativo não encontrado.');
      return;
    }

    // Enforce photo if damaged
    if (isPhotoRequired && !photoUrl) {
      setErrorMessage('Erro: É obrigatório o envio de uma foto quando o status é Danificado.');
      return;
    }

    // Enforce description notes if damaged
    if (isNotesRequired && !notas.trim()) {
      setErrorMessage('Erro: Uma descrição do dano é obrigatória.');
      return;
    }

    // Enforce signature
    if (!hasSignature) {
      setErrorMessage('Erro: A assinatura digital é obrigatória para conclusão.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL() : '';

      await submitAudit(
        itemId,
        condicao,
        status,
        currentUser?.nome || 'Auditor',
        notas,
        photoUrl,
        signatureDataUrl
      );

      setSuccessMessage('Auditoria concluída e gravada com sucesso!');
      setTimeout(() => {
        navigate(`/historico/${itemId}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao gravar checklist de auditoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) {
    return (
      <div className="alert alert-error">
        <p>Ativo patrimonial com ID {itemId} não foi localizado no inventário.</p>
        <button onClick={() => navigate('/')} className="btn btn-secondary">Voltar ao Início</button>
      </div>
    );
  }

  return (
    <div className="audit-flow-container">
      {/* SUCCESS TOAST OVERLAY */}
      {successMessage && (
        <div className="toast-container success animate-fade-in">
          <div className="toast-content">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="audit-header">
        <h2>Checklist de Auditoria</h2>
        <p className="subtitle">
          Auditoria para o item: <strong>{asset.nome}</strong> (Patrimônio: {asset.numeroPatrimonio || 'S/N'})
        </p>
      </div>

      {/* ACCESS DENIED BLOCK */}
      {!isAuditor ? (
        <div className="alert alert-error animate-fade-in" style={{ marginTop: '1.5rem' }}>
          <AlertTriangle className="alert-icon" size={24} />
          <div className="alert-content">
            <span className="alert-title">Acesso Restrito</span>
            <span className="alert-desc">Sua conta atual não possui o perfil de <strong>Auditor</strong> ou <strong>Gestor</strong>. Por políticas de segurança RLS, você não está autorizado a enviar checklists de auditoria.</span>
          </div>
        </div>
      ) : (
        <div className="audit-form-card glass-card animate-fade-in">
          {errorMessage && (
            <div className="alert alert-error animate-fade-in mb-4">
              <AlertTriangle className="alert-icon" size={20} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="audit-form">
            <div className="form-row-2col">
              {/* Conservation condition */}
              <div className="form-group">
                <label htmlFor="audit-condicao">Estado de Conservação</label>
                <select
                  id="audit-condicao"
                  value={condicao}
                  onChange={(e) => setCondicao(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="bom">Bom (Funcional)</option>
                  <option value="reparo">Para Reparo (Manutenção Necessária)</option>
                  <option value="ruim">Danificado (Sem Funcionalidade)</option>
                </select>
              </div>

              {/* Status */}
              <div className="form-group">
                <label htmlFor="audit-status">Status Operacional</label>
                <select
                  id="audit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="ativo">Ativo (Em circulação)</option>
                  <option value="baixado">Baixado (Descartado/Fora de Uso)</option>
                </select>
              </div>
            </div>

            {/* Conditional description area */}
            <div className="form-group">
              <label htmlFor="audit-notas">
                Notas da Auditoria {isNotesRequired && <span className="text-destructive">* (Obrigatório)</span>}
              </label>
              <textarea
                id="audit-notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder={isNotesRequired ? 'Descreva detalhadamente o dano observado no item...' : 'Notas ou observações gerais sobre a inspeção...'}
                disabled={isSubmitting}
                rows={3}
                required={isNotesRequired}
              />
            </div>

            {/* Conditional file photo area */}
            <div className="form-group">
              <label>
                Registro Fotográfico {isPhotoRequired && <span className="text-destructive">* (Obrigatório)</span>}
              </label>
              
              <div className="photo-upload-zone">
                <input
                  type="file"
                  id="audit-photo-file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isSubmitting || isUploadingPhoto}
                  style={{ display: 'none' }}
                />
                
                <label htmlFor="audit-photo-file" className="photo-upload-label">
                  <Camera size={24} />
                  <span>
                    {isUploadingPhoto ? 'Enviando imagem...' : photoFile ? photoFile.name : 'Selecionar Foto da Auditoria'}
                  </span>
                </label>

                {photoUrl && (
                  <div className="photo-preview-container">
                    <img src={photoUrl} alt="Preview do Dano" className="photo-preview" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoUrl(null);
                      }} 
                      className="btn-delete-photo"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Digital Signature Canvas signature block */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileSignature size={16} />
                <span>Assinatura Digital do Auditor <span className="text-destructive">*</span></span>
              </label>
              
              <div className="signature-pad-container">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawingTouch}
                  onTouchMove={drawTouch}
                  onTouchEnd={stopDrawing}
                  className="signature-canvas"
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="btn-clear-signature"
                  title="Limpar assinatura"
                  disabled={isSubmitting}
                >
                  Limpar
                </button>
              </div>
              <span className="signature-subtext">Desenhe no retângulo acima para validar o checklist.</span>
            </div>

            {/* Footer buttons */}
            <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || isUploadingPhoto}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Concluir Auditoria</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AuditFlow;
