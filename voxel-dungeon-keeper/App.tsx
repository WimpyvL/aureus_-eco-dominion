import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GameState, Vector3, Miner, MinerClass, Building } from './types';
import { VoxelEngine } from './engine/VoxelEngine';
import { getAdvisorBanter } from './services/geminiService';

const MINER_CONFIGS: Record<MinerClass, { 
  name: string, 
  cost: { gold: number, gems: number, mana: number }, 
  speed: number, 
  miningSpeed: number,
  color: number,
  scale: number,
  icon: string
}> = {
  driller: { 
    name: 'Driller', 
    cost: { gold: 50, gems: 0, mana: 0 }, 
    speed: 0.18, 
    miningSpeed: 0.05,
    color: 0xffaa00,
    scale: 0.4,
    icon: '👷'
  },
  excavator: { 
    name: 'Excavator', 
    cost: { gold: 120, gems: 10, mana: 0 }, 
    speed: 0.14, 
    miningSpeed: 0.15,
    color: 0x5555ff,
    scale: 0.6,
    icon: '🤖'
  },
  foreman: { 
    name: 'Foreman', 
    cost: { gold: 0, gems: 0, mana: 200 }, 
    speed: 0.1, 
    miningSpeed: 0.8,
    color: 0xffffff,
    scale: 0.8,
    icon: '🦾'
  }
};

const BUILDING_CONFIGS: Record<string, {
    name: string,
    cost: { gold: number, gems: number, mana: number },
    icon: string,
    description: string
}> = {
    support: {
        name: 'Pillar',
        cost: { gold: 30, gems: 0, mana: 0 },
        icon: '🪵',
        description: 'Structural integrity'
    },
    recharger: {
        name: 'Recharge Pad',
        cost: { gold: 100, gems: 5, mana: 0 },
        icon: '⚡',
        description: 'Fast energy recovery'
    }
};

