
import React, { useState } from 'react';
import { Thermometer, Lock, User as UserIcon } from 'lucide-react';
import { User, UserStatus } from '../types';
import Button from '../components/Button';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.status === UserStatus.BLOCKED) {
        setError('Acesso bloqueado. Contate o administrador.');
        setLoading(false);
        return;
      }
      onLoginSuccess(user);
    } else {
      setError('Usuário ou senha inválidos.');
      setLoading(false);
    }
  };

  return (
    // Dynamic background color
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--theme-secondary)] relative overflow-hidden transition-colors duration-500">
      {/* Dynamic gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[var(--theme-primary)]/50 via-transparent to-transparent"></div>
      
      <div className="bg-slate-50 w-full max-w-md p-10 rounded-[3rem] shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 relative z-10">
        <div className="text-center space-y-3">
          {/* Dynamic logo background */}
          <div className="bg-[var(--theme-primary)] w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-[var(--theme-primary-light)]">
            <Thermometer className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter text-[var(--theme-text)]">ArControl</h2>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">HVAC Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative">
              <input 
                type="text" 
                // Dynamic focus color
                className="w-full px-6 py-4.5 bg-white border-2 border-gray-100 rounded-2xl outline-none font-bold text-black focus:border-[var(--theme-primary)] transition-all pl-14 shadow-sm" 
                value={username} 
                onChange={e => { setUsername(e.target.value); setError(''); }} 
                required 
              />
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <input 
                type="password" 
                // Dynamic focus color
                className="w-full px-6 py-4.5 bg-white border-2 border-gray-100 rounded-2xl outline-none font-bold text-black focus:border-[var(--theme-primary)] transition-all pl-14 shadow-sm" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }} 
                required 
              />
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center animate-bounce">{error}</p>}
          
          <Button 
            type="submit" 
            isLoading={loading}
            className="w-full py-5 rounded-[2rem] text-lg shadow-2xl"
          >
            Entrar no Painel
          </Button>
        </form>

        <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">v2.6.0 Configurable Release</p>
      </div>
    </div>
  );
};

export default LoginPage;
