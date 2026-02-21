
import React, { useState } from 'react';
import { Palette, RefreshCw, Save, CheckCircle2, Layout, Smartphone, Type } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';

const SettingsPage: React.FC = () => {
  const { theme, updateTheme, resetTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [saved, setSaved] = useState(false);

  const handleColorChange = (key: keyof typeof theme, value: string) => {
    setLocalTheme(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateTheme(localTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetTheme();
    setLocalTheme({
        primary: '#7e22ce', 
        primaryLight: '#faf5ff', 
        secondary: '#581c87', 
        text: '#111827',
    });
    setSaved(false);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500 space-y-8">
      <header>
        <div className="flex items-center gap-4 mb-2">
          <div className="p-4 rounded-3xl shadow-xl shadow-gray-200 bg-white">
            <Palette className="w-8 h-8 text-[var(--theme-primary)]" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-[var(--theme-text)] leading-none">Configurações</h1>
            <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Personalização Visual</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8 h-fit">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-[var(--theme-text)] flex items-center gap-2">
              <Layout className="w-5 h-5 text-gray-400" /> Cores do Sistema
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor Primária (Marca)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <input 
                    type="color" 
                    value={localTheme.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-700">{localTheme.primary}</p>
                    <p className="text-[10px] text-gray-400">Botões, Ícones, Destaques</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor Secundária (Fundo Intenso)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <input 
                    type="color" 
                    value={localTheme.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-700">{localTheme.secondary}</p>
                    <p className="text-[10px] text-gray-400">Login, Cards de Destaque</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tom Claro (Fundos Suaves)</label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <input 
                    type="color" 
                    value={localTheme.primaryLight}
                    onChange={(e) => handleColorChange('primaryLight', e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-700">{localTheme.primaryLight}</p>
                    <p className="text-[10px] text-gray-400">Fundo de ícones, áreas secundárias</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Type className="w-3 h-3" /> Cor do Texto (Principal)
                </label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <input 
                    type="color" 
                    value={localTheme.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-700">{localTheme.text}</p>
                    <p className="text-[10px] text-gray-400">Títulos, Corpo do Texto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
            <Button 
              onClick={handleSave} 
              icon={saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              className="w-full py-5 rounded-2xl text-lg shadow-xl"
              style={{ 
                backgroundColor: saved ? '#16a34a' : localTheme.primary,
                boxShadow: `0 10px 25px -5px ${localTheme.primary}40`
              }}
            >
              {saved ? 'Configuração Salva!' : 'Aplicar Mudanças'}
            </Button>
            
            <button 
              onClick={handleReset}
              className="w-full py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Restaurar Padrão
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
           <h2 className="text-xl font-black text-[var(--theme-text)] flex items-center gap-2 px-2">
              <Smartphone className="w-5 h-5 text-gray-400" /> Pré-visualização
           </h2>
           
           <div className="border-[8px] border-gray-900 rounded-[3rem] overflow-hidden bg-gray-50 shadow-2xl relative h-[600px] pointer-events-none select-none">
              {/* Fake Mobile Header */}
              <div className="bg-white/80 backdrop-blur-md p-6 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: localTheme.primary }} className="p-2 rounded-xl">
                       <div className="w-4 h-4 bg-white rounded-full opacity-50" />
                    </div>
                    <span style={{ color: localTheme.text }} className="font-black italic">ArControl</span>
                 </div>
                 <div className="w-8 h-8 bg-gray-100 rounded-full" />
              </div>

              {/* Fake Content */}
              <div className="p-6 space-y-6">
                 {/* Stats Card */}
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                       <p style={{ color: localTheme.text }} className="text-2xl font-black">Operacional</p>
                    </div>
                    <div style={{ backgroundColor: localTheme.primaryLight, color: localTheme.primary }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
                       <Layout className="w-6 h-6" />
                    </div>
                 </div>

                 {/* Action Button */}
                 <div 
                    style={{ backgroundColor: localTheme.primary, boxShadow: `0 10px 20px -5px ${localTheme.primary}50` }} 
                    className="w-full py-4 rounded-2xl text-white font-black text-center shadow-lg"
                 >
                    Botão Principal
                 </div>

                 {/* Ticket Card */}
                 <div style={{ borderColor: localTheme.primary, backgroundColor: localTheme.primaryLight }} className="p-6 rounded-[2rem] border-2">
                    <div className="flex items-center gap-2 mb-2">
                       <span style={{ backgroundColor: localTheme.primary }} className="px-3 py-1 rounded-full text-white text-[9px] font-black uppercase">Média</span>
                    </div>
                    <h4 style={{ color: localTheme.text }} className="font-black text-lg mb-2">Manutenção Preventiva</h4>
                    <p style={{ color: localTheme.primary }} className="text-xs font-bold uppercase">Técnico Designado</p>
                 </div>
              </div>

              {/* Fake Mobile Nav */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex justify-around">
                 <div className="flex flex-col items-center gap-1">
                    <Layout style={{ color: localTheme.primary }} className="w-6 h-6" />
                    <div style={{ backgroundColor: localTheme.primary }} className="w-1 h-1 rounded-full" />
                 </div>
                 <div className="w-6 h-6 bg-gray-200 rounded-full" />
                 <div className="w-6 h-6 bg-gray-200 rounded-full" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
