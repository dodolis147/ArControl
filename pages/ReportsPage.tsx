
import React, { useState, useMemo } from 'react';
import { 
  FileBarChart, 
  Filter, 
  FileDown, 
  Thermometer, 
  BarChart3, 
  ChevronRight,
  Star
} from 'lucide-react';
import { ACUnit, User, UserRole, MaintenanceRecord, ServiceType } from '../types';

interface ReportsPageProps {
  units: ACUnit[];
  user: User;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ units, user }) => {
  const [selectedClient, setSelectedClient] = useState<string>(user.role === UserRole.CLIENT ? (user.clientName || '') : '');
  const [selectedType, setSelectedType] = useState<string>('');

  const clients = useMemo(() => Array.from(new Set(units.map(u => u.clientName))), [units]);
  
  const filteredUnits = useMemo(() => {
    let result = units;
    if (user.role === UserRole.CLIENT) {
        result = result.filter(u => u.clientName === user.clientName);
    } else if (selectedClient) {
        result = result.filter(u => u.clientName === selectedClient);
    }
    return result;
  }, [units, selectedClient, user]);

  const allRecords = useMemo(() => {
    const list: { unit: ACUnit, record: MaintenanceRecord }[] = [];
    filteredUnits.forEach(u => {
      u.history.forEach(r => {
        if (!selectedType || r.type === selectedType) {
          list.push({ unit: u, record: r });
        }
      });
    });
    return list.sort((a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime());
  }, [filteredUnits, selectedType]);

  const stats = useMemo(() => {
    const ratedRecords = allRecords.filter(r => r.record.rating && r.record.rating > 0);
    const avgRating = ratedRecords.length > 0 
      ? (ratedRecords.reduce((acc, r) => acc + (r.record.rating || 0), 0) / ratedRecords.length).toFixed(1)
      : '0.0';

    return {
      total: allRecords.length,
      preventive: allRecords.filter(r => r.record.type === ServiceType.PREVENTIVE).length,
      corrective: allRecords.filter(r => r.record.type === ServiceType.CORRECTIVE).length,
      cleaning: allRecords.filter(r => r.record.type === ServiceType.CLEANING).length,
      avgRating
    };
  }, [allRecords]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 no-print">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Alterado bg-blue-600 para bg-purple-700 */}
          <div className="bg-purple-700 p-4 rounded-3xl shadow-xl shadow-purple-200">
            <FileBarChart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">Relatórios</h1>
            <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Análise de Performance</p>
          </div>
        </div>
        <button onClick={handlePrint} className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          <span className="hidden sm:inline font-black text-xs uppercase tracking-widest">PDF</span>
        </button>
      </header>

      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
        <div className="flex items-center gap-2 px-1">
          {/* Alterado text-blue-500 para text-purple-600 */}
          <Filter className="w-4 h-4 text-purple-600" />
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtros Avançados</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user.role === UserRole.ADMIN && (
            <select 
              // Alterado focus:border-blue-500 para focus:border-purple-500
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-black focus:border-purple-500 transition-all outline-none" 
              value={selectedClient} 
              onChange={e => setSelectedClient(e.target.value)}
            >
              <option value="">Todos os Clientes</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select 
            // Alterado focus:border-blue-500 para focus:border-purple-500
            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-black focus:border-purple-500 transition-all outline-none" 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          // Alterado para roxo
          { label: 'Total', value: stats.total, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Preventivas', value: stats.preventive, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Corretivas', value: stats.corrective, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Limpezas', value: stats.cleaning, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Satisfação', value: `${stats.avgRating}/5`, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: true },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center ${stat.bg}`}>
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-center gap-2">
                {stat.icon && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
           <BarChart3 className="w-5 h-5 text-gray-400" />
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logs de Manutenção</span>
        </div>
        <div className="divide-y divide-gray-50">
          {allRecords.length > 0 ? allRecords.map((item, idx) => (
            <div key={idx} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                {/* Alterado bg-blue-50/600 para purple e text para roxo */}
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-all">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                   <p className="font-black text-gray-900 leading-tight mb-1">{item.unit.id} • {item.record.type}</p>
                   <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.record.date} • {item.record.technician.toUpperCase()}</p>
                      {item.record.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-600">{item.record.rating}</span>
                        </div>
                      )}
                   </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200" />
            </div>
          )) : (
            <div className="p-20 text-center">
              <p className="text-gray-300 font-black uppercase text-xs tracking-[0.3em]">Nenhum dado para exibir</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden view for browser printing */}
      <div id="report-printable-area" className="hidden p-10 bg-white text-black font-sans print:block">
        <header className="flex justify-between items-center border-b-4 border-purple-700 pb-6 mb-8">
          <div>
            {/* Alterado para roxo */}
            <h1 className="text-4xl font-black text-purple-800 italic tracking-tighter">ArControl</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Relatório Analítico de Manutenção</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-600">Gerado: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </header>
        <div className="mb-10 p-6 bg-gray-50 border border-gray-200 rounded-2xl grid grid-cols-3 gap-10">
           <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Cliente</p><p className="font-bold">{selectedClient || 'Relatório Global'}</p></div>
           <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Satisfação Média</p><p className="font-bold text-yellow-600">{stats.avgRating} Estrelas</p></div>
           <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Volume</p><p className="font-bold">{stats.total} Atendimentos</p></div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            {/* Alterado bg-blue-600 para bg-purple-700 */}
            <tr className="bg-purple-700 text-white text-left text-[9px] font-black uppercase">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Equipamento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3">Avaliação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-[11px]">
            {allRecords.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-4 font-bold">{r.record.date}</td>
                <td className="px-4 py-4 font-black">{r.unit.id}</td>
                {/* Alterado text-blue-700 para text-purple-700 */}
                <td className="px-4 py-4 text-purple-700 font-bold">{r.record.type}</td>
                <td className="px-4 py-4">{r.record.technician}</td>
                <td className="px-4 py-4 font-black text-yellow-600">{r.record.rating ? `${r.record.rating}/5` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;
