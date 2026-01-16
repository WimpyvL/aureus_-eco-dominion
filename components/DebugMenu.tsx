
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, Database, Box, Users, Layers, Zap, X, Monitor, ToggleLeft, ToggleRight, Unlock, Eye, Image, FileCode, Hash } from 'lucide-react';
import { GameState, Action } from '../types';

interface DebugMenuProps {
  getDebugStats: () => any;
  state: GameState;
  onClose: () => void;
  dispatch: React.Dispatch<Action>;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ getDebugStats, state, onClose, dispatch }) => {
  const [stats, setStats] = useState<any>(null);
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        setFps(currentFps);
        setFrameTime(1000 / currentFps); // Avg frame time
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        const engStats = getDebugStats ? getDebugStats() : {};
        const mem = (performance as any).memory;
        setStats({
          ...engStats,
          memUsed: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0,
          memTotal: mem ? Math.round(mem.totalJSHeapSize / 1048576) : 0,
          memLimit: mem ? Math.round(mem.jsHeapSizeLimit / 1048576) : 0
        });
      }
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const LoadBar = ({ value, max = 16.66 }: { value: number, max?: number }) => {
    const pct = Math.min(100, (value / max) * 100);
    let color = 'bg-emerald-500';
    if (pct > 50) color = 'bg-amber-500';
    if (pct > 85) color = 'bg-rose-500';

    return (
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  const StatRow = ({ label, value, icon: Icon, color = "text-emerald-400" }: any) => (
    <div className="flex items-center justify-between py-1 border-b border-slate-800 last:border-0 group hover:bg-slate-800/50 px-1 transition-colors">
      <div className="flex items-center gap-2">
        <Icon size={12} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">{label}</span>
      </div>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="fixed top-20 right-4 z-[60] w-64 pointer-events-auto animate-in slide-in-from-right-8 duration-300 flex flex-col max-h-[85vh]">
      <div className="bg-slate-900 border-2 border-emerald-600 rounded-[4px] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 p-2 border-b-2 border-slate-700 flex justify-between items-center select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-950 border border-emerald-500 flex items-center justify-center shadow-inner rounded-[2px]">
              <Activity size={12} className="text-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] font-['Rajdhani']">System Monitor</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-mono font-bold border ${fps > 55 ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' : 'bg-amber-950/50 text-amber-400 border-amber-500/30'}`}>
              {fps} FPS
            </div>
            <button
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-300 rounded-[2px] border border-slate-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4 overflow-y-auto custom-scrollbar bg-slate-900/95">

          {/* Workload */}
          <div>
            <h3 className="text-[9px] text-slate-500 font-black uppercase mb-1.5 flex items-center gap-1.5 font-['Rajdhani'] tracking-widest border-b border-slate-800 pb-0.5">
              <Monitor size={10} /> Real-Time Workload
            </h3>
            <div className="space-y-2 px-1">
              <div>
                <div className="flex justify-between text-[9px] font-mono mb-0.5">
                  <span className="text-slate-400">Main Thread (CPU)</span>
                  <span className="text-white font-bold">{stats?.cpuTime.toFixed(1)}ms</span>
                </div>
                <LoadBar value={stats?.cpuTime || 0} />
              </div>
              <div>
                <div className="flex justify-between text-[9px] font-mono mb-0.5">
                  <span className="text-slate-400">Total Frame (GPU+Wait)</span>
                  <span className="text-white font-bold">{frameTime.toFixed(1)}ms</span>
                </div>
                <LoadBar value={frameTime} />
              </div>
            </div>
          </div>

          {/* JS Heap */}
          <div>
            <h3 className="text-[9px] text-slate-500 font-black uppercase mb-1.5 flex items-center gap-1.5 font-['Rajdhani'] tracking-widest border-b border-slate-800 pb-0.5">
              <Cpu size={10} /> System Memory
            </h3>
            <div className="space-y-0.5">
              <StatRow label="Used Heap" value={`${stats?.memUsed || 0} MB`} icon={Zap} color={stats?.memUsed > 150 ? "text-amber-400" : "text-emerald-400"} />
              <StatRow label="Allocated" value={`${stats?.memTotal || 0} MB`} icon={Database} color="text-blue-400" />
            </div>
          </div>

          {/* GPU Pipeline */}
          <div>
            <h3 className="text-[9px] text-slate-500 font-black uppercase mb-1.5 flex items-center gap-1.5 font-['Rajdhani'] tracking-widest border-b border-slate-800 pb-0.5">
              <Eye size={10} /> Rasterizer Pipeline
            </h3>
            <div className="space-y-0.5">
              <StatRow label="Draw Calls" value={stats?.drawCalls || 0} icon={Layers} color={stats?.drawCalls > 200 ? 'text-amber-400' : 'text-emerald-400'} />
              <StatRow label="Triangles" value={(stats?.triangles || 0).toLocaleString()} icon={Activity} />
              {(stats?.lines > 0 || stats?.points > 0) && (
                <div className="flex justify-between gap-1 pl-1">
                  <div className="flex-1">
                    <StatRow label="Lines" value={stats?.lines} icon={Hash} color="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <StatRow label="Points" value={stats?.points} icon={Hash} color="text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GPU Resources */}
          <div>
            <h3 className="text-[9px] text-slate-500 font-black uppercase mb-1.5 flex items-center gap-1.5 font-['Rajdhani'] tracking-widest border-b border-slate-800 pb-0.5">
              <Database size={10} /> GPU Resources
            </h3>
            <div className="space-y-0.5">
              <StatRow label="Geometries" value={stats?.geometries || 0} icon={Box} color="text-cyan-400" />
              <StatRow label="Textures" value={stats?.textures || 0} icon={Image} color="text-purple-400" />
              <StatRow label="Shader Progs" value={stats?.programs || 0} icon={FileCode} color="text-pink-400" />
            </div>
          </div>

          {/* Object Registry */}
          <div>
            <h3 className="text-[9px] text-slate-500 font-black uppercase mb-1.5 flex items-center gap-1.5 font-['Rajdhani'] tracking-widest border-b border-slate-800 pb-0.5">
              <Users size={10} /> Active Instances
            </h3>
            <div className="space-y-0.5">
              <StatRow label="Terrain Chunks" value={stats?.instancedMeshes || 0} icon={Layers} />
              <StatRow label="Structures" value={stats?.buildings || 0} icon={Box} />
              <StatRow label="Colonists" value={stats?.agents || 0} icon={Users} color="text-amber-400" />
              <StatRow label="FX Particles" value={stats?.particles || 0} icon={Activity} />
            </div>
          </div>

          {/* Developer Tools */}
          <div>
            <h3 className="text-[9px] text-slate-500 font-black uppercase mb-1.5 flex items-center gap-1.5 font-['Rajdhani'] tracking-widest border-b border-slate-800 pb-0.5">
              <Unlock size={10} /> Developer Tools
            </h3>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_CHEATS' })}
              className={`w-full py-2 px-2 rounded-[2px] font-bold text-[10px] flex items-center justify-between transition-all border border-slate-700 ${state.cheatsEnabled ? 'bg-amber-900/30 text-amber-400 border-amber-600/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'}`}
            >
              <span className="font-['Rajdhani'] uppercase tracking-wider">Creative Mode</span>
              {state.cheatsEnabled ? <ToggleRight size={16} className="text-amber-400" /> : <ToggleLeft size={16} className="text-slate-500" />}
            </button>
            <p className="text-[8px] text-slate-500 mt-1 italic leading-tight">
              Bypasses all building costs, eco requirements, and tech locks.
            </p>

            <button
              onClick={() => dispatch({ type: 'TOGGLE_VIEW' })}
              className={`w-full mt-3 py-1.5 px-2 rounded-[2px] font-bold text-[9px] flex items-center justify-center gap-2 transition-all border border-emerald-600/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30 uppercase tracking-widest font-['Rajdhani']`}
            >
              <Layers size={12} />
              {state.viewMode === 'SURFACE' ? 'Switch to Underground' : 'Return to Surface'}
            </button>
          </div>

          <div className="pt-2 border-t-2 border-slate-800 shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-black/40 rounded-[2px] border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)] animate-pulse" />
              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest font-mono">Aureus Engine v3.14</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
