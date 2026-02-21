
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Scan } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    
    const startScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) { 
        console.error("Câmera não acessível.", err);
        alert("Não foi possível acessar a câmera.");
        onClose();
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        if (context) {
          canvasRef.current.height = videoRef.current.videoHeight;
          canvasRef.current.width = videoRef.current.videoWidth;
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          
          if (code && !isDetected) {
            let detectedId = code.data;
            // Handle full URLs if needed
            if (detectedId.includes('/unit/')) {
               detectedId = detectedId.split('/unit/').pop()?.split('?')[0] || '';
            }
            if (detectedId) { 
              setIsDetected(true);
              // Small vibration feedback if supported
              if ('vibrate' in navigator) navigator.vibrate(200);
              
              setTimeout(() => {
                navigate(`/unit/${detectedId.trim()}`); 
                onClose(); 
              }, 500);
              return; 
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (isOpen) {
      setIsDetected(false);
      startScanner();
    }
    
    return () => { 
      if (stream) stream.getTracks().forEach(t => t.stop()); 
      cancelAnimationFrame(animationFrameId); 
    };
  }, [isOpen, navigate, onClose, isDetected]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning UI Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/60 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]"></div>
          
          {/* Alterado border-blue-400 e shadow para roxo */}
          <div className={`relative w-72 h-72 border-2 rounded-[2.5rem] transition-all duration-300 
            ${isDetected ? 'border-green-500 scale-110 shadow-[0_0_50px_rgba(34,197,94,0.5)]' : 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'}`}>
            
            {/* Corner Markers - Alterado para border-purple-500 */}
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-purple-500 rounded-tl-3xl"></div>
            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-purple-500 rounded-tr-3xl"></div>
            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-purple-500 rounded-bl-3xl"></div>
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-purple-500 rounded-br-3xl"></div>
            
            {/* Animated Laser Line - Alterado para gradiente roxo */}
            {!isDetected && (
              <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent blur-[1px] animate-[scanner_2s_ease-in-out_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-purple-300 shadow-[0_0_15px_#a855f7]"></div>
              </div>
            )}
            
            {/* Success Feedback */}
            {isDetected && (
              <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                <div className="bg-green-500 p-5 rounded-full shadow-2xl">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-32 text-center px-10">
            <div className="flex items-center justify-center gap-2 mb-2 text-white/50">
               <Scan className="w-4 h-4 animate-pulse" />
               <p className="font-black uppercase tracking-[0.3em] text-[10px]">Scanner Ativo</p>
            </div>
            <p className="text-white/80 font-bold text-sm tracking-tight">Aponte para o QR Code no equipamento</p>
          </div>
        </div>
        
        <button onClick={onClose} className="absolute top-10 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white transition-all active:scale-90 z-[2100]">
          <X className="w-6 h-6" />
        </button>
      </div>

      <style>{`
        @keyframes scanner {
          0%, 100% { transform: translateY(10px); opacity: 0.5; }
          50% { transform: translateY(270px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default QRScannerModal;