const HEART_POS = { x: 16, y: 1.5, z: 16 };
const ENERGY_DRAIN_WALK = 0.05;
const ENERGY_DRAIN_MINE = 0.2;
const ENERGY_GAIN_RECHARGE_DEFAULT = 1.0;
const ENERGY_GAIN_RECHARGE_PAD = 4.0;
const ENERGY_LOW_THRESHOLD = 20;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    gold: 630,
    gems: 20,
    mana: 75,
    miners: [],
    buildings: [],
    logs: ["The depths await your command, Overlord."],
  });

  const [interactionMode, setInteractionMode] = useState<'mine' | 'build_support' | 'build_recharger'>('mine');
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const selectionMeshRef = useRef<THREE.LineSegments | null>(null);
  const minerMeshesRef = useRef<Map<string, { group: THREE.Group, bar: THREE.Mesh, main: THREE.Mesh }>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const lastBanterTimeRef = useRef(0);

  const triggerBanter = useCallback(async (event: string) => {
    const now = Date.now();
    if (now - lastBanterTimeRef.current < 8000) return;
    lastBanterTimeRef.current = now;
    
    setGameState(prev => {
        getAdvisorBanter(event, prev.gold, prev.miners.length).then(banter => {
            setGameState(current => ({
                ...current,
                logs: [banter, ...current.logs].slice(0, 8)
            }));
        });
        return prev;
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030303); 
    scene.fog = new THREE.FogExp2(0x030303, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(16, 22, 38);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    canvasRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(16, 2, 16);
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.update();
    controlsRef.current = controls;

    const selectionGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    const selectionMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    const selectionMesh = new THREE.LineSegments(selectionGeo, selectionMat);
    selectionMesh.visible = false;
    scene.add(selectionMesh);
    selectionMeshRef.current = selectionMesh;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const cursorLight = new THREE.PointLight(0xffffff, 1.5, 30);
    scene.add(cursorLight);

    const heartLight = new THREE.PointLight(0xff0000, 5, 40);
    heartLight.position.set(16, 3, 16);
    scene.add(heartLight);

    const engine = new VoxelEngine(32, 8, 32);
    engine.generateMesh();
    scene.add(engine.mesh);
    engineRef.current = engine;

    const animate = () => {
      heartLight.intensity = 5 + Math.sin(Date.now() * 0.005) * 2;
      if (controlsRef.current) {
        cursorLight.position.copy(controlsRef.current.target);
        cursorLight.position.y += 2;
      }
      minerMeshesRef.current.forEach(m => { m.bar.parent?.lookAt(camera.position); });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    hireMiner('driller', true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hireMiner = (type: MinerClass, free: boolean = false) => {
    const config = MINER_CONFIGS[type];
    setGameState(prev => {
        if (!free && (prev.gold < config.cost.gold || prev.gems < config.cost.gems || prev.mana < config.cost.mana)) return prev;
        const id = Math.random().toString(36).substr(2, 9);
        const newMiner: Miner = {
          id, type, position: { x: 16, y: 1.5, z: 16 }, state: 'idle', energy: 100, miningProgress: 0
        };
        if (!free) triggerBanter(`A new ${type} enters the darkness.`);
        return { 
          ...prev, 
          gold: free ? prev.gold : prev.gold - config.cost.gold,
          gems: free ? prev.gems : prev.gems - config.cost.gems,
          mana: free ? prev.mana : prev.mana - config.cost.mana,
          miners: [...prev.miners, newMiner] 
        };
    });
  };

  const handleInteraction = (event: React.MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current || !engineRef.current || !selectionMeshRef.current) return;
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const intersects = raycaster.current.intersectObjects(engineRef.current.mesh.children);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const point = intersect.point.clone().add(intersect.face!.normal.clone().multiplyScalar(-0.5));
      const tx = Math.floor(point.x); const ty = Math.floor(point.y); const tz = Math.floor(point.z);
      const blockType = engineRef.current.getVoxel(tx, ty, tz);

      if (interactionMode === 'mine') {
          if (blockType !== VoxelEngine.AIR && blockType !== VoxelEngine.HEART && ty > 0) {
            selectionMeshRef.current.position.set(tx + 0.5, ty + 0.5, tz + 0.5);
            selectionMeshRef.current.visible = true;
            setGameState(prev => {
              const newMiners = [...prev.miners];
              const eligible = newMiners.find(m => m.state === 'idle' && m.energy > ENERGY_LOW_THRESHOLD);
              if (eligible) { 
                eligible.state = 'walking'; 
                eligible.targetBlock = { x: tx, y: ty, z: tz }; 
              }
              return { ...prev, miners: newMiners };
            });
          }
      } else {
          const buildType = interactionMode === 'build_support' ? 'support' : 'recharger';
          const cfg = BUILDING_CONFIGS[buildType];
          if (gameState.gold >= cfg.cost.gold && gameState.gems >= cfg.cost.gems && blockType === VoxelEngine.AIR && ty === 1) {
              const voxelType = buildType === 'support' ? VoxelEngine.SUPPORT : VoxelEngine.RECHARGER;
              engineRef.current.setBlock(tx, 1, tz, voxelType);
              if (voxelType === VoxelEngine.SUPPORT) {
                  engineRef.current.setBlock(tx, 2, tz, voxelType);
                  engineRef.current.setBlock(tx, 3, tz, voxelType);
              }
              engineRef.current.generateMesh();
              setGameState(prev => ({
                  ...prev,
                  gold: prev.gold - cfg.cost.gold,
                  gems: prev.gems - cfg.cost.gems,
                  buildings: [...prev.buildings, { id: Math.random().toString(), type: buildType, position: {x: tx, y: 1, z: tz} }]
              }));
              triggerBanter(`${cfg.name} placed. Structurally sound.`);
          }
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        let goldAdd = 0; let gemsAdd = 0; let manaAdd = 0;
        let worldUpdate = false;
        let banterEvent = "";

        if (Math.random() < 0.01 && engineRef.current) {
            const collapses = engineRef.current.checkStability();
            if (collapses.length > 0) {
                worldUpdate = true;
                banterEvent = "A collapse! Use pillars, fool.";
            }
        }

        const nextMiners: Miner[] = prev.miners.map((m: Miner): Miner => {
          const config = MINER_CONFIGS[m.type];
          if (m.state !== 'recharging' && m.energy <= ENERGY_LOW_THRESHOLD && m.state !== 'returning_to_base') {
            let nearestRecharge = HEART_POS;
            let minDist = Math.sqrt((m.position.x - HEART_POS.x)**2 + (m.position.z - HEART_POS.z)**2);
            prev.buildings.filter(b => b.type === 'recharger').forEach(pad => {
                const d = Math.sqrt((m.position.x - pad.position.x)**2 + (m.position.z - pad.position.z)**2);
                if (d < minDist) { minDist = d; nearestRecharge = pad.position; }
            });
            return { ...m, state: 'returning_to_base', targetBlock: nearestRecharge };
          }
          if (m.state === 'recharging') {
            const onPad = prev.buildings.some(b => b.type === 'recharger' && Math.floor(m.position.x) === b.position.x && Math.floor(m.position.z) === b.position.z);
            const rate = onPad ? ENERGY_GAIN_RECHARGE_PAD : ENERGY_GAIN_RECHARGE_DEFAULT;
            const nextEnergy = Math.min(100, m.energy + rate);
            if (nextEnergy === 100) return { ...m, energy: 100, state: 'idle' };
            return { ...m, energy: nextEnergy };
          }
          if ((m.state === 'walking' || m.state === 'returning_to_base') && m.targetBlock) {
            const dx = m.targetBlock.x + 0.5 - m.position.x;
            const dz = m.targetBlock.z + 0.5 - m.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.5) {
              return { ...m, energy: Math.max(0, m.energy - ENERGY_DRAIN_WALK), position: { x: m.position.x + (dx / dist) * config.speed, y: m.position.y, z: m.position.z + (dz / dist) * config.speed } };
            } else {
              if (m.state === 'returning_to_base') return { ...m, state: 'recharging' };
              return { ...m, state: 'mining', miningProgress: 0 };
            }
          }
          if (m.state === 'mining' && m.targetBlock) {
            const blockType = engineRef.current?.getVoxel(m.targetBlock.x, m.targetBlock.y, m.targetBlock.z);
            if (!blockType || blockType === VoxelEngine.AIR) return { ...m, state: 'idle', targetBlock: undefined };
            const hardness = VoxelEngine.BLOCK_HARDNESS[blockType] || 1;
            const prog = m.miningProgress + (config.miningSpeed / hardness);
            if (prog >= 1) {
              if (blockType === VoxelEngine.GOLD) { goldAdd += 50; banterEvent = "Gold discovered."; }
              if (blockType === VoxelEngine.GEMS) { gemsAdd += 10; banterEvent = "Shiny gems found."; }
              if (blockType === VoxelEngine.MANA) { manaAdd += 25; banterEvent = "Mana crystal cracked."; }
              engineRef.current?.setBlock(m.targetBlock.x, m.targetBlock.y, m.targetBlock.z, VoxelEngine.AIR);
              engineRef.current?.reveal(m.targetBlock.x, m.targetBlock.y, m.targetBlock.z);
              for(let nx=-1;nx<=1;nx++)for(let nz=-1;nz<=1;nz++) engineRef.current?.reveal(m.targetBlock.x+nx, 1, m.targetBlock.z+nz);
              worldUpdate = true;
              return { ...m, state: 'idle', targetBlock: undefined, miningProgress: 0, energy: Math.max(0, m.energy - ENERGY_DRAIN_MINE) };
            }
            return { ...m, miningProgress: prog, energy: Math.max(0, m.energy - ENERGY_DRAIN_MINE) };
          }
          return m;
        });
        if (worldUpdate) engineRef.current?.generateMesh();
        if (banterEvent) triggerBanter(banterEvent);
        return { ...prev, miners: nextMiners, gold: prev.gold + goldAdd, gems: prev.gems + gemsAdd, mana: prev.mana + manaAdd };
      });
    }, 50);
    return () => clearInterval(interval);
  }, [triggerBanter]);

  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const currentIds = new Set(gameState.miners.map(m => m.id));
    minerMeshesRef.current.forEach((data, id) => { if (!currentIds.has(id)) { scene.remove(data.group); minerMeshesRef.current.delete(id); } });
    gameState.miners.forEach(miner => {
      let data = minerMeshesRef.current.get(miner.id);
      const config = MINER_CONFIGS[miner.type];
      if (!data) {
        const group = new THREE.Group();
        const main = new THREE.Mesh(new THREE.BoxGeometry(config.scale, config.scale * 2, config.scale), new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.8 }));
        main.position.y = config.scale; group.add(main);
        const l = new THREE.PointLight(config.color, 1, 6); l.position.y = 0.5; group.add(l);
        const barBg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide }));
        barBg.position.y = config.scale * 2 + 0.4;
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }));
        bar.position.z = 0.01; barBg.add(bar); group.add(barBg);
        scene.add(group); data = { group, bar, main }; minerMeshesRef.current.set(miner.id, data);
      }
      data.group.position.set(miner.position.x, miner.position.y - 0.5, miner.position.z);
      const energyPct = miner.energy / 100;
      data.bar.scale.x = energyPct; data.bar.position.x = (energyPct - 1) * 0.4;
      (data.bar.material as THREE.MeshBasicMaterial).color.setHex(energyPct > 0.5 ? 0x00ff00 : energyPct > 0.2 ? 0xffff00 : 0xff0000);
      (data.main.material as THREE.MeshStandardMaterial).emissive.setHex(miner.energy <= ENERGY_LOW_THRESHOLD ? 0xff0000 : config.color);
    });
  }, [gameState.miners]);

  return (
    <div className="relative w-full h-full bg-[#030303] overflow-hidden select-none">
      <div ref={canvasRef} className="w-full h-full cursor-crosshair" onClick={handleInteraction} />

      {/* MINIMAL RESOURCE CLUSTER */}
      <div className="absolute top-6 left-6 flex flex-col gap-1.5 pointer-events-none">
        <MiniResource value={gameState.gold} icon="💰" color="text-yellow-400" />
        <MiniResource value={gameState.gems} icon="💎" color="text-purple-400" />
        <MiniResource value={gameState.mana} icon="✨" color="text-cyan-400" />
      </div>

      {/* SLEEK ADVISOR FEED */}
      <div className="absolute bottom-16 left-6 w-52 max-h-[20vh] flex flex-col-reverse gap-1 pointer-events-none opacity-80">
        {gameState.logs.map((log, i) => (
          <div key={i} className="px-2 py-1 bg-black/80 border-l border-red-900 rounded-sm animate-in fade-in slide-in-from-left-2 duration-700">
            <p className="text-[10px] text-gray-400 leading-tight italic">"{log}"</p>
          </div>
        ))}
      </div>

      {/* ULTRA COMPACT COMMAND STRIP */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
        
        {/* Hover Descriptor */}
        <div className={`mb-2 px-2 py-0.5 bg-black/60 border border-white/5 rounded text-[9px] font-black uppercase tracking-widest text-white/50 transition-opacity duration-200 ${hoverInfo ? 'opacity-100' : 'opacity-0'}`}>
          {hoverInfo || "Command Console"}
        </div>

        <div className="flex items-center gap-1 p-1 bg-black/90 border border-white/10 rounded-full shadow-2xl backdrop-blur-md pointer-events-auto">
          {/* Modes */}
          <div className="flex gap-1 px-1 border-r border-white/10">
            <CommandIcon active={interactionMode === 'mine'} onClick={() => setInteractionMode('mine')} icon="⛏️" onHover={() => setHoverInfo("Mode: Mine")} onLeave={() => setHoverInfo(null)} />
            <CommandIcon active={interactionMode === 'build_support'} onClick={() => setInteractionMode('build_support')} icon="🪵" onHover={() => setHoverInfo("Mode: Build Pillar")} onLeave={() => setHoverInfo(null)} />
            <CommandIcon active={interactionMode === 'build_recharger'} onClick={() => setInteractionMode('build_recharger')} icon="⚡" onHover={() => setHoverInfo("Mode: Build Pad")} onLeave={() => setHoverInfo(null)} />
          </div>

          {/* Units */}
          <div className="flex gap-1 px-1">
            {(Object.entries(MINER_CONFIGS) as [MinerClass, typeof MINER_CONFIGS['driller']][]).map(([key, config]) => (
                <CommandIcon 
                    key={key} 
                    onClick={() => hireMiner(key)} 
                    icon={config.icon} 
                    cost={`${config.cost.gold}G`}
                    onHover={() => setHoverInfo(`Hire ${config.name} (${config.cost.gold}G)`)} 
                    onLeave={() => setHoverInfo(null)}
                />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
};

const MiniResource = ({ value, icon, color }: { value: number, icon: string, color: string }) => (
    <div className="flex items-center gap-2 px-2 py-0.5 bg-black/40 border border-white/5 rounded-full">
        <span className="text-xs">{icon}</span>
        <span className={`text-[11px] font-mono font-black ${color}`}>{value}</span>
    </div>
);

const CommandIcon = ({ active, onClick, icon, cost, onHover, onLeave }: { active?: boolean, onClick: () => void, icon: string, cost?: string, onHover: () => void, onLeave: () => void }) => (
    <button 
        onClick={onClick} 
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${active ? 'bg-white/20 border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'hover:bg-white/10 border border-transparent'}`}
    >
        <span className="text-sm">{icon}</span>
        {cost && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[6px] font-black px-0.5 rounded-sm pointer-events-none">
                {cost.replace('0', '')}
            </span>
        )}
    </button>
);

export default App;