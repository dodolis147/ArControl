
import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { ACUnit } from '../types';

interface PrintQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ACUnit | null;
  allUnits: ACUnit[];
}

const PrintQRCodeModal: React.FC<PrintQRCodeModalProps> = ({ isOpen, onClose, unit, allUnits }) => {
  if (!isOpen) return null;

  const unitsToPrint = unit ? [unit] : allUnits;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl my-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter">Identificadores QR Code</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Etiquetas para Identificação Física</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.print()} 
              // Alterado bg-blue-600 para bg-purple-700 e shadow
              className="px-6 py-3 bg-purple-700 text-white rounded-2xl font-black flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-purple-100"
            >
              <Printer className="w-5 h-5" /> Imprimir
            </button>
            <button onClick={onClose} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div id="qr-printable-area" className="grid grid-cols-1 sm:grid-cols-2 gap-10 p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
          {unitsToPrint.map(u => {
            const publicLink = `${window.location.origin}${window.location.pathname}#/public/unit/${u.id}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicLink)}`;
            return (
              <div key={u.id} className="bg-white p-10 rounded-[2.5rem] border-2 border-gray-200 flex flex-col items-center text-center gap-6 shadow-sm">
                {/* Alterado bg-blue-600 para bg-purple-700 */}
                <div className="bg-purple-700 p-2 rounded-xl mb-2">
                   <span className="text-white font-black text-xs tracking-tighter uppercase italic">ArControl</span>
                </div>
                <img src={qrUrl} alt="QR" className="w-44 h-44" />
                <div className="space-y-2 w-full">
                  {/* Alterado text-blue-600 para text-purple-700 */}
                  <p className="text-[11px] font-black text-purple-700 uppercase tracking-widest leading-tight">{u.clientName}</p>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{u.id}</h3>
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <p className="text-xs font-black text-gray-900 uppercase">{u.brand} - {u.btu} BTU</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight line-clamp-2">{u.location}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #qr-printable-area, #qr-printable-area * { visibility: visible; }
          #qr-printable-area { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            display: grid !important; 
            grid-template-cols: 1fr 1fr !important; 
            gap: 20px !important; 
            padding: 20px !important; 
            background: white !important;
            border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintQRCodeModal;
