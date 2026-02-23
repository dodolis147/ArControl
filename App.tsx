
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  Thermometer, 
  LogOut, 
  FileBarChart, 
  Users as UsersIcon, 
  Plus, 
  Scan,
  Settings
} from 'lucide-react';
import { ACUnit, User, UserRole, UserStatus, MaintenanceRecord, Ticket, ServiceType, UnitStatus } from './types';
import { supabase } from './services/supabase';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import UnitDetailsPage from './pages/UnitDetailsPage';
import ReportsPage from './pages/ReportsPage';
import UsersManagementPage from './pages/UsersManagementPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';

// Components
import PrintQRCodeModal from './components/PrintQRCodeModal';

const App: React.FC = () => {
  // Inicializa estados vazios, o useEffect irá popular com dados do Supabase
  const [units, setUnits] = useState<ACUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(() => {
    // Mantemos a sessão do usuário no localStorage para persistência de reload simples
    const saved = localStorage.getItem('arcontrol_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [qrModalState, setQrModalState] = useState<{ isOpen: boolean, unit: ACUnit | null, all: boolean }>({ 
    isOpen: false, 
    unit: null, 
    all: false 
  });

  const audioIntervalRef = useRef<number | null>(null);

  // --- Data Mapping Functions (DB SnakeCase <-> App CamelCase) ---

  const mapUserFromDB = (u: any): User => ({
    id: u.id,
    username: u.username,
    password: u.password,
    email: u.email,
    phone: u.phone,
    role: u.role as UserRole,
    clientName: u.client_name,
    status: u.status as UserStatus
  });

  const mapUnitFromDB = (u: any): ACUnit => ({
    id: u.id,
    clientName: u.client_name,
    department: u.department || '',
    brand: u.brand,
    model: u.model || '',
    serialNumber: u.serial_number,
    btu: u.btu,
    location: u.location,
    regional: u.regional,
    installDate: u.install_date,
    status: u.status as UnitStatus,
    unitPhotos: u.unit_photos || [],
    history: (u.history || []).map((h: any) => mapMaintenanceFromDB(h)),
    planned: (u.planned || []).map((p: any) => ({
      id: p.id,
      type: p.type as ServiceType,
      description: p.description,
      expectedDate: p.expected_date
    }))
  });

  const mapMaintenanceFromDB = (r: any): MaintenanceRecord => ({
    id: r.id,
    type: r.type as ServiceType,
    technician: r.technician,
    description: r.description,
    date: r.date,
    time: r.time,
    photos: r.photos || [],
    rating: r.rating,
    technicalReport: r.technical_report,
    documents: r.documents || []
  });

  const mapTicketFromDB = (t: any): Ticket => ({
    id: t.id,
    unitId: t.unit_id,
    clientName: t.client_name,
    description: t.description,
    date: t.date,
    status: t.status,
    priority: t.priority,
    technicianId: t.technician_id,
    rating: t.rating,
    feedback: t.feedback,
    rescheduleReason: t.reschedule_reason,
    solution: t.solution,
    technicalReport: t.technical_report,
    photos: t.photos || [],
    documents: t.documents || []
  });

  // --- Fetch Data ---

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (usersError) throw usersError;
      setUsers(usersData.map(mapUserFromDB));

      // 2. Fetch Units (with History and Planned relations)
      // Note: We use the join syntax. Assuming foreign keys are set up correctly in SQL.
      const { data: unitsData, error: unitsError } = await supabase
        .from('ac_units')
        .select(`
          *,
          history:maintenance_records(*),
          planned:planned_maintenance(*)
        `);
      
      if (unitsError) throw unitsError;
      // Sort history inside map function if needed, usually better to order by date in SQL but here we map first
      const mappedUnits = unitsData.map(mapUnitFromDB).map(u => ({
        ...u,
        history: u.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));
      setUnits(mappedUnits);

      // 3. Fetch Tickets
      const { data: ticketsData, error: ticketsError } = await supabase.from('tickets').select('*');
      if (ticketsError) throw ticketsError;
      // Sort tickets: Open/Urgent first logic is in HomePage, here just raw data
      setActiveTickets(ticketsData.map(mapTicketFromDB).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
      // Fallback or Alert could go here
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Audio Notification Logic ---

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, volume: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, start);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, start + 1.5);

        gainNode.gain.setValueAtTime(volume, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + 1.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(start);
        oscillator.stop(start + 1.5);
      };

      const now = audioContext.currentTime;
      playTone(987.77, now, 0.1); // B5
      playTone(1318.51, now + 0.1, 0.08); // E6
      
    } catch (e) {
      console.warn("Alerta sonoro falhou (interação do usuário necessária):", e);
    }
  }, []);

  useEffect(() => {
    const hasOpenTickets = activeTickets.some(t => t.status === 'Aberto');
    
    if (hasOpenTickets && authUser && authUser.role === UserRole.ADMIN) {
      if (!audioIntervalRef.current) {
        playNotificationSound();
        audioIntervalRef.current = window.setInterval(() => {
          playNotificationSound();
        }, 10000);
      }
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [activeTickets, authUser, playNotificationSound]);

  // --- Auth Handlers ---

  const handleLoginSuccess = async (user: User) => {
    // Validar credenciais no Supabase (extra security check)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', user.username)
      .eq('password', user.password) // Nota: Em produção, usaríamos hash e Supabase Auth real
      .single();
    
    if (data && !error) {
        const loggedUser = mapUserFromDB(data);
        if (loggedUser.status === UserStatus.BLOCKED) {
            alert("Usuário bloqueado.");
            return;
        }
        setAuthUser(loggedUser);
        localStorage.setItem('arcontrol_user', JSON.stringify(loggedUser));
        fetchData(); // Recarregar dados ao logar
    } else {
        alert("Falha na autenticação.");
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('arcontrol_user');
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  // --- Data Manipulation Handlers (CRUD) ---

  const handleAddUnit = async (unit: ACUnit) => {
    try {
      const dbUnit = {
        id: unit.id,
        client_name: unit.clientName,
        department: unit.department,
        brand: unit.brand,
        model: unit.model,
        serial_number: unit.serialNumber,
        btu: unit.btu,
        location: unit.location,
        regional: unit.regional,
        install_date: unit.installDate,
        status: unit.status,
        unit_photos: unit.unitPhotos
      };
      
      const { error } = await supabase.from('ac_units').insert(dbUnit);
      if (error) throw error;
      
      // Se houver histórico inicial (raro na criação), salvar também
      // Para este app, assume-se que unidades novas vêm sem histórico
      
      setUnits(prev => [unit, ...prev]);
    } catch (e) {
      console.error("Erro ao adicionar unidade:", e);
      alert("Erro ao salvar equipamento no banco de dados.");
    }
  };

  const handleUpdateUnit = async (id: string, data: Partial<ACUnit>) => {
    try {
      const dbUpdate: any = {};
      if (data.clientName) dbUpdate.client_name = data.clientName;
      if (data.department !== undefined) dbUpdate.department = data.department;
      if (data.brand) dbUpdate.brand = data.brand;
      if (data.model !== undefined) dbUpdate.model = data.model;
      if (data.serialNumber) dbUpdate.serial_number = data.serialNumber;
      if (data.btu) dbUpdate.btu = data.btu;
      if (data.location) dbUpdate.location = data.location;
      if (data.regional) dbUpdate.regional = data.regional;
      if (data.installDate) dbUpdate.install_date = data.installDate;
      if (data.status) dbUpdate.status = data.status;
      if (data.unitPhotos) dbUpdate.unit_photos = data.unitPhotos;

      const { error } = await supabase.from('ac_units').update(dbUpdate).eq('id', id);
      if (error) throw error;

      setUnits(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    } catch (e) {
      console.error("Erro ao atualizar unidade:", e);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      const { error } = await supabase.from('ac_units').delete().eq('id', id);
      if (error) throw error;
      setUnits(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      console.error("Erro ao deletar unidade:", e);
    }
  };
  
  const handleAddUser = async (user: User) => {
    try {
      const dbUser = {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        phone: user.phone,
        role: user.role,
        client_name: user.clientName,
        status: user.status
      };
      const { error } = await supabase.from('users').insert(dbUser);
      if (error) throw error;
      setUsers(prev => [...prev, user]);
    } catch (e) {
      console.error("Erro ao criar usuário:", e);
      alert("Erro ao criar usuário. Verifique se o username já existe.");
    }
  };

  const handleUpdateUser = async (id: string, data: Partial<User>) => {
    try {
      const dbUpdate: any = {};
      if (data.username) dbUpdate.username = data.username;
      if (data.password) dbUpdate.password = data.password;
      if (data.email) dbUpdate.email = data.email;
      if (data.phone) dbUpdate.phone = data.phone;
      if (data.role) dbUpdate.role = data.role;
      if (data.clientName !== undefined) dbUpdate.client_name = data.clientName;
      if (data.status) dbUpdate.status = data.status;

      const { error } = await supabase.from('users').update(dbUpdate).eq('id', id);
      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    } catch (e) {
      console.error("Erro ao atualizar usuário:", e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      console.error("Erro ao deletar usuário:", e);
    }
  };

  const handleAddMaintenance = async (unitId: string, record: MaintenanceRecord) => {
    try {
      const dbRecord = {
        id: record.id,
        unit_id: unitId,
        type: record.type,
        technician: record.technician,
        description: record.description,
        date: record.date,
        time: record.time,
        photos: record.photos,
        rating: record.rating,
        technical_report: record.technicalReport,
        documents: record.documents
      };

      const { error } = await supabase.from('maintenance_records').insert(dbRecord);
      if (error) throw error;
      
      // Update local state to reflect change immediately
      setUnits(prev => prev.map(u => u.id === unitId ? { 
        ...u, 
        history: [record, ...u.history], 
        status: UnitStatus.OPERATIONAL // Automaticamente volta para operacional após manutenção
      } : u));

      // Also update unit status in DB
      await supabase.from('ac_units').update({ status: 'Operacional' }).eq('id', unitId);

    } catch (e) {
      console.error("Erro ao adicionar manutenção:", e);
    }
  };

  const handleAddPlannedMaintenance = async (unitId: string, planned: any) => {
    try {
      const dbPlanned = {
        id: planned.id,
        unit_id: unitId,
        type: planned.type,
        description: planned.description,
        expected_date: planned.expectedDate
      };

      const { error } = await supabase.from('planned_maintenance').insert(dbPlanned);
      if (error) throw error;

      setUnits(prev => prev.map(u => u.id === unitId ? {
        ...u,
        planned: [...u.planned, planned]
      } : u));
    } catch (e) {
      console.error("Erro ao adicionar manutenção planejada:", e);
    }
  };

  const handleRateMaintenance = async (unitId: string, recordId: string, rating: number) => {
    try {
      const { error } = await supabase.from('maintenance_records').update({ rating }).eq('id', recordId);
      if (error) throw error;

      setUnits(prev => prev.map(u => {
        if (u.id === unitId) {
          return {
            ...u,
            history: u.history.map(r => r.id === recordId ? { ...r, rating } : r)
          };
        }
        return u;
      }));
    } catch (e) {
      console.error("Erro ao avaliar manutenção:", e);
    }
  };

  const handleAddTicket = async (ticket: Ticket) => {
    try {
      const dbTicket = {
        id: ticket.id,
        unit_id: ticket.unitId,
        client_name: ticket.clientName,
        description: ticket.description,
        date: ticket.date,
        status: ticket.status,
        priority: ticket.priority,
        technician_id: ticket.technicianId
      };
      
      const { error } = await supabase.from('tickets').insert(dbTicket);
      if (error) throw error;

      setActiveTickets(prev => [ticket, ...prev]);
    } catch (e) {
      console.error("Erro ao criar chamado:", e);
    }
  };

  const handleUpdateTicket = async (id: string, data: Partial<Ticket>) => {
    try {
      const dbUpdate: any = {};
      if (data.status) dbUpdate.status = data.status;
      if (data.technicianId) dbUpdate.technician_id = data.technicianId;
      if (data.rescheduleReason) dbUpdate.reschedule_reason = data.rescheduleReason;
      if (data.date) dbUpdate.date = data.date;
      if (data.rating) dbUpdate.rating = data.rating;
      if (data.solution) dbUpdate.solution = data.solution;
      if (data.technicalReport) dbUpdate.technical_report = data.technicalReport;
      if (data.photos) dbUpdate.photos = data.photos;
      if (data.documents) dbUpdate.documents = data.documents;

      const { error } = await supabase.from('tickets').update(dbUpdate).eq('id', id);
      if (error) throw error;

      setActiveTickets(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    } catch (e) {
      console.error("Erro ao atualizar chamado:", e);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      setActiveTickets(prev => prev.filter(t => t.id !== id));
    } catch (e) {
       console.error("Erro ao deletar chamado:", e);
    }
  };

  const isPublicView = window.location.hash.includes('/public/');

  // Componente de loading interno para usar dentro do ThemeProvider
  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--theme-primary)]"></div>
    </div>
  );

  if (!authUser && !isPublicView) {
    // Wrap login in ThemeProvider too to allow dynamic colors there
    return (
        <ThemeProvider>
            <LoginPage users={users} onLoginSuccess={handleLoginSuccess} />
        </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
        {isLoading && !isPublicView && authUser ? <LoadingScreen /> : (
            <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col pb-24 lg:pb-0 lg:pl-20">
                
                {!isPublicView && authUser && (
                <nav className="bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50 border-b border-gray-100 flex justify-between items-center lg:hidden no-print">
                    <div className="flex items-center gap-2">
                    {/* Updated to use dynamic primary color */}
                    <div className="p-2 rounded-xl bg-[var(--theme-primary)]">
                        <Thermometer className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tighter text-[var(--theme-text)] italic">ArControl</span>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-all p-2 bg-gray-50 rounded-xl">
                    <LogOut className="w-5 h-5" />
                    </button>
                </nav>
                )}

                {!isPublicView && authUser && (
                <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-100 flex-col items-center py-8 z-50 no-print">
                    {/* Updated to use dynamic primary color and shadow */}
                    <div className="p-3 rounded-2xl mb-12 shadow-lg bg-[var(--theme-primary)] shadow-[var(--theme-primary-light)]">
                        <Thermometer className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 flex flex-col gap-8">
                    {/* Updated hover states to dynamic primary */}
                    <Link to="/" title="Início" className="p-3 rounded-2xl hover:bg-[var(--theme-primary-light)] text-gray-400 hover:text-[var(--theme-primary)] transition-all">
                        <Thermometer className="w-6 h-6" />
                    </Link>
                    <Link to="/reports" title="Relatórios" className="p-3 rounded-2xl hover:bg-[var(--theme-primary-light)] text-gray-400 hover:text-[var(--theme-primary)] transition-all">
                        <FileBarChart className="w-6 h-6" />
                    </Link>
                    {authUser.role === UserRole.ADMIN && (
                        <>
                        <Link to="/register" title="Novo Equipamento" className="p-3 rounded-2xl hover:bg-[var(--theme-primary-light)] text-gray-400 hover:text-[var(--theme-primary)] transition-all">
                            <Plus className="w-6 h-6" />
                        </Link>
                        <Link to="/users" title="Usuários" className="p-3 rounded-2xl hover:bg-[var(--theme-primary-light)] text-gray-400 hover:text-[var(--theme-primary)] transition-all">
                            <UsersIcon className="w-6 h-6" />
                        </Link>
                        <Link to="/settings" title="Configurações" className="p-3 rounded-2xl hover:bg-[var(--theme-primary-light)] text-gray-400 hover:text-[var(--theme-primary)] transition-all">
                            <Settings className="w-6 h-6" />
                        </Link>
                        </>
                    )}
                    </div>
                    <button onClick={handleLogout} className="p-3 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all">
                    <LogOut className="w-6 h-6" />
                    </button>
                </aside>
                )}

                <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 relative">
                <Routes>
                    <Route path="/public/unit/:id" element={<UnitDetailsPage units={units} user={null} isPublic={true} onUpdateUnit={() => {}} onDeleteUnit={() => {}} onOpenQR={(u) => setQrModalState({ isOpen: true, unit: u, all: false })} onAddMaintenance={() => {}} onRateMaintenance={handleRateMaintenance} />} />
                    <Route path="/" element={<HomePage units={units} user={authUser!} tickets={activeTickets} users={users} onOpenQR={(u) => setQrModalState({ isOpen: true, unit: u, all: false })} onOpenAllQR={() => setQrModalState({ isOpen: true, unit: null, all: true })} onAddTicket={handleAddTicket} onUpdateTicket={handleUpdateTicket} onDeleteTicket={handleDeleteTicket} onAddUnit={handleAddUnit} onUpdateUnit={handleUpdateUnit} onAddPlannedMaintenance={handleAddPlannedMaintenance} />} />
                    <Route path="/unit/:id" element={<UnitDetailsPage units={units} user={authUser} onUpdateUnit={handleUpdateUnit} onDeleteUnit={handleDeleteUnit} onOpenQR={(u) => setQrModalState({ isOpen: true, unit: u, all: false })} onAddMaintenance={handleAddMaintenance} onRateMaintenance={handleRateMaintenance} />} />
                    <Route path="/reports" element={<ReportsPage units={units} user={authUser!} />} />
                    <Route path="/users" element={authUser?.role === UserRole.ADMIN ? <UsersManagementPage users={users} currentUser={authUser} onAdd={handleAddUser} onDelete={handleDeleteUser} onUpdate={handleUpdateUser} /> : <Navigate to="/" />} />
                    <Route path="/register" element={authUser?.role === UserRole.ADMIN ? <RegisterPage onAdd={handleAddUnit} /> : <Navigate to="/" />} />
                    <Route path="/settings" element={authUser?.role === UserRole.ADMIN ? <SettingsPage /> : <Navigate to="/" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </main>

                {!isPublicView && authUser && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center py-4 z-50 no-print">
                    <Link to="/" className="flex flex-col items-center">
                    <Thermometer className="w-6 h-6 text-[var(--theme-primary)]" />
                    <span className="text-[9px] font-black mt-1 uppercase text-[var(--theme-primary)] tracking-tighter">Início</span>
                    </Link>
                    <Link to="/reports" className="flex flex-col items-center">
                    <FileBarChart className="w-6 h-6 text-gray-300" />
                    <span className="text-[9px] font-black mt-1 uppercase text-gray-400 tracking-tighter">Relatórios</span>
                    </Link>
                    {authUser.role === UserRole.ADMIN && (
                    <Link to="/register" className="p-3 rounded-2xl shadow-lg -mt-8 border-4 border-gray-50 bg-[var(--theme-primary)]">
                        <Plus className="w-6 h-6 text-white" />
                    </Link>
                    )}
                    {authUser.role === UserRole.ADMIN ? (
                    <Link to="/settings" className="flex flex-col items-center">
                        <Settings className="w-6 h-6 text-gray-300" />
                        <span className="text-[9px] font-black mt-1 uppercase text-gray-400 tracking-tighter">Config</span>
                    </Link>
                    ) : (
                    <div className="w-12 h-6"></div>
                    )}
                    <button onClick={handleLogout} className="flex flex-col items-center">
                    <LogOut className="w-6 h-6 text-gray-300" />
                    <span className="text-[9px] font-black mt-1 uppercase text-gray-400 tracking-tighter">Sair</span>
                    </button>
                </div>
                )}

                <PrintQRCodeModal 
                isOpen={qrModalState.isOpen} 
                onClose={() => setQrModalState(s => ({ ...s, isOpen: false }))} 
                unit={qrModalState.unit} 
                allUnits={qrModalState.all ? units : []} 
                />
            </div>
            </Router>
        )}
    </ThemeProvider>
  );
};

export default App;
