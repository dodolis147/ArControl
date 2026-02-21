
import React, { useState } from 'react';
import { 
  Users as UsersIcon, 
  Plus, 
  ShieldCheck, 
  User as UserIcon, 
  Pencil, 
  Ban, 
  UserCheck, 
  Trash2, 
  X,
  Building2,
  Lock,
  Wrench
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';

interface UsersManagementPageProps {
  users: User[];
  currentUser: User;
  onAdd: (u: User) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<User>) => void;
}

const UsersManagementPage: React.FC<UsersManagementPageProps> = ({ users, currentUser, onAdd, onDelete, onUpdate }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ 
    username: '', 
    password: '', 
    email: '', 
    phone: '', 
    role: UserRole.CLIENT, 
    clientName: '' 
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      username: newUser.username!,
      password: newUser.password!,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role!,
      clientName: newUser.clientName || null,
      status: UserStatus.ACTIVE
    });
    setNewUser({ username: '', password: '', email: '', phone: '', role: UserRole.CLIENT, clientName: '' });
    setShowAdd(false);
  };

  const handleDelete = () => {
    if (deleteConfirmation) {
      onDelete(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <ShieldCheck className="w-6 h-6" />;
      case UserRole.TECHNICIAN: return <Wrench className="w-6 h-6" />;
      default: return <UserIcon className="w-6 h-6" />;
    }
  };

  const getRoleColor = (role: UserRole, isBlocked: boolean) => {
    if (isBlocked) return 'bg-gray-200 text-gray-400';
    switch (role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-600'; // Mantido roxo para admin, já era coerente
      case UserRole.TECHNICIAN: return 'bg-orange-100 text-orange-600';
      // Alterado de blue-100/600 para purple-100/700 para manter consistência
      default: return 'bg-purple-100 text-purple-700'; 
    }
  };

  return (
    <div className="pb-24 space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Alterado bg-blue-600 para bg-purple-700 */}
          <div className="bg-purple-700 p-4 rounded-3xl shadow-xl shadow-purple-200">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">Usuários</h1>
            <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Controle de Acessos e Equipes</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <div className="grid gap-4">
        {users.map(u => {
          const isMe = u.id === currentUser.id;
          return (
            // Alterado hover:border-blue-400 para hover:border-purple-400
            <div key={u.id} className={`bg-white p-6 rounded-[2.2rem] border-2 shadow-sm flex items-center justify-between group transition-all ${u.status === UserStatus.BLOCKED ? 'border-red-50 bg-gray-50/50' : 'border-gray-100 hover:border-purple-400'}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${getRoleColor(u.role, u.status === UserStatus.BLOCKED)}`}>
                  {getRoleIcon(u.role)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black leading-tight text-lg ${u.status === UserStatus.BLOCKED ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{u.username}</h3>
                    {u.status === UserStatus.BLOCKED && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Lock className="w-2 h-2" /> Bloqueado
                      </span>
                    )}
                    {isMe && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[8px] font-black uppercase tracking-widest">Você</span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate flex items-center gap-1.5">
                    {u.role} {u.clientName && <>• <Building2 className="w-3 h-3 inline" /> {u.clientName}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditUser(u)}
                  // Alterado bg-blue-50 text-blue-600 para bg-purple-50 text-purple-700
                  className="p-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-700 hover:text-white transition-all active:scale-90"
                  title="Editar Usuário"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                
                {!isMe && (
                  <>
                    <button 
                      onClick={() => onUpdate(u.id, { status: u.status === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED })}
                      className={`p-3 rounded-xl transition-all active:scale-90 ${u.status === UserStatus.BLOCKED ? 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-orange-50 text-orange-400 hover:bg-orange-500 hover:text-white'}`}
                      title={u.status === UserStatus.BLOCKED ? "Ativar Usuário" : "Bloquear Usuário"}
                    >
                      {u.status === UserStatus.BLOCKED ? <UserCheck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmation(u)} 
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter">Novo Usuário</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username <span className="text-red-500">*</span></label>
                {/* Alterado focus:border-blue-500 para focus:border-purple-500 */}
                <input type="text" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha <span className="text-red-500">*</span></label>
                <input type="password" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Acesso <span className="text-red-500">*</span></label>
                <select className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} required>
                  <option value={UserRole.ADMIN}>ADMIN (Gestor)</option>
                  <option value={UserRole.TECHNICIAN}>TÉCNICO (Operacional)</option>
                  <option value={UserRole.CLIENT}>CLIENTE (Solicitante)</option>
                </select>
              </div>
              {newUser.role === UserRole.CLIENT && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Cliente <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={newUser.clientName} onChange={e => setNewUser({...newUser, clientName: e.target.value})} required />
                </div>
              )}
              {/* Alterado bg-blue-600 para bg-purple-700 */}
              <button type="submit" className="w-full bg-purple-700 text-white py-5 rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-lg mt-4">Criar Usuário</button>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter">Editar Usuário</h2>
              <button onClick={() => setEditUser(null)} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onUpdate(editUser.id, editUser); setEditUser(null); }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username <span className="text-red-500">*</span></label>
                {/* Alterado focus:border-blue-500 para focus:border-purple-500 */}
                <input type="text" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={editUser.username} onChange={e => setEditUser({...editUser, username: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Acesso <span className="text-red-500">*</span></label>
                <select className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value as any})} required>
                  <option value={UserRole.ADMIN}>ADMIN (Gestor)</option>
                  <option value={UserRole.TECHNICIAN}>TÉCNICO (Operacional)</option>
                  <option value={UserRole.CLIENT}>CLIENTE (Solicitante)</option>
                </select>
              </div>
              {editUser.role === UserRole.CLIENT && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Cliente / Empresa <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={editUser.clientName || ''} onChange={e => setEditUser({...editUser, clientName: e.target.value})} required />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha (opcional)</label>
                <input type="password" placeholder="Em branco para manter" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl font-bold outline-none focus:border-purple-500 transition-all" value={editUser.password || ''} onChange={e => setEditUser({...editUser, password: e.target.value})} />
              </div>
              {/* Alterado bg-blue-600 para bg-purple-700 */}
              <button type="submit" className="w-full bg-purple-700 text-white py-5 rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-lg mt-4">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Excluir Usuário?</h3>
            <p className="text-gray-500 text-sm mb-8">
              Tem certeza que deseja remover <span className="font-bold text-gray-900">{deleteConfirmation.username}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete} 
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 active:scale-95 transition-all"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={() => setDeleteConfirmation(null)} 
                className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;
