import { BaseSimSystem } from '../Simulation';
import { GameState, GameStep, BuildingType, SfxType } from '../../../types';
import { FixedContext } from '../../kernel/Types';
import { BUILDINGS } from '../../data/VoxelConstants';

interface DemoTask {
    delay: number; // in seconds
    run: (ctx: FixedContext, state: GameState) => void;
}

export class TutorialDemoSystem extends BaseSimSystem {
    readonly id = 'tutorial_demo';
    readonly priority = 200;

    private tasks: DemoTask[] = [];
    private elapsedSinceStart = 0;
    private hasStarted = false;

    tick(ctx: FixedContext, state: GameState): void {
        // Only run if step is DEMO
        if (state.step !== GameStep.DEMO) {
            this.hasStarted = false;
            this.tasks = [];
            this.elapsedSinceStart = 0;
            return;
        }

        if (!this.hasStarted) {
            this.startDemoDemo(ctx, state);
            this.hasStarted = true;
        }

        const dt = 1 / 60; // Approximate dt
        this.elapsedSinceStart += dt;

        // Process tasks
        for (let i = this.tasks.length - 1; i >= 0; i--) {
            const task = this.tasks[i];
            if (this.elapsedSinceStart >= task.delay) {
                task.run(ctx, state);
                this.tasks.splice(i, 1);
            }
        }
    }

