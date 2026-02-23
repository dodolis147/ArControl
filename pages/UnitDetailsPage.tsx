
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Pencil, 
  Trash2, 
  PlusCircle, 
  Printer, 
  Thermometer, 
  MapPin, 
  Download, 
  Maximize, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Calendar, 
  Cpu, 
  CalendarDays,
  X,
  Save,
  ImageIcon,
  Plus,
  Star,
  User as UserIconComponent,
  ThumbsUp,
  FileText,
  Camera
} from 'lucide-react';
import { ACUnit, User, UserRole, MaintenanceRecord, ServiceType, UnitStatus } from '../types';
import { getMaintenanceAdvice } from '../services/geminiService';
import PhotoReportModal from '../components/PhotoReportModal';

interface UnitDetailsPageProps {
  units: ACUnit[];
  user: User | null;
  onUpdateUnit: (id: string, updatedData: Partial<ACUnit>) => void;
  onDeleteUnit: (id: string) => void;
  onOpenQR: (u: ACUnit) => void;
  onAddMaintenance: (id: string, r: MaintenanceRecord) => void;
  onUpdateMaintenance: (unitId: string, recordId: string, data: Partial<MaintenanceRecord>) => void;
  onRateMaintenance: (unitId: string, recordId: string, rating: number) => void;
  isPublic?: boolean;
}

