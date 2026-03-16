import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Timer, FileText, Stamp, AlertCircle, Zap } from 'lucide-react';

interface FormMiniGameProps {
  onComplete: (results: { accuracy: number; time: number }) => void;
  onCancel: () => void;
}

const FORM_FIELDS = [
  'APPLICANT_ID',
  'SECTOR_CODE',
  'PERMIT_TYPE',
  'STAMP_HASH',
  'EXPIRY_DATE',
  'BUREAU_REF',
  'VAL_KEY',
  'AUTH_SIG'
];

const GENERATED_CODES = [
  'XJ-902', 'B-14', 'EXT-7', 'HASH-88', '2026-03', 'REF-001', 'KEY-X', 'SIG-V',
  'YQ-111', 'C-22', 'PRO-1', 'HASH-99', '2026-04', 'REF-002', 'KEY-Y', 'SIG-K',
  'ZR-555', 'D-33', 'SAF-3', 'HASH-00', '2026-05', 'REF-003', 'KEY-Z', 'SIG-O'
];

export const FormMiniGame: React.FC<FormMiniGameProps> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'MATCHING' | 'STAMPING' | 'RESULT'>('MATCHING');
  const [targetSequence, setTargetSequence] = useState<{ field: string; code: string }[]>([]);
  const [gridOptions, setGridOptions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [stampPos, setStampPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // Generate target sequence (5 fields)
    const fields = [...FORM_FIELDS].sort(() => Math.random() - 0.5).slice(0, 5);
    const sequence = fields.map(field => ({
      field,
      code: GENERATED_CODES[Math.floor(Math.random() * GENERATED_CODES.length)]
    }));
    setTargetSequence(sequence);

    // Generate grid options (12 options)
    const targetCodes = sequence.map(s => s.code);
    const distractors = GENERATED_CODES.filter(c => !targetCodes.includes(c))
      .sort(() => Math.random() - 0.5)
      .slice(0, 12 - targetCodes.length);
    
    setGridOptions([...targetCodes, ...distractors].sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
      
      if (phase === 'STAMPING') {
        setStampPos({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, isFinished, phase]);

  const handleOptionClick = (code: string) => {
    if (isFinished || phase !== 'MATCHING') return;

    if (code === targetSequence[currentIndex].code) {
      setCombo(prev => prev + 1);
      if (currentIndex === targetSequence.length - 1) {
        setPhase('STAMPING');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      setErrors(prev => prev + 1);
      setCombo(0);
      const grid = document.getElementById('mini-game-grid');
      if (grid) {
        grid.classList.add('animate-shake');
        setTimeout(() => grid.classList.remove('animate-shake'), 500);
      }
    }
  };

  const handleStampClick = () => {
    if (phase !== 'STAMPING') return;
    setIsFinished(true);
    setPhase('RESULT');
    setTimeout(() => {
      onComplete({
        accuracy: 1 - (errors / (targetSequence.length + errors)),
        time: elapsedTime
      });
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#E4E3E0] w-full max-w-sm rounded-2xl overflow-hidden border border-black/20 shadow-2xl flex flex-col max-h-[90vh] relative">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-400" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em]">Bureaucratic Accuracy Test</h2>
          </div>
          <button onClick={onCancel} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        {/* Reference Slip */}
        <div className="p-4 border-b border-black/10 bg-white/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">Reference Slip #88-A</span>
              {combo > 1 && (
                <motion.span 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[10px] font-black text-emerald-600 uppercase italic"
                >
                  Momentum x{combo}
                </motion.span>
              )}
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <Timer size={14} />
              <span className="font-mono text-xs font-bold">{elapsedTime.toFixed(1)}s</span>
            </div>
          </div>
          
          <div className="space-y-1">
            {targetSequence.map((item, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all
                  ${idx === currentIndex && phase === 'MATCHING' ? 'bg-emerald-50 border-emerald-200 scale-105 shadow-sm' : 
                    idx < currentIndex || phase !== 'MATCHING' ? 'bg-slate-100 border-transparent opacity-30' : 
                    'bg-white border-black/5 opacity-50'}
                `}
              >
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{item.field}</span>
                <span className="text-xs font-black font-mono">{item.code}</span>
                {(idx < currentIndex || phase !== 'MATCHING') && <Check size={12} className="text-emerald-600" />}
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Area */}
        <div className="p-4 flex-1 overflow-hidden min-h-[240px] relative">
          <AnimatePresence mode="wait">
            {phase === 'MATCHING' ? (
              <motion.div 
                key="matching"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                id="mini-game-grid" 
                className="grid grid-cols-3 gap-2 transition-transform"
              >
                {gridOptions.map((code, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(code)}
                    className="h-12 bg-white border border-black/10 rounded-xl shadow-sm active:scale-95 hover:border-black/30 transition-all font-mono text-xs font-black flex items-center justify-center"
                  >
                    {code}
                  </button>
                ))}
              </motion.div>
            ) : phase === 'STAMPING' ? (
              <motion.div 
                key="stamping"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 animate-pulse">Awaiting Final Stamp</h3>
                  <p className="text-[9px] font-bold opacity-40 uppercase">Click the target to finalize filing</p>
                </div>
                
                <div className="relative w-full h-full bg-black/5 rounded-2xl border-2 border-dashed border-black/10">
                  <motion.button
                    onClick={handleStampClick}
                    animate={{ 
                      left: `${stampPos.x}%`, 
                      top: `${stampPos.y}%` 
                    }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="absolute w-16 h-16 -ml-8 -mt-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90"
                  >
                    <Stamp size={32} />
                  </motion.button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer / Stats */}
        <div className="p-4 bg-black/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold opacity-40">Errors</span>
            <span className={`text-xs font-black ${errors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{errors}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isFinished ? (
              <div className="flex items-center gap-2 text-emerald-600 animate-bounce">
                <Zap size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 opacity-40 italic">
                <AlertCircle size={14} />
                <span className="text-[9px] font-bold uppercase">
                  {phase === 'MATCHING' ? 'Match codes in order' : 'Stamp the document'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[110] bg-emerald-600/90 flex flex-col items-center justify-center text-white p-8 text-center"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-2xl text-black"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stamp size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">APPROVED</h3>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 mb-6">Bureaucratic Efficiency Bonus</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-left">
                  <p className="text-[8px] uppercase font-bold opacity-40">Time</p>
                  <p className="text-xl font-black">{elapsedTime.toFixed(2)}s</p>
                </div>
                <div className="text-left">
                  <p className="text-[8px] uppercase font-bold opacity-40">Accuracy</p>
                  <p className="text-xl font-black">{Math.round((1 - errors / (targetSequence.length + errors)) * 100)}%</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[9px] font-bold uppercase text-emerald-600">Rewards Dispatched</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