    private startDemoDemo(ctx: FixedContext, state: GameState): void {
        this.tasks = [];
        this.elapsedSinceStart = 0;

        state.newsFeed = [];
        this.notify(ctx, state, "INITIALIZING SOLARIS DEMO SEQUENCE...", "NEUTRAL");

        let cx = 10;
        let cz = 10;

        // Collect buildings
        const buildingTypes = Object.values(BuildingType) as BuildingType[];
        const withUpgrades: BuildingType[] = [];
        const withoutUpgrades: BuildingType[] = [];

        for (const type of buildingTypes) {
            if (type === BuildingType.EMPTY || type.startsWith('D_')) continue;
            
            const def = BUILDINGS[type];
            if (def && def.upgrades && def.upgrades.length > 0) {
                withUpgrades.push(type);
            } else {
                withoutUpgrades.push(type);
            }
        }

        let currentZ = 0;

        // Initial Paving for the table part
        this.addTask(0.1, (c, s) => {
            // Main vertical road spine for the table section
            for (let z = -5; z < currentZ + withUpgrades.length * 6; z++) {
                this.pushPlacement(c, s, { x: cx - 1, z: cz + z }, BuildingType.ROAD);
            }
        });

        const CELL_SIZE = 5; // A 5x5 bounding box for each building level ensuring a 4x4 + 1 road border
        
        // 1. Table/Row layout for buildings WITH upgrades matching Grid Sketch
        withUpgrades.forEach((type, rIndex) => {
            const def = BUILDINGS[type];
            if (!def) return;
            const maxLevel = (def.upgrades?.length || 0) + 1;

            this.addTask(0.1, (c, s) => {
                // Horizontal Roads defining the Top and Bottom of the Row cells
                for (let x = 0; x <= (maxLevel * CELL_SIZE); x++) {
                    this.pushPlacement(c, s, { x: cx + x, z: cz + currentZ - 1 }, BuildingType.ROAD);
                    this.pushPlacement(c, s, { x: cx + x, z: cz + currentZ + CELL_SIZE - 1 }, BuildingType.ROAD);
                }

                // Vertical Cross-Roads dividing the columns
                for (let col = 0; col <= maxLevel; col++) {
                    for (let z = -1; z < CELL_SIZE; z++) {
                         this.pushPlacement(c, s, { x: cx + (col * CELL_SIZE), z: cz + currentZ + z }, BuildingType.ROAD);
                    }
                }

                // Place Level 1 buildings centered in the cells across the row
                for (let level = 1; level <= maxLevel; level++) {
                   const cellX = cx + ((level - 1) * CELL_SIZE) + 1; // offset past vertical road
                   const cellZ = cz + currentZ;
                   // Just plop a level 1 building everywhere first (instant)
                   this.pushPlacement(c, s, { x: cellX, z: cellZ }, type, 1);
                }
            });

            // Iterate upgrades over time using Gem Speedups 
            for (let colLevel = 2; colLevel <= maxLevel; colLevel++) {
                 const cellX = cx + ((colLevel - 1) * CELL_SIZE) + 1;
                 const cellZ = cz + currentZ;
                 
                 // Apply upgrades up to the target colLevel
                 // This effectively loops to run upgrade -> speedup -> upgrade -> speedup 
                 for(let u = 1; u < colLevel; u++) {
                     const delay = 0.5 + (0.3 * u);
                     
                     // Hit Upgrade
                     this.addTask(0.5 + delay, (cCtx, state) => {
                         state.commandQueue.push({
                            id: cCtx.getNextId?.('demo_upg') || `upg_${Date.now()}_${Math.random()}`,
                            type: 'UPGRADE_BUILDING',
                            payload: { x: cellX, z: cellZ }
                         });
                     });

                     // Provide Gems to Speed Up
                     this.addTask(0.5 + delay + 0.1, (cCtx, state) => {
                        state.commandQueue.push({
                            id: cCtx.getNextId?.('demo_spd') || `spd_${Date.now()}_${Math.random()}`,
                            type: 'SPEED_UP',
                            payload: { x: cellX, z: cellZ }
                        });
                     });
                 }
            }

            currentZ += CELL_SIZE;
        });

        // 2. Spiral layout for buildings WITHOUT upgrades
        this.addTask(0.5, () => {}); 

        let spiralX = 0;
        let spiralZ = 0;
        let dx = 0;
        let dz = -1;
        let stepCount = 0;
        let segmentLength = 1;
        let currentSegment = 0;
        
        // Let's center the spiral further down
        currentZ += 10;
        
        withoutUpgrades.forEach((type) => {
            const def = BUILDINGS[type];
            if (!def) return;

            this.addTask(0.1, (c, s) => {
                // Use larger steps for the spiral to account for building sizes (approx 6 blocks per step)
                const placementX = cx + spiralX * 6;
                const placementZ = cz + currentZ + spiralZ * 6;
                
                this.pushPlacement(c, s, { x: placementX, z: placementZ }, type, 1);
                
                // Add a small piece of road leading to it
                this.pushPlacement(c, s, { x: placementX - 1, z: placementZ }, BuildingType.ROAD);
                
                // Calculate next position in the spiral
                spiralX += dx;
                spiralZ += dz;
                currentSegment++;
                
                if (currentSegment === segmentLength) {
                    currentSegment = 0;
                    // Rotate 90 degrees clockwise
                    const tempDx = dx;
                    dx = -dz;
                    dz = tempDx;
                    stepCount++;
                    
                    if (stepCount === 2) {
                        stepCount = 0;
                        segmentLength++;
                    }
                }
            });
        });

        this.addTask(5.0, (c, s) => {
            s.step = GameStep.PLAYING;
            this.notify(c, s, "CATALOGUE COMPLETE. ENJOY THE VIEW.", "POSITIVE");
        });
    }

    private addTask(delay: number, run: (ctx: FixedContext, s: GameState) => void) {
        this.tasks.push({ delay, run });
    }

    private notify(ctx: FixedContext, state: GameState, message: string, type: any): void {
        state.newsFeed.unshift({
            id: ctx.getNextId?.('demo_msg') || `msg_${Date.now()}_${Math.random()}`,
            headline: message,
            type: type,
            timestamp: state.tickCount
        });
    }

    private pushPlacement(ctx: FixedContext, state: GameState, coord: { x: number, z: number }, type: BuildingType, level: number = 1): void {
        state.commandQueue.push({
            id: ctx.getNextId?.('demo_cmd') || `demo_${Date.now()}_${type}_${coord.x}_${coord.z}_${Math.random()}`,
            type: 'PLACE_BUILDING',
            payload: { x: coord.x, z: coord.z, buildingType: type, isInstant: true, level }
        });
        state.pendingEffects.push({ type: 'AUDIO', sfx: SfxType.BUILD_START });
    }
}
