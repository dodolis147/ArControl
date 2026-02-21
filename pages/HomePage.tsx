
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Scan, 
  Thermometer, 
  ChevronRight, 
  Printer, 
  Bell, 
  BellOff,
  MessageSquare,
  Plus,
  Send,
  X,
  AlertCircle,
  Trash2,
  Pencil,
  CheckCircle2,
  ChevronLeft,
  Activity,
  QrCode,
  Star,
  MapPin,
  User as UserIcon,
  Wrench,
  PlayCircle,
  CheckSquare,
  CalendarClock,
  History,
  Building2,
  Camera,
  FileText,
  Upload,
  ArrowRightLeft,
  Fan
} from 'lucide-react';
import { ACUnit, User, UserRole, Ticket, UnitStatus, ServiceType } from '../types';
import QRScannerModal from '../components/QRScannerModal';

interface HomePageProps {
  units: ACUnit[];
  user: User;
  users?: User[]; 
  tickets: Ticket[];
  onOpenQR: (u: ACUnit) => void;
  onOpenAllQR: () => void;
  onAddTicket: (t: Ticket) => Promise<void> | void;
  onUpdateTicket: (id: string, data: Partial<Ticket>) => void;
  onDeleteTicket: (id: string) => void;
  onAddUnit: (u: ACUnit) => Promise<void> | void;
  onUpdateUnit: (id: string, data: Partial<ACUnit>) => Promise<void> | void;
  onAddPlannedMaintenance: (unitId: string, planned: any) => Promise<void> | void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  units, user, users = [], tickets, onOpenQR, onOpenAllQR, onAddTicket, onUpdateTicket, onDeleteTicket, onAddUnit, onUpdateUnit, onAddPlannedMaintenance 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketFlowStep, setTicketFlowStep] = useState<'selection' | 'new-unit' | 'problem' | 'success'>('selection');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Urgente'>('Média');
  const [ticketStatus, setTicketStatus] = useState<'Aberto' | 'Em Atendimento' | 'Concluído' | 'Reagendado'>('Aberto');
  const [ticketDate, setTicketDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [ratingTicket, setRatingTicket] = useState<Ticket | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const [deleteTicketConfirmation, setDeleteTicketConfirmation] = useState<Ticket | null>(null);

  const [rescheduleTicket, setRescheduleTicket] = useState<Ticket | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', reason: '' });

  const [finishingTicket, setFinishingTicket] = useState<Ticket | null>(null);
  const [finishData, setFinishData] = useState<{ solution: string; photos: string[] }>({ solution: '', photos: [] });

  const [transferTicket, setTransferTicket] = useState<Ticket | null>(null);
  const [selectedTransferTech, setSelectedTransferTech] = useState('');

  const [newUnitData, setNewUnitData] = useState({
    brand: '',
    btu: '',
    location: '',
    serialNumber: ''
  });

  const [maintenanceAlerts, setMaintenanceAlerts] = useState<{ unitId: string; unitName: string; date: string; daysLeft: number }[]>([]);

  const [remindMaintenanceTicket, setRemindMaintenanceTicket] = useState<Ticket | null>(null);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navigate = useNavigate();

  const myUnits = useMemo(() => {
    if (user.role === UserRole.CLIENT) {
      return units.filter(u => u.clientName === user.clientName);
    }
    return units;
  }, [units, user]);

  // Effect to calculate maintenance alerts
  React.useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const alerts: { unitId: string; unitName: string; date: string; daysLeft: number }[] = [];

    myUnits.forEach(unit => {
      unit.planned.forEach(p => {
        const expectedDate = new Date(p.expectedDate);
        const diffTime = expectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Alert if maintenance is in exactly 5 days or less (but not in the past)
        if (diffDays >= 0 && diffDays <= 5) {
          alerts.push({
            unitId: unit.id,
            unitName: `${unit.brand} - ${unit.location}`,
            date: p.expectedDate,
            daysLeft: diffDays
          });
        }
      });
    });

    setMaintenanceAlerts(alerts.sort((a, b) => a.daysLeft - b.daysLeft));
  }, [myUnits]);

  const avgSatisfaction = useMemo(() => {
    let allRatings: number[] = [];
    myUnits.forEach(u => u.history.forEach(r => { if(r.rating) allRatings.push(r.rating); }));
    tickets.forEach(t => { if(t.rating) allRatings.push(t.rating); });
    
    if (allRatings.length === 0) return null;
    return (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1);
  }, [myUnits, tickets]);
  
  const filteredUnits = useMemo(() => 
    myUnits.filter(u => 
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.brand.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
  [myUnits, searchTerm]);

  const availableTechnicians = useMemo(() => {
    return users.filter(u => u.role === UserRole.TECHNICIAN);
  }, [users]);

  const handleOpenTicketModal = () => {
    setEditingTicket(null);
    setTicketDescription('');
    setTicketPriority('Média');
    setTicketStatus('Aberto');
    setTicketDate(new Date().toISOString().split('T')[0]);
    setTicketFlowStep('selection');
    setSelectedUnitId(null);
    setLastCreatedTicket(null);
    setNewUnitData({ brand: '', btu: '', location: '', serialNumber: '' });
    setIsTicketModalOpen(true);
    setIsSubmitting(false);
  };

  const handleEditTicketModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTicketDescription(ticket.description);
    setTicketPriority(ticket.priority);
    setTicketStatus(ticket.status);
    setTicketDate(ticket.date);
    setTicketFlowStep('problem'); 
    setIsTicketModalOpen(true);
    setIsSubmitting(false);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      let targetUnitId = selectedUnitId;

      if (ticketFlowStep === 'new-unit' || (ticketFlowStep === 'problem' && !selectedUnitId && !editingTicket)) {
        if (newUnitData.brand) {
          const newId = `AC-${Math.floor(Math.random() * 9000) + 1000}`;
          const newUnit: ACUnit = {
            id: newId,
            clientName: user.clientName || 'Geral',
            brand: newUnitData.brand,
            btu: parseInt(newUnitData.btu) || 0,
            location: newUnitData.location,
            serialNumber: newUnitData.serialNumber,
            regional: 'Salvador', 
            installDate: new Date().toISOString().split('T')[0],
            status: UnitStatus.MAINTENANCE_REQUIRED,
            history: [],
            planned: [],
            department: '',
            model: ''
          };
          await onAddUnit(newUnit);
          targetUnitId = newId;
        }
      }

      if (editingTicket) {
        onUpdateTicket(editingTicket.id, {
          description: ticketDescription,
          priority: ticketPriority,
          status: ticketStatus,
          date: ticketDate
        });
        setIsTicketModalOpen(false);
      } else {
        const newTicket: Ticket = {
          id: `TK-${Math.floor(Math.random() * 9000) + 1000}`,
          unitId: targetUnitId || undefined,
          clientName: user.clientName || 'Geral',
          description: ticketDescription,
          date: ticketDate,
          status: 'Aberto',
          priority: ticketPriority,
          openedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        await onAddTicket(newTicket);
        setLastCreatedTicket(newTicket);
        setTicketFlowStep('success');
      }
    } catch (error) {
      console.error("Erro ao salvar chamado:", error);
      alert("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyTechnician = (ticket: Ticket) => {
    const techPhone = "71988638342"; 
    const message = `*NOVO CHAMADO ABERTO - ArControl*\n\n*ID do Chamado:* ${ticket.id}\n*Equipamento:* ${ticket.unitId || 'Não Vinculado'}\n*Cliente:* ${ticket.clientName}\n*Prioridade:* ${ticket.priority}\n*Descrição:* ${ticket.description}\n*Data de Previsão:* ${ticket.date}\n\n_Por favor, verifique o painel administrativo._`;
    window.open(`https://wa.me/${techPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Mark as notified
    if (!ticket.waNotified) {
      onUpdateTicket(ticket.id, { waNotified: true });
    }
  };

  const handleAcceptTicket = (ticket: Ticket) => {
    onUpdateTicket(ticket.id, {
      status: 'Em Atendimento',
      technicianId: user.username
    });
  };

  const handleRemindUser = (ticket: Ticket) => {
    setRemindMaintenanceTicket(ticket);
    // Default to 6 months from now
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setNextMaintenanceDate(d.toISOString().split('T')[0]);
  };

  const handleConfirmMaintenanceReminder = async () => {
    if (remindMaintenanceTicket && remindMaintenanceTicket.unitId && nextMaintenanceDate) {
      const unit = units.find(u => u.id === remindMaintenanceTicket.unitId);
      if (unit) {
        const newPlanned = {
          id: `P-${Math.floor(Math.random() * 9000) + 1000}`,
          type: ServiceType.PREVENTIVE,
          description: 'Manutenção Preventiva Agendada pelo Administrador',
          expectedDate: nextMaintenanceDate
        };
        await onAddPlannedMaintenance(unit.id, newPlanned);
        alert(`Nova manutenção agendada para ${nextMaintenanceDate.split('-').reverse().join('/')}. O cliente será notificado quando faltarem 5 dias.`);
        setRemindMaintenanceTicket(null);
      }
    }
  };

  const handleOpenTransferModal = (ticket: Ticket) => {
    setTransferTicket(ticket);
    setSelectedTransferTech('');
  };

  const handleTransferConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferTicket && selectedTransferTech) {
        onUpdateTicket(transferTicket.id, {
            technicianId: selectedTransferTech
        });
        setTransferTicket(null);
        setSelectedTransferTech('');
    }
  };

  const handleOpenFinishModal = (ticket: Ticket) => {
    setFinishingTicket(ticket);
    setFinishData({ solution: '', photos: [] });
  };

  const handleConfirmFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (finishingTicket && finishData.solution) {
      onUpdateTicket(finishingTicket.id, {
        status: 'Concluído',
        solution: finishData.solution,
        photos: finishData.photos,
        finishedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      setFinishingTicket(null);
      setFinishData({ solution: '', photos: [] });
    }
  };

  const handleFinishPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const readers = Array.from(e.target.files).map(file => {
      return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file as Blob);
      });
    });
    const base64s = await Promise.all(readers);
    setFinishData(prev => ({ ...prev, photos: [...prev.photos, ...base64s] }));
  };

  const handleDeleteTicketConfirm = () => {
    if (deleteTicketConfirmation) {
      onDeleteTicket(deleteTicketConfirmation.id);
      setDeleteTicketConfirmation(null);
    }
  };

  const handleRateTicket = () => {
    if (ratingTicket && ratingValue > 0) {
      onUpdateTicket(ratingTicket.id, {
        rating: ratingValue
      });
      setRatingTicket(null);
      setRatingValue(0);
    }
  };

  const handleOpenReschedule = (ticket: Ticket) => {
    setRescheduleTicket(ticket);
    setRescheduleData({
      date: ticket.date,
      reason: ticket.rescheduleReason || ''
    });
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (rescheduleTicket && rescheduleData.date && rescheduleData.reason) {
      onUpdateTicket(rescheduleTicket.id, {
        status: 'Reagendado',
        date: rescheduleData.date,
        rescheduleReason: rescheduleData.reason
      });
      setRescheduleTicket(null);
      setRescheduleData({ date: '', reason: '' });
    }
  };

  const sortedTickets = useMemo(() => {
    let filtered = tickets;
    
    // 1. Role-based filtering
    if (user.role === UserRole.CLIENT) {
      filtered = filtered.filter(t => t.clientName === user.clientName);
    } else if (user.role === UserRole.TECHNICIAN) {
      filtered = filtered.filter(t => t.status === 'Aberto' || t.technicianId === user.username);
    }

    // 2. Status filter
    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // 3. Priority filter
    if (priorityFilter !== 'Todas') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // 4. Search term filter (on tickets too)
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(s) || 
        t.clientName.toLowerCase().includes(s) || 
        t.description.toLowerCase().includes(s) ||
        (t.unitId && t.unitId.toLowerCase().includes(s))
      );
    }

    return [...filtered].sort((a, b) => {
      const order = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
      if (a.status === 'Concluído' && b.status !== 'Concluído') return 1;
      if (b.status === 'Concluído' && a.status !== 'Concluído') return -1;
      
      const pA = order[a.priority as keyof typeof order] || 4;
      const pB = order[b.priority as keyof typeof order] || 4;
      return pA - pB;
    });
  }, [tickets, user, statusFilter, priorityFilter, searchTerm]);

  const getPriorityStyles = (priority: string, status: string) => {
    if (status === 'Concluído') return 'border-gray-100 bg-gray-50/50 opacity-60';
    if (status === 'Em Atendimento') return 'border-orange-300 bg-orange-50 shadow-orange-100 ring-1 ring-orange-200';
    if (status === 'Reagendado') return 'border-indigo-300 bg-indigo-50 shadow-indigo-100';
    
    switch (priority) {
      case 'Urgente': return 'border-red-600 bg-red-50 shadow-red-200';
      case 'Alta': return 'border-orange-500 bg-orange-50 shadow-orange-100';
      // Dynamic primary color for Media priority
      case 'Média': return 'border-[var(--theme-primary)] bg-[var(--theme-primary-light)] shadow-sm';
      case 'Baixa': return 'border-emerald-500 bg-emerald-50 shadow-emerald-100';
      default: return 'border-gray-100 bg-white shadow-gray-100';
    }
  };

  const getPriorityBadgeStyles = (priority: string, status: string) => {
    if (status === 'Concluído') return 'bg-gray-400 text-white';
    if (status === 'Em Atendimento') return 'bg-orange-500 text-white';
    if (status === 'Reagendado') return 'bg-indigo-500 text-white';
    switch (priority) {
      case 'Urgente': return 'bg-red-600 text-white';
      case 'Alta': return 'bg-orange-500 text-white';
      // Dynamic primary color for Media priority
      case 'Média': return 'bg-[var(--theme-primary)] text-white';
      case 'Baixa': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getUnitStatusStyles = (status: UnitStatus) => {
    switch (status) {
      case UnitStatus.OPERATIONAL:
        return 'border-green-200 bg-green-50/30 animate-status-pulse-green';
      case UnitStatus.MAINTENANCE_REQUIRED:
      case UnitStatus.AWAITING_PARTS:
        return 'border-orange-200 bg-orange-50/30 animate-status-pulse-orange';
      case UnitStatus.STOPPED:
        return 'border-red-200 bg-red-50/30 animate-status-pulse-red';
      case UnitStatus.EQUIPAMENTO:
      default:
        return 'border-blue-200 bg-blue-50/30 animate-status-pulse-blue';
    }
  };

  const getUnitStatusBadgeStyles = (status: UnitStatus) => {
    switch (status) {
      case UnitStatus.OPERATIONAL:
        return 'bg-green-100 text-green-700';
      case UnitStatus.MAINTENANCE_REQUIRED:
      case UnitStatus.AWAITING_PARTS:
        return 'bg-orange-100 text-orange-700';
      case UnitStatus.STOPPED:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Welcome Header */}
      <header className="flex items-center justify-between px-2 pt-2">
        <div>
          <h1 className="text-3xl font-black text-[var(--theme-text)] tracking-tighter">
            Olá, <span className="capitalize text-[var(--theme-primary)]">{user.username}</span>!
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
            Painel de Gestão • {user.role === 'ADMIN' ? 'Administrador' : user.role === 'TECHNICIAN' ? 'Técnico' : 'Cliente'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all group"
          >
            <Bell className={`w-6 h-6 ${maintenanceAlerts.length > 0 ? 'text-orange-500 animate-swing' : 'text-gray-400'}`} />
            {myUnits.flatMap(u => u.planned).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {myUnits.flatMap(u => u.planned).length}
              </span>
            )}
          </button>
          <div className="hidden sm:block text-right">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </header>

      {/* Maintenance Alerts Section */}
      {maintenanceAlerts.length > 0 && (
        <section className="px-2">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-[2.5rem] p-6 animate-maintenance-alert">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-200">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-orange-900 tracking-tight italic">Lembrete de Manutenção!</h3>
                <p className="text-orange-700/70 text-[10px] font-black uppercase tracking-widest">Atenção aos prazos preventivos</p>
              </div>
            </div>
            <div className="space-y-3">
              {maintenanceAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-black text-xs">
                      {alert.daysLeft}d
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{alert.unitName}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Próxima: {alert.date.split('-').reverse().join('/')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/unit/${alert.unitId}`)}
                    className="p-2 bg-orange-500 text-white rounded-xl shadow-md active:scale-90 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search & Actions */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[var(--theme-primary)] transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por ID, Cliente ou Marca..." 
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] outline-none font-bold text-[var(--theme-text)] focus:border-[var(--theme-primary)] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="px-8 py-5 bg-[var(--theme-primary)] text-white rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <Scan className="w-6 h-6" /> <span className="hidden sm:inline">Escanear QR</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 px-2">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <Activity className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-gray-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              <option value="Aberto">Aberto</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Reagendado">Reagendado</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-gray-600"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="Todas">Todas as Prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>

          {(statusFilter !== 'Todos' || priorityFilter !== 'Todas') && (
            <button 
              onClick={() => { setStatusFilter('Todos'); setPriorityFilter('Todas'); }}
              className="text-[10px] font-black text-[var(--theme-primary)] uppercase tracking-widest hover:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </section>

      {/* Stats Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Satisfação Média</p>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h3 className="text-3xl font-black text-[var(--theme-text)]">{avgSatisfaction || 'N/A'}</h3>
            </div>
          </div>
          <Activity className="w-10 h-10 text-[var(--theme-primary)] opacity-50" />
        </div>

        {maintenanceAlerts.length > 0 && user.role !== UserRole.CLIENT && (
          <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Alertas de Manutenção</p>
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-black">{maintenanceAlerts.length} Próximas em 7 dias</h3>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Tickets Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <Bell className="w-6 h-6 text-[var(--theme-primary)]" />
             <h2 className="text-xl font-black tracking-tighter italic text-[var(--theme-text)]">Chamados Ativos</h2>
          </div>
          <button 
            onClick={handleOpenTicketModal}
            className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> <span className="text-xs font-black uppercase tracking-widest">Abrir Chamado</span>
          </button>
        </div>

        <div className="grid gap-4">
          {sortedTickets.length > 0 ? sortedTickets.map(ticket => (
            <div 
              key={ticket.id} 
              className={`p-6 rounded-[2.2rem] border-2 transition-all group ${getPriorityStyles(ticket.priority, ticket.status)}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  
                  {/* MODIFIED HEADER: Status + Date Highlight */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityBadgeStyles(ticket.priority, ticket.status)}`}>
                      {ticket.status === 'Em Atendimento' ? 'EM ANDAMENTO' : (ticket.status === 'Reagendado' ? 'REAGENDADO' : ticket.priority)}
                    </span>

                    {ticket.status === 'Aberto' && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-[var(--theme-primary)]">
                        <Fan className="w-3 h-3" />
                        <span className="text-[9px] font-black tracking-widest uppercase">Aguardando Técnico</span>
                      </div>
                    )}

                    {/* NEW DATE HIGHLIGHT BADGE - LARGER AND PULSING */}
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border shadow-lg animate-date-pulse ${ticket.status === 'Reagendado' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-gray-900 text-white border-transparent'}`} title="Data Agendada">
                       <CalendarClock className="w-5 h-5" />
                       <span className="text-sm font-black tracking-widest">{ticket.date.split('-').reverse().join('/')}</span>
                    </div>

                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{ticket.id}</span>
                  </div>

                  {/* Ticket Times: Opening and Closing */}
                  <div className="flex gap-4 mb-3">
                    {ticket.openedAt && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Aberto: <span className="text-gray-900">{ticket.openedAt}</span></p>
                      </div>
                    )}
                    {ticket.finishedAt && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Finalizado: <span className="text-gray-900">{ticket.finishedAt}</span></p>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-black text-[var(--theme-text)] text-lg leading-tight mb-3">{ticket.description}</h4>
                  
                  {/* Highlighted Client and Technician Info */}
                  <div className="flex flex-wrap gap-3 mb-2">
                    {/* Dynamic style for Client */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-lg border-l-4 border-[var(--theme-primary)] shadow-sm">
                      <Building2 className="w-4 h-4" />
                      <div>
                        <p className="text-[8px] opacity-70 font-bold uppercase tracking-widest leading-none">Cliente</p>
                        <p className="font-black text-xs uppercase tracking-wide">{ticket.clientName}</p>
                      </div>
                    </div>

                    {ticket.technicianId && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-900 rounded-lg border-l-4 border-orange-600 shadow-sm">
                        <Wrench className="w-4 h-4 text-orange-700" />
                        <div>
                          <p className="text-[8px] text-orange-600/70 font-bold uppercase tracking-widest leading-none">Técnico</p>
                          <p className="font-black text-xs uppercase tracking-wide">{ticket.technicianId}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {ticket.unitId && (
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1 ml-1 mb-2">
                       <Thermometer className="w-3 h-3" /> Equipamento: {ticket.unitId}
                    </p>
                  )}

                  {/* Service Report Display (Visible when ticket is Completed) */}
                  {ticket.status === 'Concluído' && ticket.solution && (
                    <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-gray-200">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Relatório de Serviço
                      </p>
                      <p className="text-xs font-medium text-gray-800 mb-3">{ticket.solution}</p>
                      {ticket.photos && ticket.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {ticket.photos.map((photo, idx) => (
                            <img key={idx} src={photo} alt="Serviço" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Justification for Rescheduled */}
                  {ticket.status === 'Reagendado' && ticket.rescheduleReason && (
                    <div className="mt-3 p-3 bg-indigo-100 rounded-xl border border-indigo-200">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <History className="w-3 h-3" /> Motivo do Reagendamento
                      </p>
                      <p className="text-xs font-medium text-indigo-900">{ticket.rescheduleReason}</p>
                    </div>
                  )}

                  {/* Rating Display for Completed Tickets */}
                  {ticket.status === 'Concluído' && ticket.rating && (
                     <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-3 h-3 ${i < ticket.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Avaliado</span>
                     </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                   {/* Transfer Action */}
                   {(user.role === UserRole.ADMIN || (user.role === UserRole.TECHNICIAN && ticket.technicianId === user.username)) && ticket.status !== 'Concluído' && (
                       <button
                           onClick={() => handleOpenTransferModal(ticket)}
                           className="flex-1 md:flex-none p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                           title="Transferir Chamado"
                       >
                           <ArrowRightLeft className="w-5 h-5 mx-auto" />
                       </button>
                   )}

                   {/* Technician Secondary Action: Reschedule */}
                   {user.role === UserRole.TECHNICIAN && (ticket.status === 'Em Atendimento' || ticket.status === 'Reagendado') && ticket.technicianId === user.username && (
                      <button 
                        onClick={() => handleOpenReschedule(ticket)}
                        className="flex-1 md:flex-none p-3 bg-indigo-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                        title="Reagendar Chamado"
                      >
                        <CalendarClock className="w-5 h-5 mx-auto" />
                      </button>
                   )}

                   {/* Client Rating Action */}
                   {user.role === UserRole.CLIENT && ticket.status === 'Concluído' && !ticket.rating && (
                     <button 
                       onClick={() => { setRatingTicket(ticket); setRatingValue(0); }}
                       className="flex-1 md:flex-none px-4 py-3 bg-yellow-500 text-white rounded-xl shadow-lg active:scale-90 transition-all flex items-center gap-2"
                     >
                       <Star className="w-5 h-5" /> <span className="text-xs font-black uppercase">Avaliar</span>
                     </button>
                   )}

                   {/* General Actions */}
                   {ticket.status === 'Concluído' && user.role === UserRole.ADMIN && (
                     <button 
                       onClick={() => handleRemindUser(ticket)}
                       className="flex-1 md:flex-none p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-all flex items-center gap-2 group/remind"
                       title="Relembrar Cliente"
                     >
                       <Bell className="w-5 h-5 mx-auto" />
                       <span className="text-[10px] font-black uppercase hidden sm:inline">Relembrar</span>
                     </button>
                   )}

                   {ticket.status !== 'Concluído' && (user.role === UserRole.ADMIN || user.role === UserRole.CLIENT) && (
                     <button 
                       onClick={() => handleNotifyTechnician(ticket)}
                       className={`flex-1 md:flex-none p-3 rounded-xl shadow-lg active:scale-90 transition-all ${
                         ticket.waNotified 
                           ? 'bg-gray-200 text-gray-500 shadow-none cursor-default' 
                           : 'bg-emerald-600 text-white shadow-emerald-100'
                       }`}
                       title={ticket.waNotified ? "Notificação já enviada" : "Notificar via WhatsApp"}
                       disabled={ticket.waNotified}
                     >
                       {ticket.waNotified ? <CheckCircle2 className="w-5 h-5 mx-auto" /> : <Send className="w-5 h-5 mx-auto" />}
                     </button>
                   )}
                   
                   {(user.role === UserRole.ADMIN || (user.role === UserRole.CLIENT && ticket.status === 'Aberto')) && (
                     <>
                        <button 
                          onClick={() => handleEditTicketModal(ticket)}
                          className="flex-1 md:flex-none p-3 bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm active:scale-90 transition-all"
                        >
                          <Pencil className="w-5 h-5 mx-auto" />
                        </button>
                        <button 
                          onClick={() => setDeleteTicketConfirmation(ticket)}
                          className="flex-1 md:flex-none p-3 bg-white text-red-500 border border-red-100 rounded-xl shadow-sm active:scale-90 transition-all"
                        >
                          <Trash2 className="w-5 h-5 mx-auto" />
                        </button>
                     </>
                   )}
                </div>
              </div>

              {/* Quick Action Bar for Technicians */}
              {user.role === UserRole.TECHNICIAN && (ticket.status === 'Aberto' || ((ticket.status === 'Em Atendimento' || ticket.status === 'Reagendado') && ticket.technicianId === user.username)) && (
                <div className="mt-6 pt-4 border-t border-gray-100/50 relative z-10">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Ação Rápida do Técnico</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {ticket.status === 'Aberto' ? (
                    <button 
                      onClick={() => handleAcceptTicket(ticket)}
                      className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      <PlayCircle className="w-6 h-6 group-hover/btn:scale-110 transition-transform" /> 
                      <span>Aceitar Chamado Agora</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOpenFinishModal(ticket)}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      <CheckSquare className="w-6 h-6 group-hover/btn:scale-110 transition-transform" /> 
                      <span>Finalizar Serviço</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            </div>
          )) : (
            <div className="text-center py-10 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
               <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Nenhum chamado pendente</p>
            </div>
          )}
        </div>
      </section>

      {/* Units Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <Thermometer className="w-6 h-6 text-[var(--theme-primary)]" />
             <h2 className="text-xl font-black tracking-tighter italic text-[var(--theme-text)]">Meus Equipamentos</h2>
          </div>
          <button 
            onClick={onOpenAllQR}
            className="p-3 bg-white text-[var(--theme-primary)] border border-[var(--theme-primary-light)] rounded-2xl shadow-sm active:scale-95 transition-all flex items-center gap-2"
          >
            <Printer className="w-5 h-5" /> <span className="text-xs font-black uppercase tracking-widest">Imprimir Todos</span>
          </button>
        </div>

        <div className="grid gap-4">
          {filteredUnits.length > 0 ? filteredUnits.map(unit => (
            <div 
              key={unit.id} 
              className={`p-6 rounded-[2.5rem] border transition-all flex flex-col md:flex-row items-center gap-6 ${getUnitStatusStyles(unit.status)}`}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                unit.status === UnitStatus.OPERATIONAL ? 'bg-green-100' : 
                unit.status === UnitStatus.STOPPED ? 'bg-red-100' : 'bg-orange-100'
              }`}>
                <Thermometer className={`w-10 h-10 ${
                  unit.status === UnitStatus.OPERATIONAL ? 'text-green-600' : 
                  unit.status === UnitStatus.STOPPED ? 'text-red-600' : 'text-orange-600'
                }`} />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-[var(--theme-text)] tracking-tighter">{unit.id}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-block mx-auto md:mx-0 ${getUnitStatusBadgeStyles(unit.status)}`}>
                    {unit.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{unit.brand} • {unit.btu} BTU</p>
                <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                   <MapPin className="w-3 h-3" /> {unit.location}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => navigate(`/unit/${unit.id}`)}
                  className="flex-1 md:flex-none px-6 py-4 bg-gray-50 text-gray-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  Ficha <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onOpenQR(unit)}
                  className="p-4 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-2xl hover:bg-[var(--theme-primary)] hover:text-white transition-all shadow-sm"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-20">
               <p className="text-gray-300 font-black uppercase text-xs tracking-[0.3em]">Nenhum equipamento encontrado</p>
            </div>
          )}
        </div>
      </section>

      {/* Ticket Wizard Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative">
            <button onClick={() => setIsTicketModalOpen(false)} className="absolute top-8 right-8 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
              <X className="w-6 h-6" />
            </button>

            {ticketFlowStep === 'selection' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black tracking-tighter italic text-[var(--theme-text)]">Como podemos ajudar?</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Selecione o equipamento</p>
                </div>
                <div className="grid gap-4">
                  <button 
                    onClick={() => setTicketFlowStep('problem')}
                    className="w-full p-6 bg-[var(--theme-primary)] text-white rounded-3xl font-black text-left flex items-center justify-between shadow-xl active:scale-95 transition-all"
                  >
                    <div>
                      <p className="text-[10px] opacity-70 uppercase tracking-widest mb-1">Equipamento já cadastrado</p>
                      <p className="text-xl">Selecionar da Lista</p>
                    </div>
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={() => setTicketFlowStep('new-unit')}
                    className="w-full p-6 bg-white border-2 border-gray-100 text-gray-900 rounded-3xl font-black text-left flex items-center justify-between active:scale-95 transition-all"
                  >
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Novo ou não identificado</p>
                      <p className="text-xl text-[var(--theme-text)]">Cadastrar e Abrir</p>
                    </div>
                    <Plus className="w-8 h-8 text-[var(--theme-primary)]" />
                  </button>
                </div>
              </div>
            )}

            {ticketFlowStep === 'new-unit' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                 <button onClick={() => setTicketFlowStep('selection')} className="flex items-center gap-2 text-[var(--theme-primary)] font-black text-[10px] uppercase tracking-widest mb-4">
                   <ChevronLeft className="w-4 h-4" /> Voltar
                 </button>
                 <h3 className="text-2xl font-black tracking-tighter italic text-[var(--theme-text)]">Novo Equipamento</h3>
                 <div className="grid gap-4">
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marca</label>
                     <input type="text" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold" value={newUnitData.brand} onChange={e => setNewUnitData({...newUnitData, brand: e.target.value})} placeholder="Ex: Samsung" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capacidade (BTU)</label>
                     <input type="text" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold" value={newUnitData.btu} onChange={e => setNewUnitData({...newUnitData, btu: e.target.value})} placeholder="Ex: 12000" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localização</label>
                     <input type="text" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold" value={newUnitData.location} onChange={e => setNewUnitData({...newUnitData, location: e.target.value})} placeholder="Ex: Sala 202" />
                   </div>
                   <button onClick={() => setTicketFlowStep('problem')} className="w-full bg-[var(--theme-primary)] text-white py-5 rounded-2xl font-black shadow-xl mt-4">Próximo</button>
                 </div>
              </div>
            )}

            {ticketFlowStep === 'problem' && (
              <form onSubmit={handleSaveTicket} className="space-y-6 animate-in slide-in-from-right-4">
                 <button type="button" onClick={() => setTicketFlowStep(editingTicket ? 'problem' : (selectedUnitId ? 'selection' : 'selection'))} className="flex items-center gap-2 text-[var(--theme-primary)] font-black text-[10px] uppercase tracking-widest mb-4">
                   <ChevronLeft className="w-4 h-4" /> Voltar
                 </button>
                 <h3 className="text-2xl font-black tracking-tighter italic text-[var(--theme-text)]">{editingTicket ? 'Editar Chamado' : 'Relate o Problema'}</h3>
                 
                 {!editingTicket && !newUnitData.brand && (
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vincular a:</label>
                     <select 
                       className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-[var(--theme-primary)] outline-none"
                       value={selectedUnitId || ''}
                       onChange={e => setSelectedUnitId(e.target.value)}
                     >
                       <option value="">Nenhum (Problema Geral)</option>
                       {myUnits.map(u => <option key={u.id} value={u.id}>{u.id} - {u.brand} ({u.location})</option>)}
                     </select>
                   </div>
                 )}

                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição do Problema</label>
                   <textarea 
                     className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-medium border-2 border-transparent focus:border-[var(--theme-primary)] outline-none h-32 resize-none"
                     placeholder="Ex: Ar condicionado parou de esfriar e está fazendo barulho estranho..."
                     value={ticketDescription}
                     onChange={e => setTicketDescription(e.target.value)}
                     required
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prioridade</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold"
                        value={ticketPriority}
                        onChange={e => setTicketPriority(e.target.value as any)}
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Previsão</label>
                      <input type="date" className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold" value={ticketDate} onChange={e => setTicketDate(e.target.value)} />
                    </div>
                 </div>

                 {/* Only Admin can change status manually here, or if editing. Technicians use buttons. */}
                 {editingTicket && (user.role === UserRole.ADMIN) && (
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                     <select 
                       className="w-full px-5 py-3.5 bg-gray-50 rounded-xl font-bold"
                       value={ticketStatus}
                       onChange={e => setTicketStatus(e.target.value as any)}
                     >
                        <option value="Aberto">Aberto</option>
                        <option value="Em Atendimento">Em Atendimento</option>
                        <option value="Reagendado">Reagendado</option>
                        <option value="Concluído">Concluído</option>
                     </select>
                   </div>
                 )}

                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full text-white py-5 rounded-2xl font-black shadow-xl mt-4 transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--theme-primary)] hover:opacity-90 active:scale-95'}`}
                 >
                    {isSubmitting ? 'Processando...' : (editingTicket ? 'Salvar Alterações' : 'Confirmar Chamado')}
                 </button>
              </form>
            )}

            {ticketFlowStep === 'success' && lastCreatedTicket && (
              <div className="text-center space-y-8 animate-in zoom-in-95">
                <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter italic text-[var(--theme-text)]">Chamado Aberto!</h3>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">ID: {lastCreatedTicket.id}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl space-y-4 text-left border border-gray-100">
                   <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"Nossa equipe técnica já foi notificada e em breve entrará em contato para agendar o atendimento."</p>
                </div>
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => handleNotifyTechnician(lastCreatedTicket)}
                     className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                   >
                     <MessageSquare className="w-5 h-5" /> Notificar via WhatsApp
                   </button>
                   <button 
                     onClick={() => setIsTicketModalOpen(false)}
                     className="w-full bg-gray-100 text-gray-400 py-5 rounded-2xl font-black"
                   >
                     Fechar
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Ticket Modal */}
      {transferTicket && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">Transferir Chamado</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Selecione o novo técnico</p>
               </div>
               <button onClick={() => setTransferTicket(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleTransferConfirm} className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Chamado Atual</p>
                    <p className="font-bold text-blue-900 mb-2">{transferTicket.id} - {transferTicket.description}</p>
                    <p className="text-xs text-blue-700">Técnico atual: <span className="font-black">{transferTicket.technicianId || 'Nenhum'}</span></p>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Novo Responsável <span className="text-red-500">*</span></label>
                   <select 
                      className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-blue-500 transition-all"
                      value={selectedTransferTech}
                      onChange={(e) => setSelectedTransferTech(e.target.value)}
                      required
                   >
                      <option value="">Selecione um técnico...</option>
                      {availableTechnicians.map(tech => (
                          <option key={tech.id} value={tech.username}>{tech.username}</option>
                      ))}
                   </select>
                </div>

                <button 
                   type="submit" 
                   disabled={!selectedTransferTech}
                   className="w-full bg-blue-600 disabled:bg-gray-300 text-white py-5 rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-lg mt-4 flex items-center justify-center gap-2"
                >
                   <ArrowRightLeft className="w-5 h-5" /> Confirmar Transferência
                </button>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Reminder Modal */}
      {remindMaintenanceTicket && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">Agendar Próxima</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Manutenção Preventiva</p>
              </div>
              <button onClick={() => setRemindMaintenanceTicket(null)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
               <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-6">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Equipamento</p>
                  <p className="font-black text-indigo-900">{units.find(u => u.id === remindMaintenanceTicket.unitId)?.brand} - {units.find(u => u.id === remindMaintenanceTicket.unitId)?.location}</p>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data da Próxima Manutenção</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-black outline-none focus:border-indigo-500 transition-all" 
                    value={nextMaintenanceDate} 
                    onChange={e => setNextMaintenanceDate(e.target.value)} 
                  />
               </div>

               <button 
                  onClick={handleConfirmMaintenanceReminder}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-lg mt-4 flex items-center justify-center gap-2"
               >
                  <CalendarClock className="w-5 h-5" /> Confirmar Agendamento
               </button>
               
               <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">
                  O cliente receberá um alerta animado em seu painel quando faltarem 5 dias para esta data.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">Notificações</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Próximas Manutenções</p>
                </div>
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              {units.flatMap(u => u.planned.map(p => ({ unit: u, planned: p }))).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellOff className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Nenhuma notificação</p>
                </div>
              ) : (
                units
                  .filter(u => user.role === UserRole.CLIENT ? u.clientName === user.clientName : true)
                  .flatMap(u => u.planned.map(p => ({ unit: u, planned: p })))
                  .sort((a, b) => new Date(a.planned.expectedDate).getTime() - new Date(b.planned.expectedDate).getTime())
                  .map((item, idx) => {
                    const days = Math.ceil((new Date(item.planned.expectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = days <= 5 && days >= 0;

                    return (
                      <div 
                        key={idx} 
                        className={`p-5 rounded-3xl border-2 transition-all ${isUrgent ? 'bg-orange-50 border-orange-200 shadow-lg shadow-orange-100' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-orange-500 animate-pulse' : 'bg-indigo-400'}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-orange-600' : 'text-gray-400'}`}>
                              {isUrgent ? 'Urgente • Manutenção Próxima' : 'Agendado'}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-gray-400">{item.planned.expectedDate.split('-').reverse().join('/')}</span>
                        </div>
                        <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{item.unit.brand}</h4>
                        <p className="text-xs font-bold text-gray-500 mb-4">{item.unit.location}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {days < 0 ? 'Atrasado' : days === 0 ? 'Hoje' : `Faltam ${days} dias`}
                            </div>
                          </div>
                          <button 
                            onClick={() => { setIsNotificationsOpen(false); navigate(`/unit/${item.unit.id}`); }}
                            className={`p-2 rounded-xl transition-all ${isUrgent ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <button 
              onClick={() => setIsNotificationsOpen(false)}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Finish Ticket Modal (Report) */}
      {finishingTicket && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">Finalizar Serviço</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Relatório Técnico</p>
              </div>
              <button onClick={() => setFinishingTicket(null)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleConfirmFinish} className="space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Solução Aplicada / Descrição <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-medium outline-none focus:border-green-500 transition-all h-32 resize-none" 
                    placeholder="Descreva o serviço realizado, peças trocadas, etc..."
                    value={finishData.solution} 
                    onChange={e => setFinishData({...finishData, solution: e.target.value})} 
                    required 
                  />
               </div>

               <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fotos do Serviço</label>
                 <div className="grid grid-cols-4 gap-2">
                    {finishData.photos.map((p, i) => (
                       <img key={i} src={p} className="w-full aspect-square rounded-xl object-cover border border-gray-200" />
                    ))}
                    {finishData.photos.length < 4 && (
                       <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all text-gray-400 hover:text-green-600">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[8px] font-black uppercase">Add Foto</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFinishPhotoUpload} />
                       </label>
                    )}
                 </div>
               </div>

               <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-[1.8rem] font-black shadow-xl shadow-green-100 active:scale-95 transition-all text-lg mt-4 flex items-center justify-center gap-2">
                 <CheckSquare className="w-5 h-5" /> Concluir e Fechar
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTicket && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter text-[var(--theme-text)]">Reagendar</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Defina nova data e motivo</p>
              </div>
              <button onClick={() => setRescheduleTicket(null)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleConfirmReschedule} className="space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Data <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" 
                    value={rescheduleData.date} 
                    onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} 
                    required 
                  />
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Justificativa <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-medium outline-none focus:border-purple-500 transition-all h-32 resize-none" 
                    placeholder="Explique o motivo do reagendamento..."
                    value={rescheduleData.reason} 
                    onChange={e => setRescheduleData({...rescheduleData, reason: e.target.value})} 
                    required 
                  />
               </div>

               <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-lg mt-4">
                 Confirmar Reagendamento
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingTicket && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black text-[var(--theme-text)] mb-2">Avaliar Atendimento</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Como foi o serviço para o chamado {ratingTicket.id}?</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setRatingValue(star)}
                    onClick={() => setRatingValue(star)}
                    className="transition-transform hover:scale-125"
                  >
                    <Star 
                      className={`w-10 h-10 ${star <= ratingValue ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 fill-gray-100'}`} 
                    />
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={handleRateTicket}
                   disabled={ratingValue === 0}
                   className="w-full bg-[var(--theme-primary)] disabled:bg-gray-300 text-white py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95"
                 >
                   Enviar Avaliação
                 </button>
                 <button 
                   onClick={() => setRatingTicket(null)}
                   className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black"
                 >
                   Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTicketConfirmation && (
        <div className="fixed inset-0 z-[3200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-[var(--theme-text)] mb-2">Excluir Chamado?</h3>
            <p className="text-gray-500 text-sm mb-8">
              Tem certeza que deseja remover o chamado <span className="font-bold text-[var(--theme-text)]">{deleteTicketConfirmation.id}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteTicketConfirm} 
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 active:scale-95 transition-all"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={() => setDeleteTicketConfirmation(null)} 
                className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};

export default HomePage;
