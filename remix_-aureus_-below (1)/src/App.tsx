import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Briefcase, 
  Pickaxe, 
  Users, 
  TrendingUp, 
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GameState, Permit, NPC, DirtItem, DirtType, WorldPosition } from './types';
import { INITIAL_NPCS, INITIAL_PERMITS, INITIAL_MINES, REJECTION_REASONS, BUILDINGS, OFFICE_ITEMS } from './data';

// Components
import { Header } from './components/Header';
import { MineScene } from './components/MineScene';
import { OfficeScene } from './components/OfficeScene';
import { WorldScene } from './components/WorldScene';
import { DialogueOverlay } from './components/DialogueOverlay';
import { PermitOverlay } from './components/PermitOverlay';
import { FormMiniGame } from './components/FormMiniGame';

// --- Main App ---

export default function App() {
  const [state, setState] = useState<GameState>({
    money: 1000,
    ore: 0,
    evidence: 0,
    energy: 100,
    maxEnergy: 100,
    movementSpeed: 1,
    upgrades: [],
    dirtItems: [],
    leverage: [],
    foundOfficeItemIds: [],
    explorationActive: false,
    meters: {
      trust: 50,
      influence: 10,
      exposure: 0
    },
    permits: INITIAL_PERMITS,
    npcs: INITIAL_NPCS,
    knownNpcIds: ['journalist'], // Start knowing only the journalist
    objectives: [
      { id: 'start', text: 'Find the Bureau of Extraction (East).', isCompleted: false, type: 'DISCOVER', targetId: 'licensing_office' }
    ],
    mines: INITIAL_MINES,
    activeMineId: null,
    currentScene: 'WORLD',
    activeNPCId: null,
    activePermitId: null,
    activeBuildingId: null,
    activeMiniGame: null,
    pendingPermitAction: null,
    day: 1,
    time: 8, // Start at 8 AM
    playerPos: { x: 2, y: 2 }, // Start at home
    targetPos: null,
    path: [],
    feedbacks: [],
    tutorialStep: 0,
    tutorialMinimized: false,
    camera: {
      x: -((2 - 2) * (60 / 2)) - 60/2, // Center on player home
      y: -((2 + 2) * (30 / 2)) - 30/2,
      zoom: 1
    }
  });

  const [notification, setNotification] = useState<{title: string, msg: string} | null>(null);

  // Building Discovery Logic
  useEffect(() => {
    setState(prev => {
      let changed = false;
      const newKnownNpcIds = [...prev.knownNpcIds];
      const newObjectives = [...prev.objectives];
      let newTutorialStep = prev.tutorialStep;

      Object.values(BUILDINGS).forEach(b => {
        if (!b.isDiscovered) {
          const dist = Math.sqrt(Math.pow(prev.playerPos.x - b.pos.x, 2) + Math.pow(prev.playerPos.y - b.pos.y, 2));
          if (dist < 4) {
            b.isDiscovered = true;
            changed = true;
            if (b.npcId !== 'none' && !newKnownNpcIds.includes(b.npcId)) {
              newKnownNpcIds.push(b.npcId);
              setNotification({ title: "New Contact", msg: `You discovered the location of ${prev.npcs[b.npcId].name}.` });
              
              // Tutorial Step 0 -> 1: Found Licensing Office
              if (b.id === 'licensing_office' && prev.tutorialStep === 0) {
                newTutorialStep = 1;
                setNotification({ title: "Objective Complete", msg: "You found the Bureau. Now head inside." });
              }
            }
          }
        }
      });

      // Special check for permit unlocking on discovery
      const licensingOffice = BUILDINGS['licensing_office'];
      if (licensingOffice.isDiscovered && prev.permits['prospecting-license'].status === 'LOCKED') {
        // We don't auto-unlock in this new tutorial flow, Vane does it.
      }

      if (changed) return { ...prev, knownNpcIds: newKnownNpcIds, objectives: newObjectives, tutorialStep: newTutorialStep };
      return prev;
    });
  }, [state.playerPos, state.activeNPCId, state.permits]);

  // Feedback Cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setState(prev => {
        const expired = prev.feedbacks.some(f => now - f.timestamp > 3000);
        if (!expired) return prev;
        return {
          ...prev,
          feedbacks: prev.feedbacks.filter(f => now - f.timestamp <= 3000)
        };
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const triggerFeedback = (npcId: string, amount: number, type: 'TRUST' | 'LEVERAGE') => {
    if (amount === 0) return;
    const feedback = {
      id: `fb-${Date.now()}-${Math.random()}`,
      npcId,
      amount,
      type,
      timestamp: Date.now()
    };
    setState(s => ({ ...s, feedbacks: [...s.feedbacks, feedback] }));
  };

  // Game Loop: Handle Time and Penalties
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        let newTime = prev.time + (prev.time >= 20 || prev.time < 6 ? 0.2 : 0.1);
        let newDay = prev.day;
        let newExposure = prev.meters.exposure;
        let newEnergy = prev.energy;

        if (newTime >= 24) {
          newTime -= 24;
        }
        
        if (prev.time < 6 && newTime >= 6) {
          newDay += 1;
        }

        // Night Penalties (Curfew)
        const isNight = newTime >= 20 || newTime < 6;
        const isAtHome = prev.playerPos.x === 2 && prev.playerPos.y === 2;
        
        if (isNight && !isAtHome) {
          // Every tick (1s) we add a bit of exposure and drain energy
          newExposure = Math.min(100, newExposure + 0.2);
          newEnergy = Math.max(0, newEnergy - 0.1);
        }

        return {
          ...prev,
          time: newTime,
          day: newDay,
          energy: newEnergy,
          meters: {
            ...prev.meters,
            exposure: newExposure
          }
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Game Loop: Handle Permit Processing
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        const newPermits = { ...prev.permits };
        let changed = false;

        Object.values(newPermits).forEach((p: Permit) => {
          if (p.status === 'PENDING' && Math.random() > 0.9) {
            // Accuracy influences approval chance. Base chance is 60%, but accuracy can boost it.
            const baseChance = 0.6;
            const accuracyBonus = (p.accuracy || 0.5) * 0.4; // Up to +40% chance
            const approved = Math.random() < (baseChance + accuracyBonus);
            
            newPermits[p.id] = {
              ...p,
              status: approved ? 'APPROVED' : 'REJECTED',
              rejectionReason: approved ? undefined : REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)]
            };
            changed = true;
            
            // Side effects of approval
            if (approved) {
              // Unlock next permits
              if (p.id === 'prospecting-license') {
                newPermits['extraction-intent'].status = 'AVAILABLE';
              } else if (p.id === 'extraction-intent') {
                newPermits['safety-compliance'].status = 'AVAILABLE';
              } else if (p.id === 'safety-compliance') {
                newPermits['environmental-sincerity'].status = 'AVAILABLE';
              } else if (p.id === 'environmental-sincerity') {
                newPermits['wash-plant'].status = 'AVAILABLE';
              }
            }
          }
        });

        if (changed) return { ...prev, permits: newPermits };
        return prev;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Game Loop: Handle Movement
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.path.length === 0) return prev;

        const nextPos = prev.path[0];
        const remainingPath = prev.path.slice(1);
        
        // Calculate costs
        const energyCost = 0.5;
        const timeCost = 0.1;

        if (prev.energy < energyCost) {
          setNotification({ title: "Exhausted", msg: "You're too tired to keep walking. Rest at home." });
          return { ...prev, path: [] };
        }

        const newEnergy = prev.energy - energyCost;
        const newTime = (prev.time + timeCost) % 24;

        if (newEnergy <= 0) {
          setNotification({ title: "Collapse", msg: "You collapsed from exhaustion. The Bureau 'helped' you home for a fee." });
          return {
            ...prev,
            energy: 20,
            money: Math.max(0, prev.money - 200),
            playerPos: { x: 2, y: 2 },
            day: prev.day + 1,
            time: 6,
            path: []
          };
        }

        return {
          ...prev,
          playerPos: nextPos,
          energy: newEnergy,
          time: newTime,
          path: remainingPath,
          targetPos: remainingPath.length === 0 ? null : prev.targetPos
        };
      });
    }, 200); // 200ms per tile = reasonable pace
    return () => clearInterval(timer);
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragDistance(0);
    setLastPointerPos({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastPointerPos.x;
    const dy = e.clientY - lastPointerPos.y;
    
    setDragDistance(prev => prev + Math.abs(dx) + Math.abs(dy));
    
    setState(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        x: prev.camera.x + dx,
        y: prev.camera.y + dy
      }
    }));
    setLastPointerPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    setState(prev => {
      const zoomDelta = e.deltaY > 0 ? 0.95 : 1.05;
      const newZoom = Math.max(0.6, Math.min(1.5, prev.camera.zoom * zoomDelta));
      return {
        ...prev,
        camera: { ...prev.camera, zoom: newZoom }
      };
    });
  };

  const handleMove = (pos: WorldPosition) => {
    if (dragDistance > 10) return;
    setState(prev => {
      if (prev.playerPos.x === pos.x && prev.playerPos.y === pos.y) return prev;
      
      // BFS for pathfinding
      const queue: { x: number, y: number, path: WorldPosition[] }[] = [
        { x: prev.playerPos.x, y: prev.playerPos.y, path: [] }
      ];
      const visited = new Set<string>();
      visited.add(`${prev.playerPos.x},${prev.playerPos.y}`);

      while (queue.length > 0) {
        const { x, y, path } = queue.shift()!;

        if (x === pos.x && y === pos.y) {
          return { ...prev, path, targetPos: pos };
        }

        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 }
        ];

        for (const n of neighbors) {
          if (n.x >= 0 && n.x < 32 && n.y >= 0 && n.y < 32 && !visited.has(`${n.x},${n.y}`)) {
            visited.add(`${n.x},${n.y}`);
            queue.push({ ...n, path: [...path, n] });
          }
        }
      }

      return prev; // No path found
    });
  };

  const handleRecenter = () => {
    const TILE_WIDTH = 60;
    const TILE_HEIGHT = 30;
    const toIso = (x: number, y: number) => ({
      x: (x - y) * (TILE_WIDTH / 2),
      y: (x + y) * (TILE_HEIGHT / 2)
    });
    const playerIso = toIso(state.playerPos.x, state.playerPos.y);
    
    setState(prev => ({
      ...prev,
      camera: {
        x: -playerIso.x - TILE_WIDTH/2,
        y: -playerIso.y - TILE_HEIGHT/2,
        zoom: 1
      }
    }));
  };

  const handleRest = () => {
    setState(prev => ({
      ...prev,
      energy: prev.maxEnergy,
      day: prev.day + 1,
      time: 6, // Wake up at 6 AM
      playerPos: { x: 2, y: 2 }
    }));
    setNotification({ title: "Rested", msg: "A good night's sleep. You feel ready for more paperwork." });
  };

  const handleMine = (tileId: string) => {
    const activeMine = state.mines.find(m => m.id === state.activeMineId);
    if (!activeMine) return;

    const tileIndex = activeMine.grid.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return;

    const tile = activeMine.grid[tileIndex];
    
    // Check Permits
    const prospectingPermit = state.permits[activeMine.permits.prospectingId];
    const miningPermit = state.permits[activeMine.permits.miningId];

    const hasProspecting = prospectingPermit?.status === 'APPROVED';
    const hasMining = miningPermit?.status === 'APPROVED';

    if (activeMine.status === 'PROSPECTING') {
      if (!hasProspecting) {
        setNotification({
          title: "Unlicensed Observation",
          msg: `You need a ${prospectingPermit?.name || 'Prospecting License'} to survey this land.`
        });
        return;
      }

      if (activeMine.prospectingCount >= 10) {
        setNotification({
          title: "Survey Limit Reached",
          msg: "You have collected enough samples. Submit your findings to apply for a Mining Permit."
        });
        return;
      }

      // Reveal Logic
      setState(prev => {
        const newMines = [...prev.mines];
        const mineIndex = newMines.findIndex(m => m.id === prev.activeMineId);
        const newGrid = [...newMines[mineIndex].grid];
        
        newGrid[tileIndex] = { ...tile, revealed: true };
        
        newMines[mineIndex] = {
          ...newMines[mineIndex],
          grid: newGrid,
          prospectingCount: newMines[mineIndex].prospectingCount + 1
        };

        return {
          ...prev,
          mines: newMines,
          energy: Math.max(0, prev.energy - 1)
        };
      });
      return;
    }

    // Operational Mining Logic
    if (!hasMining) {
      setNotification({
        title: "Unlicensed Extraction",
        msg: `You need a ${miningPermit?.name || 'Mining Permit'} to extract resources.`
      });
      return;
    }

    if (state.energy < 5) {
      setNotification({ title: "Exhausted", msg: "You need more energy to mine." });
      return;
    }

    setState(prev => {
      const newMines = [...prev.mines];
      const mineIndex = newMines.findIndex(m => m.id === prev.activeMineId);
      const newGrid = [...newMines[mineIndex].grid];
      
      newGrid[tileIndex] = { ...tile, mined: true, revealed: true };
      
      newMines[mineIndex] = {
        ...newMines[mineIndex],
        grid: newGrid
      };

      let oreGain = 0;
      let moneyGain = 0;

      if (tile.type === 'ORE') {
        oreGain = activeMine.yield;
        moneyGain = activeMine.yield * 50;
      }

      return {
        ...prev,
        mines: newMines,
        energy: prev.energy - 5,
        ore: prev.ore + oreGain,
        money: prev.money + moneyGain,
        exposure: prev.meters.exposure + (activeMine.danger * 0.1)
      };
    });
    
    if (tile.type === 'ORE') {
      setNotification({ title: "Strike!", msg: `Found ${activeMine.yield} Ore worth $${activeMine.yield * 50}.` });
    }
  };

  const handleTravel = (mineId: string) => {
    const mine = state.mines.find(m => m.id === mineId);
    if (!mine) return;

    if (!mine.discovered) {
      setNotification({ title: "Unknown Location", msg: "You haven't discovered this location yet." });
      return;
    }

    const energyCost = mine.travelTime * 5;
    if (state.energy < energyCost) {
      setNotification({ title: "Too Exhausted", msg: `Traveling to ${mine.name} requires ${energyCost} energy.` });
      return;
    }

    setState(prev => ({
      ...prev,
      currentScene: 'MINE',
      activeMineId: mineId,
      energy: Math.max(0, prev.energy - energyCost),
      time: (prev.time + mine.travelTime) % 24
    }));

    setNotification({ title: "Travel Complete", msg: `You arrived at ${mine.name} after ${mine.travelTime} hours.` });
  };

  const handleDialogueAction = (action: (s: GameState) => Partial<GameState>) => {
    setState(s => {
      const result = action(s);
      const newState = { ...s, ...result };
      
      // Handle Social Consequences
      if (result.npcs && s.activeNPCId) {
        const activeNPC = s.npcs[s.activeNPCId];
        const newActiveNPC = newState.npcs[s.activeNPCId];
        
        // If trust increased
        if (newActiveNPC.trustLevel > activeNPC.trustLevel) {
          const gain = newActiveNPC.trustLevel - activeNPC.trustLevel;
          
          // Rivals get upset
          activeNPC.rivals.forEach(rivalId => {
            if (newState.npcs[rivalId]) {
              newState.npcs[rivalId] = {
                ...newState.npcs[rivalId],
                trustLevel: Math.max(0, newState.npcs[rivalId].trustLevel - gain * 0.5)
              };
              triggerFeedback(rivalId, -gain * 0.5, 'TRUST');
            }
          });

          // Allies get happy
          activeNPC.allies.forEach(allyId => {
            if (newState.npcs[allyId]) {
              newState.npcs[allyId] = {
                ...newState.npcs[allyId],
                trustLevel: Math.min(100, newState.npcs[allyId].trustLevel + gain * 0.3)
              };
              triggerFeedback(allyId, gain * 0.3, 'TRUST');
            }
          });
        }
      }

      return newState;
    });
  };

  const handlePermitAction = (id: string, action: 'SUBMIT' | 'PAY' | 'FAST_TRACK') => {
    const permit = state.permits[id];
    const standardCost = permit.status === 'REJECTED' ? 100 : permit.cost;

    if (action === 'FAST_TRACK' || action === 'SUBMIT') {
      const cost = action === 'FAST_TRACK' ? standardCost * 2 : standardCost;
      if (state.money < cost) {
        setNotification({ title: "Insufficient Funds", msg: `Filing this form requires $${cost}.` });
        return;
      }
      setState(prev => ({ 
        ...prev, 
        money: prev.money - cost,
        activeMiniGame: 'FORM_PROCESSING',
        pendingPermitAction: action
      }));
      return;
    }

    setState(prev => {
      if (prev.money < standardCost) return prev;

      return {
        ...prev,
        money: prev.money - standardCost,
        permits: {
          ...prev.permits,
          [id]: { ...permit, status: 'PENDING' }
        }
      };
    });
  };

  // Tutorial Logic
  useEffect(() => {
    // Step 0: Find Bureau (Handled by Discovery Effect below)
    
    // Step 1: Bureau Found -> Enter Office
    if (state.tutorialStep === 1 && state.currentScene === 'OFFICE') {
      setState(s => ({ ...s, tutorialStep: 2 }));
    }

    // Step 2: In Office -> Talk to Vane
    if (state.tutorialStep === 2 && state.activeNPCId === 'licensing') {
      // Advance is handled by Dialogue Tree (Vane gives permit)
    }

    // Step 3: Vane gave permit -> Open Permit
    if (state.tutorialStep === 3 && state.activePermitId === 'extraction-intent') {
      setState(s => ({ ...s, tutorialStep: 4 }));
    }

    // Step 4: Permit Open -> Submit
    if (state.tutorialStep === 4 && state.pendingPermitAction === 'SUBMIT') {
      setState(s => ({ ...s, tutorialStep: 5 }));
    }
    
    // Step 5: Submitted (Processing) -> Forced Rejection (Handled in MiniGameComplete)
    
    // Step 6: Rejected -> Talk to Vane again
    // Handled by user interaction
  }, [state.tutorialStep, state.currentScene, state.activeNPCId, state.activePermitId, state.pendingPermitAction]);

  const handleMiniGameComplete = (results: { accuracy: number; time: number }) => {
    setState(prev => {
      if (!prev.activePermitId) return { ...prev, activeMiniGame: null, pendingPermitAction: null };
      
      // TUTORIAL FORCED REJECTION
      if (prev.tutorialStep === 5) {
        setNotification({ 
          title: "FILING REJECTED", 
          msg: "Reason: 'Excessive Hopefulness'. You should speak to the Licensing Officer." 
        });
        return {
          ...prev,
          tutorialStep: 6,
          permits: {
            ...prev.permits,
            [prev.activePermitId]: { 
              ...prev.permits[prev.activePermitId], 
              status: 'REJECTED', 
              rejectionReason: "Ink color was 'Excessively Hopeful'.", 
              accuracy: results.accuracy 
            }
          },
          activeMiniGame: null,
          activePermitId: null,
          pendingPermitAction: null
        };
      }

      const permit = prev.permits[prev.activePermitId];
      if (!permit) {
        return { ...prev, activeMiniGame: null, activePermitId: null, pendingPermitAction: null };
      }
      const isFailed = results.accuracy < 0.6;
      
      if (isFailed) {
        setNotification({ 
          title: "FILING REJECTED", 
          msg: "Your accuracy was too low. The Bureau has discarded your application and kept the fee." 
        });
        return {
          ...prev,
          permits: {
            ...prev.permits,
            [prev.activePermitId]: { ...permit, status: 'REJECTED', rejectionReason: 'INSUFFICIENT ACCURACY', accuracy: results.accuracy }
          },
          activeMiniGame: null,
          activePermitId: null,
          pendingPermitAction: null
        };
      }

      const isPerfect = results.accuracy === 1 && results.time < 8;
      const isFast = results.time < 12;
      
      let moneyBonus = 0;
      let dirtBonus = 0;
      let trustBonus = 0;

      if (isPerfect) {
        moneyBonus = 200;
        dirtBonus = 3;
        trustBonus = 10;
      } else if (isFast) {
        moneyBonus = 100;
        dirtBonus = 1;
        trustBonus = 2;
      }

      const newPermits = { ...prev.permits };
      
      // If it's a fast track and we did perfectly, approve immediately.
      // Or if it's from a direct dialogue interaction.
      const approveImmediately = (prev.pendingPermitAction === 'FAST_TRACK' && results.accuracy > 0.9) || 
                                 (prev.pendingPermitAction === 'DIALOGUE');
      
      newPermits[prev.activePermitId] = {
        ...permit,
        status: approveImmediately ? 'APPROVED' : 'PENDING',
        accuracy: results.accuracy
      };

      const newMines = [...prev.mines];

      if (approveImmediately) {
        // Unlock logic
        if (prev.activePermitId === 'extraction-intent') {
          if (newPermits['prospecting-license']) {
            newPermits['prospecting-license'] = { ...newPermits['prospecting-license'], status: 'AVAILABLE' };
          }
        } else if (prev.activePermitId === 'prospecting-license') {
          if (newPermits['mining-permit-iron']) {
            newPermits['mining-permit-iron'] = { ...newPermits['mining-permit-iron'], status: 'AVAILABLE' };
          }
        } else if (prev.activePermitId === 'mining-permit-iron') {
          if (newPermits['prospecting-permit-deep']) {
            newPermits['prospecting-permit-deep'] = { ...newPermits['prospecting-permit-deep'], status: 'AVAILABLE' };
          }
          
          const ironMineIndex = newMines.findIndex(m => m.id === 'iron-vein');
          if (ironMineIndex !== -1) {
             newMines[ironMineIndex] = { ...newMines[ironMineIndex], status: 'OPERATIONAL' };
          }

          const deepHollowIndex = newMines.findIndex(m => m.id === 'deep-hollow');
          if (deepHollowIndex !== -1) {
            newMines[deepHollowIndex] = { ...newMines[deepHollowIndex], discovered: true, status: 'PROSPECTING' };
            setNotification({ title: "New Location Discovered", msg: "Deep Hollow is now accessible." });
          }
        } else if (prev.activePermitId === 'mining-permit-deep') {
           if (newPermits['prospecting-permit-abyss']) {
             newPermits['prospecting-permit-abyss'] = { ...newPermits['prospecting-permit-abyss'], status: 'AVAILABLE' };
           }
           
           const deepMineIndex = newMines.findIndex(m => m.id === 'deep-hollow');
           if (deepMineIndex !== -1) {
              newMines[deepMineIndex] = { ...newMines[deepMineIndex], status: 'OPERATIONAL' };
           }

           const abyssIndex = newMines.findIndex(m => m.id === 'abyssal-reach');
           if (abyssIndex !== -1) {
             newMines[abyssIndex] = { ...newMines[abyssIndex], discovered: true, status: 'PROSPECTING' };
             setNotification({ title: "New Location Discovered", msg: "Abyssal Reach is now accessible." });
           }
        }
      }

      setNotification({ 
        title: approveImmediately ? "IMMEDIATE APPROVAL" : "FILING SUBMITTED", 
        msg: approveImmediately 
          ? (prev.pendingPermitAction === 'DIALOGUE' 
              ? `Officer Vane stamped your license on the spot! Bonus: $${moneyBonus}, +${dirtBonus} Evidence.`
              : `Your perfect filing was approved instantly! Bonus: $${moneyBonus}, +${dirtBonus} Evidence.`)
          : `Form submitted with ${Math.round(results.accuracy * 100)}% accuracy. The Bureau will review it shortly.` 
      });

      return {
        ...prev,
        mines: newMines,
        money: prev.money + moneyBonus,
        evidence: prev.evidence + dirtBonus,
        meters: {
          ...prev.meters,
          trust: Math.min(100, prev.meters.trust + trustBonus)
        },
        permits: newPermits,
        activeMiniGame: null,
        activePermitId: null,
        pendingPermitAction: null
      };
    });
  };

  const handleTakePhoto = (itemId: string) => {
    const item = OFFICE_ITEMS[itemId];
    if (!item) return;

    if (state.dirtItems.some(d => d.id === `photo-${itemId}`)) return;
    
    if (state.energy < 2) {
      setNotification({ title: "Too Tired", msg: "You need 2 energy to focus the camera." });
      return;
    }

    setNotification({ title: "Evidence Secured", msg: "Photo added to leverage." });
    
    setState(prev => {
      const building = prev.activeBuildingId ? BUILDINGS[prev.activeBuildingId] : null;
      const targetNpcId = (building && building.npcId !== 'none') ? building.npcId : 'licensing';

      let dirtType: DirtType = 'PERMIT_VIOLATION';
      if (item.type === 'DIRT') dirtType = 'BACKROOM_DEAL';
      else if (item.type === 'EVENT') dirtType = 'PERSONAL_SECRET';

      const newDirt: DirtItem = {
        id: `photo-${itemId}`,
        type: dirtType,
        description: `Photo: ${item.name}`,
        targetNpcId,
        value: 15
      };

      return {
        ...prev,
        energy: prev.energy - 2,
        dirtItems: [...prev.dirtItems, newDirt],
        meters: { ...prev.meters, exposure: Math.min(100, prev.meters.exposure + 2) }
      };
    });
  };

  const handleFoundItem = (itemId: string) => {
    const item = OFFICE_ITEMS[itemId];
    if (!item) return;

    setState(prev => {
      if (prev.foundOfficeItemIds.includes(itemId)) return prev;

      let newState = {
        ...prev,
        foundOfficeItemIds: [...prev.foundOfficeItemIds, itemId]
      };

      if (item.type === 'DIRT') {
        const dirtId = `dirt-${itemId}-${Date.now()}`;
        newState.dirtItems = [...newState.dirtItems, {
          id: dirtId,
          type: 'PERMIT_VIOLATION',
          description: item.description,
          targetNpcId: prev.activeNPCId || 'licensing',
          value: 15
        }];
        setNotification({ title: "Evidence Collected", msg: `You found dirt: ${item.name}` });
      } else if (item.type === 'CLUE') {
        setNotification({ title: "Clue Discovered", msg: item.name });
      }

      return newState;
    });
  };

  const activeNPC = useMemo(() => 
    state.activeNPCId ? state.npcs[state.activeNPCId] : null, 
    [state.activeNPCId, state.npcs]
  );

  const activePermit = useMemo(() => 
    state.activePermitId ? state.permits[state.activePermitId] : null, 
    [state.activePermitId, state.permits]
  );

  const handleTravelTo = (buildingId: string) => {
    const building = BUILDINGS[buildingId];
    if (!building) return;

    setState(prev => ({
      ...prev,
      activeBuildingId: buildingId,
      currentScene: 'OFFICE',
      // Optional: Teleport player to building location
      playerPos: building.pos,
      // Ensure exploration is active if it has items and hasn't been fully explored?
      // Or just default to exploration view
      explorationActive: building.explorationItems && building.explorationItems.length > 0
    }));
  };

  return (
    <div className="h-[100dvh] flex flex-col max-w-md mx-auto bg-bureau-bg shadow-2xl relative overflow-hidden">
      <Header state={state} />

      <AnimatePresence mode="wait">
        {state.currentScene === 'MINE' ? (
          <motion.div 
            key="mine"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <MineScene 
              state={state} 
              onMine={handleMine} 
              onInteract={(npcId) => setState(s => ({ ...s, activeNPCId: npcId }))}
              onReturn={() => setState(s => ({ ...s, currentScene: 'WORLD', activeMineId: null }))}
            />
          </motion.div>
        ) : state.currentScene === 'WORLD' ? (
          <motion.div 
            key="world"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col overflow-hidden touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            <WorldScene 
              state={state} 
              onMove={handleMove}
              onInteract={(npcId, bId) => {
                const building = BUILDINGS[bId];
                const hasExploration = building?.explorationItems && building.explorationItems.length > 0;
                setState(s => ({ 
                  ...s, 
                  activeNPCId: null, // Don't auto-select NPC
                  activeBuildingId: bId,
                  explorationActive: hasExploration ? true : false,
                  currentScene: 'OFFICE'
                }));
              }}
              onEnterHome={handleRest}
              onEnterMine={() => setState(s => ({ ...s, currentScene: 'MINE' }))}
              onRecenter={handleRecenter}
              onTravel={handleTravel}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="office"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <OfficeScene 
              state={state} 
              onSelectNPC={(id) => setState(s => ({ ...s, activeNPCId: id }))}
              onSelectPermit={(id) => setState(s => ({ ...s, activePermitId: id }))}
              onFoundItem={handleFoundItem}
              onTakePhoto={handleTakePhoto}
              onExplorationComplete={() => setState(s => ({ ...s, explorationActive: false }))}
              onTravelTo={handleTravelTo}
              onBackToDirectory={() => setState(s => ({ ...s, activeBuildingId: null }))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {state.tutorialStep < 8 && state.tutorialStep >= 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none flex justify-center"
          >
            <div className={`bg-blue-600 text-white rounded-xl shadow-2xl border-2 border-white/20 flex flex-col pointer-events-auto transition-all duration-300 w-full max-w-sm overflow-hidden
              ${state.tutorialMinimized ? 'h-10' : 'p-4'}
            `}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-black text-[10px]
                  ${state.tutorialMinimized ? 'ml-2' : ''}
                `}>
                  {state.tutorialStep + 1}
                </div>
                
                <div className="flex-1 flex items-center justify-between">
                  <h3 className="font-black uppercase tracking-widest text-[10px] text-blue-200">
                    {state.tutorialMinimized ? `Tutorial: Step ${state.tutorialStep + 1}` : 'Onboarding'}
                  </h3>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setState(s => ({ ...s, tutorialMinimized: !s.tutorialMinimized }))}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {state.tutorialMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button 
                      onClick={() => setState(s => ({ ...s, tutorialStep: 99 }))}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {!state.tutorialMinimized && (
                <div className="mt-3 flex gap-4 items-start">
                  <div className="flex-1">
                    <p className="text-xs font-bold leading-tight">
                      {state.tutorialStep === 0 && "Welcome. You need a permit. Find the Bureau of Extraction (East of home)."}
                      {state.tutorialStep === 1 && "You found the Bureau! Tap the building to enter."}
                      {state.tutorialStep === 2 && "Talk to Officer Vane to request a permit application."}
                      {state.tutorialStep === 3 && "Vane authorized Form 17-B. Open the 'Active Filings' list."}
                      {state.tutorialStep === 4 && "Select 'Extraction Intent' and Submit Filing."}
                      {state.tutorialStep === 5 && "Processing..."}
                      {state.tutorialStep === 6 && "Rejected! Typical. Talk to Vane again to sort this out."}
                      {state.tutorialStep === 7 && "Use your knowledge of Vane's desire for status to get approved."}
                    </p>
                    
                    {state.tutorialStep === 0 && (
                      <button 
                        onClick={() => setState(s => ({ ...s, tutorialStep: 1 }))}
                        className="mt-3 px-3 py-1.5 bg-white text-blue-600 rounded-lg font-black text-[10px] uppercase hover:bg-blue-50 transition-colors"
                      >
                        Start Journey
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation - Locked to bottom */}
      <nav className="shrink-0 pb-[env(safe-area-inset-bottom)] bg-white/80 backdrop-blur-xl border-t border-black/10 flex justify-around items-center p-4 z-40">
        <button 
          onClick={() => setState(s => ({ ...s, currentScene: 'MINE' }))}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${state.currentScene === 'MINE' ? 'text-black' : 'text-black/30'}`}
        >
          <Pickaxe size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">Mine</span>
        </button>
        <button 
          onClick={() => setState(s => ({ ...s, currentScene: 'WORLD' }))}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${state.currentScene === 'WORLD' ? 'text-black' : 'text-black/30'}`}
        >
          <Users size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">World</span>
        </button>
        {state.currentScene === 'OFFICE' && (
          <button 
            onClick={() => setState(s => ({ ...s, currentScene: 'OFFICE' }))}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${state.currentScene === 'OFFICE' ? 'text-black' : 'text-black/30'}`}
          >
            <Briefcase size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Office</span>
          </button>
        )}
        <button 
          onClick={() => {
            if (state.ore > 0) {
              setState(s => ({
                ...s,
                money: s.money + (s.ore * 150),
                ore: 0,
                meters: { ...s.meters, exposure: Math.min(100, s.meters.exposure + 5) }
              }));
              setNotification({ title: "Export Successful", msg: `Sold ore for $${state.ore * 150}. Bureau takes its cut.` });
            }
          }}
          className="flex flex-col items-center gap-1 text-black/30 hover:text-emerald-600 active:scale-90 transition-all"
        >
          <TrendingUp size={22} />
          <span className="text-[9px] font-black uppercase tracking-widest">Export</span>
        </button>
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {activeNPC && (
          <DialogueOverlay 
            key="dialogue-overlay"
            npc={activeNPC} 
            state={state}
            onClose={() => setState(s => ({ ...s, activeNPCId: null }))} 
            onAction={handleDialogueAction}
            triggerFeedback={triggerFeedback}
          />
        )}
        {activePermit && (
          <PermitOverlay 
            key="permit-overlay"
            permit={activePermit} 
            onAction={handlePermitAction}
            onClose={() => setState(s => ({ ...s, activePermitId: null }))} 
            tutorialStep={state.tutorialStep}
          />
        )}
        {state.activeMiniGame === 'FORM_PROCESSING' && (
          <FormMiniGame 
            key="form-minigame"
            onComplete={handleMiniGameComplete}
            onCancel={() => setState(s => ({ ...s, activeMiniGame: null }))}
          />
        )}
        {notification && (
          <motion.div 
            key="notification-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-[100] bg-black text-white p-4 rounded-xl shadow-2xl flex gap-3 items-start"
          >
            <ShieldAlert className="text-amber-400 shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm">{notification.title}</h4>
              <p className="text-xs opacity-80">{notification.msg}</p>
            </div>
            <button onClick={() => setNotification(null)}><X size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
