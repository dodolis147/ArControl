import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Upload, Trash2, Thermometer } from 'lucide-react';
import { ACUnit, UnitStatus } from '../types';
import Button from '../components/Button';

interface RegisterPageProps {
  onAdd: (unit: ACUnit) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onAdd }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    clientName: '', 
    brand: '', 
    serialNumber: '', 
    btu: '', 
    location: '', 
    regional: '', 
    installDate: new Date().toISOString().split('T')[0] 
  });
  const [unitPhotos, setUnitPhotos] = useState<string[]>([]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file as Blob);
      });
    });

    const base64s = await Promise.all(readers);
    setUnitPhotos(prev => [...prev, ...base64s]);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUnit: ACUnit = { 
      id: `AC-${Math.floor(Math.random() * 9000) + 1000}`, 
      ...formData, 
      department: '', 
      model: '', 
      btu: parseInt(formData.btu) || 0, 
      status: UnitStatus.OPERATIONAL, 
      history: [], 
      planned: [], 
      unitPhotos: unitPhotos.length > 0 ? unitPhotos : undefined 
    };
    onAdd(newUnit); 
    navigate(`/unit/${newUnit.id}`);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <div className="mb-8 flex items-center">
        <button onClick={() => navigate('/')} className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl mr-4 hover:bg-gray-50 transition-all active:scale-95">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic">Novo Equipamento</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Cadastro Técnico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-gray-200 shadow-xl space-y-10">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Fotos de Referência</label>
            <div className="grid grid-cols-4 gap-3">
              {unitPhotos.map((p, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden relative border-2 border-white shadow-sm">
                  <img src={p} className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => { e.preventDefault(); setUnitPhotos(prev => prev.filter((_, i) => i !== idx)); }} 
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg shadow-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {unitPhotos.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 transition-all shadow-sm">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[8px] font-black uppercase text-gray-400">Add Foto</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {[
              { label: 'Responsável (Cliente)', key: 'clientName', placeholder: 'Empresa ou Nome Fantasia', required: true },
              { label: 'Marca', key: 'brand', placeholder: 'Samsung, LG, Carrier, York...', required: true },
              { label: 'Nº de Série', key: 'serialNumber', placeholder: 'Código de série do fabricante (Opcional)', required: false },
              { label: 'Capacidade (BTUs)', key: 'btu', placeholder: 'Ex: 12000', type: 'number', required: true },
              { label: 'Regional / Cidade', key: 'regional', placeholder: 'Ex: Salvador / México', required: true },
              { label: 'Localização Detalhada', key: 'location', placeholder: 'Ex: Sala 202, 2º Andar', required: true },
              { label: 'Data de Instalação', key: 'installDate', type: 'date', required: true }
            ].map(field => (
              <div key={field.key} className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type={field.type || 'text'} 
                  placeholder={field.placeholder} 
                  className="w-full px-6 py-4.5 bg-white border-2 border-gray-100 rounded-2xl outline-none font-bold text-black focus:border-purple-600 transition-all shadow-sm" 
                  value={(formData as any)[field.key]} 
                  onChange={e => setFormData({...formData, [field.key]: e.target.value})} 
                  required={field.required}
                />
              </div>
            ))}
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 rounded-[2rem] text-xl shadow-2xl shadow-purple-200 mt-4"
            icon={<Save className="w-7 h-7" />}
          >
            Concluir Cadastro
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;