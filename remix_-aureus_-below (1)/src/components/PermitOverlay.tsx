import React from 'react';
import { motion } from 'motion/react';
import { X, Stamp, FileText, Zap } from 'lucide-react';
import { Permit } from '../types';

export const PermitOverlay: React.FC<{ 
  permit: Permit, 
  onClose: () => void,
  onAction: (id: string, action: 'SUBMIT' | 'PAY' | 'FAST_TRACK') => void,
  tutorialStep?: number
}> = ({ 
  permit, 
  onClose, 
  onAction,
  tutorialStep
}) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
  >
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-black">
      <div className="p-6 bg-slate-50 border-b-4 border-black flex items-center gap-4 relative">
        <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
          <Stamp size={28} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight leading-none">{permit.name}</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-1">{permit.formNumber}</p>
        </div>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-8 flex flex-col gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-black/5 italic text-slate-700 leading-relaxed font-medium">
          "{permit.description}"
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-black/5">
            <p className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-1">Status</p>
            <p className="font-black text-sm uppercase tracking-wider">{permit.status}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-black/5">
            <p className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-1">Filing Fee</p>
            <p className="font-black text-sm uppercase tracking-wider">${permit.cost}</p>
          </div>
        </div>

        {permit.rejectionReason && (
          <div className="p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3">
            <FileText size={16} className="text-red-500 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-red-500 mb-1">Rejection Reason</p>
              <p className="text-xs font-bold text-red-800 italic">"{permit.rejectionReason}"</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t-4 border-black p-6 flex flex-col gap-3">
        {(permit.status === 'AVAILABLE' || permit.status === 'REJECTED') && (
          <>
            <button 
              onClick={() => onAction(permit.id, 'SUBMIT')}
              className={`w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 transition-all shadow-xl active:scale-95 relative z-50
                ${tutorialStep === 4 ? 'ring-4 ring-blue-500 ring-offset-2 animate-pulse' : ''}
              `}
            >
              {tutorialStep === 4 && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap animate-bounce">
                  Click Here to File
                </div>
              )}
              {permit.status === 'REJECTED' ? 'Resubmit with "Corrections" ($100)' : `Standard Filing ($${permit.cost})`}
            </button>
            <button 
              onClick={() => onAction(permit.id, 'FAST_TRACK')}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Fast-Track Processing (${(permit.status === 'REJECTED' ? 100 : permit.cost) * 2})
            </button>
          </>
        )}
        {permit.status === 'PENDING' && (
          <div className="text-center py-4 font-mono text-xs animate-pulse opacity-60 font-black uppercase tracking-widest">
            PROCESSING BY CENTRAL BUREAU...
          </div>
        )}
      </div>
    </div>
  </motion.div>
);