const UnitDetailsPage: React.FC<UnitDetailsPageProps> = ({ 
  units, user, onUpdateUnit, onDeleteUnit, onOpenQR, onAddMaintenance, onUpdateMaintenance, onRateMaintenance, isPublic = false 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const unit = units.find(u => u.id === id);

  const [activeTab, setActiveTab] = useState<'history' | 'planned' | 'ai'>('history');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ACUnit>>({});
  const [copied, setCopied] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [reportRecord, setReportRecord] = useState<MaintenanceRecord | null>(null);

  useEffect(() => { 
    if (unit) setEditForm(unit); 
  }, [unit, isEditing]);

  const handleFetchAi = async () => { 
    if (aiInsight || !unit) return; 
    setLoadingAi(true); 
    const advice = await getMaintenanceAdvice(unit); 
    setAiInsight(advice); 
    setLoadingAi(false); 
  };

  useEffect(() => { 
    if (activeTab === 'ai' && !isPublic) handleFetchAi(); 
  }, [activeTab]);

  if (!unit) return <div className="text-center py-20 font-black">Equipamento não encontrado.</div>;

  const publicLink = `${window.location.origin}${window.location.pathname}#/public/unit/${unit.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicLink)}`;

  const handleSaveEdit = () => {
    onUpdateUnit(unit.id, editForm);
    setIsEditing(false);
  };

  const handleOpenWhatsApp = () => {
    const phone = "71988638342";
    const text = `*SOLICITAÇÃO DE SERVIÇO - ArControl*\n\n*Equipamento:* ${unit.id}\n*Cliente:* ${unit.clientName}\n*Local:* ${unit.location}\n*Marca:* ${unit.brand}\n\n_Desejo solicitar uma visita técnica para este equipamento._`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const StarRating = ({ recordId, currentRating, interactive }: { recordId: string, currentRating?: number, interactive: boolean }) => {
    const [hover, setHover] = useState(0);
    const isRated = !!currentRating;
    
    return (
      <div className={`flex flex-col gap-2 p-4 rounded-2xl transition-all ${!isRated && interactive ? 'bg-yellow-50 border-2 border-yellow-200 shadow-lg' : 'bg-transparent'}`}>
        <div className="flex items-center gap-2">
           {!isRated && interactive && <ThumbsUp className="w-4 h-4 text-yellow-600" />}
           <p className={`text-[10px] font-black uppercase tracking-widest ${isRated ? 'text-gray-400' : 'text-yellow-700'}`}>
             {isRated ? 'Serviço Avaliado' : 'Como foi o atendimento?'}
           </p>
        </div>
        
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={!interactive || isRated}
              onMouseEnter={() => interactive && !isRated && setHover(star)}
              onMouseLeave={() => interactive && !isRated && setHover(0)}
              onClick={() => interactive && !isRated && onRateMaintenance(unit.id, recordId, star)}
              className={`transition-all ${interactive && !isRated ? 'cursor-pointer hover:scale-125 active:scale-90' : 'cursor-default'}`}
            >
              <Star 
                className={`w-7 h-7 ${star <= (hover || currentRating || 0) ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-200 fill-gray-100'}`} 
              />
            </button>
          ))}
          {isRated && <span className="text-xs font-black text-yellow-600 ml-2">{currentRating}/5</span>}
        </div>
        {!isRated && interactive && <p className="text-[9px] font-bold text-yellow-600/70 italic">* Sua opinião é muito importante!</p>}
      </div>
    );
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500 px-2 sm:px-0">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center w-full sm:w-auto">
          {!isPublic && (
            <button onClick={() => navigate('/')} className="p-2.5 sm:p-3 bg-white shadow-sm border border-gray-100 rounded-xl sm:rounded-2xl mr-3 sm:mr-4 hover:bg-gray-50 transition-all active:scale-95">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter leading-tight">Ficha do Equipamento</h1>
            <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Controle de Climatização</p>
          </div>
        </div>
        {/* Permission Check: Allow ADMIN OR TECHNICIAN to access these controls */}
        {!isPublic && (user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN) && !isEditing && (
          <div className="flex gap-2 w-full sm:w-auto justify-end overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setIsEditing(true)} className="p-3 sm:p-3.5 bg-yellow-500 text-white rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-all flex-shrink-0">
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => setIsConfirmDelete(true)} className="p-3 sm:p-3.5 bg-red-600 text-white rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-all flex-shrink-0">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => setIsMaintenanceModalOpen(true)} className="p-3 sm:p-3.5 bg-green-600 text-white rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-all flex-shrink-0">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* Alterado bg-blue-600 para bg-purple-700 */}
            <button onClick={() => onOpenQR(unit)} className="p-3 sm:p-3.5 bg-purple-700 text-white rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-all flex-shrink-0">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-gray-50 p-5 sm:p-8 mb-8 space-y-6 sm:space-y-8">
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca <span className="text-red-500">*</span></label>
                {/* Alterado focus:border-blue-500 para focus:border-purple-500 */}
                <input type="text" className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidade (BTUs) <span className="text-red-500">*</span></label>
                <input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={editForm.btu} onChange={e => setEditForm({...editForm, btu: parseInt(e.target.value)})} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})} required>
                  {Object.values(UnitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localização <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} required />
              </div>
            </div>
            <div className="flex gap-4">
              {/* Alterado bg-blue-600 para bg-purple-700 */}
              <button onClick={handleSaveEdit} className="flex-1 bg-purple-700 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Salvar</button>
              <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black active:scale-95 flex items-center justify-center gap-2"><X className="w-5 h-5" /> Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">
                   {/* Alterado bg-blue-50 text-blue-600 para bg-purple-50 text-purple-700 */}
                   <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate max-w-full">{unit.clientName}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-none break-all">{unit.id}</h2>
                <p className="text-[11px] sm:text-sm text-gray-400 font-black uppercase tracking-widest">{unit.brand} • {unit.btu} BTU</p>
              </div>
              <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${unit.status === UnitStatus.OPERATIONAL ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {unit.status}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Galeria do Equipamento</label>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {unit.unitPhotos?.map((p, i) => (
                      <img key={i} src={p} className="w-32 h-32 rounded-2xl object-cover flex-shrink-0 shadow-sm border border-gray-100" />
                    )) || (
                      <div className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-200" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 pt-4 border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Setor / Bloco</p>
                    <p className="text-gray-900 font-bold leading-tight text-sm sm:text-base">{unit.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Nº de Série</p>
                    <p className="text-gray-900 font-bold leading-tight font-mono text-sm sm:text-base break-all">{unit.serialNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Localização</p>
                    <p className="text-gray-900 font-bold leading-tight text-sm sm:text-base">{unit.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Data Instalação</p>
                    <p className="text-gray-900 font-bold leading-tight text-sm sm:text-base">{unit.installDate}</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-40 flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50/50 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100">
                <img src={qrUrl} alt="QR" className="w-24 h-24 sm:w-28 sm:h-28 mb-3 sm:mb-4 rounded-xl border border-gray-100" />
                {/* Alterado text-blue-600 para text-purple-700 */}
                <button onClick={() => onOpenQR(unit)} className="text-[9px] sm:text-[10px] font-black text-purple-700 uppercase tracking-tighter flex items-center gap-1.5">
                  <Maximize className="w-3 h-3" /> Ampliar QR
                </button>
              </div>
            </div>

            <div className="pt-6 sm:pt-8 border-t border-gray-50 space-y-4">
              {!isPublic && (
                <>
                  <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link de Consulta Rápida</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-[9px] sm:text-[10px] font-bold text-gray-400 truncate flex items-center min-h-[44px]">{publicLink}</div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      // Alterado bg-white text-blue-600 border-blue-100 para text-purple-700 border-purple-100
                      className={`px-4 sm:px-6 py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all flex-shrink-0 ${copied ? 'bg-green-600 text-white' : 'bg-white text-purple-700 border border-purple-100'}`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado' : 'Link'}
                    </button>
                  </div>
                </>
              )}
              
              <button onClick={handleOpenWhatsApp} className="w-full bg-orange-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[1.8rem] font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-base sm:text-lg">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" /> Abrir Chamado Técnico
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex bg-gray-200/50 p-1 rounded-2xl sm:rounded-[1.8rem] mb-8 overflow-x-auto no-scrollbar">
        {['history', 'planned', 'ai'].map(t => (
          (t !== 'ai' || !isPublic) && (
            <button 
              key={t} 
              onClick={() => setActiveTab(t as any)} 
              // Alterado text-blue-600 para text-purple-700
              className={`flex-1 py-3.5 sm:py-4 px-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white shadow-lg text-purple-700' : 'text-gray-500'}`}
            >
              {t === 'history' ? 'Histórico' : t === 'planned' ? 'Próximas' : 'IA Insights'}
            </button>
          )
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'history' && unit.history.length === 0 && (
          <div className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum registro encontrado</div>
        )}
        
        {activeTab === 'history' && unit.history.map(r => (
          <div key={r.id} className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden">
            {/* Alterado bg-blue-500 para bg-purple-600 */}
            <div className="absolute left-0 top-0 w-1.5 sm:w-2 h-full bg-purple-600"></div>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 sm:gap-6 mb-4">
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h4 className="font-black text-gray-900 text-lg sm:text-xl leading-tight truncate">{r.type}</h4>
                  {!isPublic && (user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN) && (
                    <button 
                      onClick={() => { setEditingMaintenance(r); setIsMaintenanceModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all flex-shrink-0"
                      title="Editar Registro"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Alterado text-blue-500 para text-purple-600 */}
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase flex items-center gap-2 tracking-widest mb-3">
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> {r.date} {r.time && `• ${r.time}`}
                </p>
                {/* Alterado tons de azul para roxo */}
                <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-purple-50 rounded-xl sm:rounded-2xl border border-purple-100 w-fit max-w-full">
                  <div className="bg-purple-700 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                    <UserIconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] sm:text-[9px] font-black text-purple-400 uppercase tracking-widest leading-none mb-0.5 truncate">Técnico Responsável</p>
                    <p className="font-black text-purple-900 text-xs sm:text-sm truncate">{r.technician}</p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto flex justify-center md:justify-end">
                <StarRating 
                  recordId={r.id} 
                  currentRating={r.rating} 
                  interactive={isPublic || user?.role === UserRole.CLIENT} 
                />
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-4 whitespace-pre-line">{r.description}</p>
            
            {/* Photos Display */}
            {r.photos && r.photos.length > 0 && (
               <div className="mt-6 space-y-4">
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {r.photos.map((p, i) => (
                      <div key={i} className="flex-shrink-0 space-y-1">
                        <img src={p} className="w-24 h-24 rounded-xl object-cover border border-gray-100" />
                        {r.photoDescriptions?.[i] && (
                          <p className="text-[8px] text-gray-400 font-medium max-w-[96px] truncate">{r.photoDescriptions[i]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setReportRecord(r)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Camera className="w-4 h-4" /> Gerar Relatório Fotográfico
                  </button>
               </div>
            )}

            {/* Documents Display */}
            {r.documents && r.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Anexos</p>
                <div className="flex flex-wrap gap-2">
                  {r.documents.map((doc, i) => (
                    <a 
                      key={i} 
                      href={doc.url} 
                      download={doc.name} 
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-purple-700 transition-colors"
                    >
                      {/* Alterado text-blue-500 para text-purple-600 */}
                      <FileText className="w-4 h-4 text-purple-600" />
                      {doc.name}
                      <Download className="w-3 h-3 text-gray-400 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {activeTab === 'planned' && unit.planned.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Calendar className="w-6 h-6" /></div>
            <div>
              <h4 className="font-black text-gray-900 text-lg leading-tight">{p.type}</h4>
              <p className="text-[11px] text-orange-600 font-black uppercase tracking-widest mb-1">{p.expectedDate}</p>
              <p className="text-xs text-gray-500 font-medium">{p.description}</p>
            </div>
          </div>
        ))}

        {activeTab === 'ai' && (
          // Alterado bg-blue-900 para bg-purple-900
          <div className="bg-purple-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            {/* Alterado text-blue-300 para text-purple-300 */}
            <div className="flex items-center gap-3 mb-6 font-black text-xs uppercase tracking-[0.3em]">
               <Cpu className="w-6 h-6 text-purple-300" /> Diagnóstico Inteligente
            </div>
            {loadingAi ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-3 bg-white/10 rounded-full w-3/4"></div>
                <div className="h-3 bg-white/10 rounded-full w-full"></div>
                <div className="h-3 bg-white/10 rounded-full w-5/6"></div>
              </div>
            ) : (
              // Alterado text-blue-50 para text-purple-50
              <div className="text-purple-50 text-base font-medium leading-relaxed whitespace-pre-wrap">{aiInsight}</div>
            )}
          </div>
        )}
      </div>

      {isConfirmDelete && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Excluir?</h3>
            <p className="text-gray-500 text-sm mb-8">Deseja remover o equipamento <span className="font-bold">{unit.id}</span> permanentemente?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { onDeleteUnit(unit.id); navigate('/'); }} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black">Sim, Excluir</button>
              <button onClick={() => setIsConfirmDelete(false)} className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {isMaintenanceModalOpen && (
        <MaintenanceModal 
          unit={unit} 
          initialData={editingMaintenance}
          onClose={() => { setIsMaintenanceModalOpen(false); setEditingMaintenance(null); }} 
          onSave={(rec) => { 
            if (editingMaintenance) {
              onUpdateMaintenance(unit.id, editingMaintenance.id, rec);
            } else {
              onAddMaintenance(unit.id, rec); 
            }
            setIsMaintenanceModalOpen(false); 
            setEditingMaintenance(null);
          }} 
        />
      )}

      {reportRecord && (
        <PhotoReportModal 
          data={reportRecord} 
          unit={unit} 
          onClose={() => setReportRecord(null)} 
        />
      )}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.01); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const MaintenanceModal = ({ unit, initialData, onClose, onSave }: { unit: ACUnit, initialData: MaintenanceRecord | null, onClose: () => void, onSave: (r: MaintenanceRecord) => void }) => {
  const [form, setForm] = useState({
    type: initialData?.type || ServiceType.PREVENTIVE,
    technician: initialData?.technician || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    time: initialData?.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    photos: initialData?.photos || [] as string[],
    photoDescriptions: initialData?.photoDescriptions || [] as string[]
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const readers = Array.from(e.target.files).map(file => {
      return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file as Blob);
      });
    });
    const base64s = await Promise.all(readers);
    setForm(prev => ({ 
      ...prev, 
      photos: [...prev.photos, ...base64s],
      photoDescriptions: [...prev.photoDescriptions, ...base64s.map(() => '')]
    }));
  };

  const removePhoto = (index: number) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoDescriptions: prev.photoDescriptions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl my-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter">{initialData ? 'Editar Registro' : 'Registrar Serviço'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ id: initialData?.id || Date.now().toString(), ...form }); }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo <span className="text-red-500">*</span></label>
              <select className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value as ServiceType})} required>
                {Object.values(ServiceType).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Técnico <span className="text-red-500">*</span></label>
              <input type="text" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={form.technician} onChange={e => setForm({...form, technician: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data <span className="text-red-500">*</span></label>
               <input type="date" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</label>
               <input type="time" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-purple-500 outline-none" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
             </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição <span className="text-red-500">*</span></label>
            <textarea className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-medium border-2 border-transparent focus:border-purple-500 outline-none h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Detalhamento do serviço realizado..." />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anexar Fotos</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.photos.map((p, i) => (
                   <div key={i} className="space-y-2 relative group">
                      <button 
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <img src={p} className="w-full aspect-video rounded-xl object-cover border border-gray-200" />
                      <input 
                        type="text" 
                        placeholder="Descrição da foto..." 
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-medium outline-none focus:border-purple-500"
                        value={form.photoDescriptions[i] || ''}
                        onChange={(e) => {
                          const newDescs = [...form.photoDescriptions];
                          newDescs[i] = e.target.value;
                          setForm({ ...form, photoDescriptions: newDescs });
                        }}
                      />
                   </div>
                ))}
                {form.photos.length < 8 && (
                   <label className="aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 transition-all">
                      <Plus className="w-6 h-6 text-gray-300" />
                      <span className="text-[8px] font-black uppercase mt-1">Add Foto</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                   </label>
                )}
             </div>
          </div>
          <button type="submit" className="w-full bg-purple-700 text-white py-5 rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-lg mt-4">{initialData ? 'Atualizar Registro' : 'Salvar Registro'}</button>
        </form>
      </div>
    </div>
  );
};

export default UnitDetailsPage;
