import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

export const NotificationOverlay = ({ 
  notification, 
  onClose 
}: { 
  notification: { title: string, msg: string } | null, 
  onClose: () => void 
}) => (
  <AnimatePresence>
    {notification && (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
      >
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black">
          <div className="bg-amber-400 p-6 flex items-center gap-4 border-b-4 border-black">
            <div className="w-12 h-12 bg-black text-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{notification.title}</h2>
          </div>
          <div className="p-8">
            <p className="text-lg font-bold leading-tight text-slate-800 mb-8 italic">"{notification.msg}"</p>
            <button 
              onClick={onClose}
              className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
