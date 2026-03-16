import React from 'react';
import { motion } from 'motion/react';

export const Meter = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold opacity-60">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden">
      <motion.div 
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
      />
    </div>
  </div>
);
