
import React, { useRef } from 'react';
import { X, Download, FileText, Camera, Building2, Wrench, Calendar } from 'lucide-react';
import { Ticket, ACUnit, MaintenanceRecord } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PhotoReportModalProps {
  data: Ticket | MaintenanceRecord;
  unit?: ACUnit;
  onClose: () => void;
}

const PhotoReportModal: React.FC<PhotoReportModalProps> = ({ data, unit, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Type guards
  const isTicket = (d: Ticket | MaintenanceRecord): d is Ticket => 'status' in d;

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Relatorio_Fotografico_${data.id}.pdf`);
  };

  const solutionText = isTicket(data) ? (data.solution || data.description) : data.description;
  const technicianName = isTicket(data) ? data.technicianId : data.technician;
  const dateText = isTicket(data) 
    ? `${data.date.split('-').reverse().join('/')} ${data.finishedAt ? `às ${data.finishedAt}` : ''}`
    : `${data.date.split('-').reverse().join('/')} ${data.time ? `às ${data.time}` : ''}`;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-[2rem]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tighter text-gray-900">Relatório Fotográfico</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {data.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 bg-white text-gray-400 rounded-full hover:bg-gray-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100 no-scrollbar">
          <div 
            ref={reportRef} 
            className="bg-white p-12 shadow-sm mx-auto w-full max-w-[210mm] min-h-[297mm] text-gray-900 font-sans"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* PDF Header */}
            <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-indigo-600 italic mb-1">ArControl</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Gestão de Climatização</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black uppercase tracking-tighter">Relatório de Serviço</h3>
                <p className="text-sm font-bold text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                    <p className="font-bold text-gray-900">{unit?.clientName || (isTicket(data) ? data.clientName : 'Geral')}</p>
                  </div>
                </div>
                {unit && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipamento</p>
                      <p className="font-bold text-gray-900">{unit.brand} - {unit.model} ({unit.id})</p>
                      <p className="text-[10px] text-gray-500 font-medium">{unit.location} • {unit.btu} BTU</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Técnico Responsável</p>
                    <p className="font-bold text-gray-900">{technicianName || 'Não Informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Conclusão</p>
                    <p className="font-bold text-gray-900">{dateText}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution / Summary */}
            <div className="mb-12">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Resumo do Atendimento</h4>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{solutionText}</p>
              </div>
            </div>

            {/* Photo Gallery */}
            <div>
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6 border-b border-indigo-100 pb-1">Evidências Fotográficas</h4>
              <div className="grid grid-cols-2 gap-8">
                {data.photos?.map((photo, index) => (
                  <div key={index} className="space-y-3 break-inside-avoid">
                    <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm">
                      <img src={photo} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    {data.photoDescriptions?.[index] && (
                      <div className="bg-indigo-50/50 p-3 rounded-lg border-l-4 border-indigo-500">
                        <p className="text-[11px] font-medium text-indigo-900 italic">
                          {data.photoDescriptions[index]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Relatório Gerado Automaticamente via ArControl</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoReportModal;
