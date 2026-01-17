
import * as THREE from 'three';
import { Agent, AgentRole } from '../../../types';
import { createAgentGroup } from '../../../engine/data/voxels/Agent';
import { createEagle } from '../../../engine/data/voxels/Eagle';

// Status indicator configuration
const STATUS_CONFIG = {
    height: 0.7,           // Height above agent
    scale: 0.15,           // Base scale of indicators
    warningThreshold: 30,  // Show warning below this need level
    criticalThreshold: 15, // Critical warning level
};

// Icon mappings (Same as AgentManager)
const STATE_ICONS: Record<string, string> = {
    'MOVING': '🚶',
    'WORKING': '🔨',
    'SLEEPING': '💤',
    'EATING': '🍔',
    'RELAXING': '☕',
    'SOCIALIZING': '💬',
    'PATROLLING': '👁️',
    'IDLE': '⏳',
    'OFF_DUTY': '🌙',
};

const ROLE_ICONS: Record<AgentRole, { icon: string; color: string }> = {
    'ENGINEER': { icon: '🔧', color: '#3b82f6' },
    'MINER': { icon: '⛏️', color: '#ef4444' },
    'BOTANIST': { icon: '🌿', color: '#22c55e' },
    'SECURITY': { icon: '🛡️', color: '#e11d48' },
    'WORKER': { icon: '👷', color: '#f59e0b' },
    'ILLEGAL_MINER': { icon: '👤', color: '#0f172a' },
};

const WARNING_ICONS = {
    energy: '😴',
    hunger: '🍽️',
    mood: '😟',
};

export class AgentRenderSystem {
    private scene: THREE.Scene;
    private gridSize: number;
    private getHeightAt: (x: number, z: number) => number;

    private agentMeshes: Map<string, THREE.Group> = new Map();
    private statusSprites: Map<string, THREE.Group> = new Map();
    private spriteTextures: Map<string, THREE.CanvasTexture> = new Map();

    private agentSelectionRing: THREE.Mesh;
    private eagle: THREE.Group | null = null;

    // State
    private selectedAgentId: string | null = null;
    private lastTime: number = 0;

    constructor(
        scene: THREE.Scene,
        gridSize: number,
        getHeightAt: (x: number, z: number) => number
    ) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.getHeightAt = getHeightAt;

        // Selection Ring
        this.agentSelectionRing = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.25, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
        );
        this.agentSelectionRing.rotation.x = -Math.PI / 2;
        this.agentSelectionRing.visible = false;
        this.scene.add(this.agentSelectionRing);

        // Eagle
        // Eagle (Disabled)
        // this.eagle = createEagle();
        // this.eagle.visible = true;
        // const range = (this.gridSize / 2) * 0.8;
        // this.eagle.position.set((Math.random() - 0.5) * 2 * range, 30, (Math.random() - 0.5) * 2 * range);
        // this.scene.add(this.eagle);
    }

    public update(dt: number, totalTime: number, agents: Agent[], zoomLevel: number = 20, viewMode: 'SURFACE' | 'UNDERGROUND' | 'FIRST_PERSON' = 'SURFACE') {
        // Sync Agents
        this.syncMeshes(agents);

        // Animate
        this.animate(dt, totalTime, zoomLevel, viewMode);
    }

    public setSelectedAgent(id: string | null) {
        this.selectedAgentId = id;
    }

    public getMeshes(): THREE.Object3D[] {
        return Array.from(this.agentMeshes.values());
    }

    /**
     * Swap the scene agents are rendered into.
     * Useful for migration when switching from an overlay to the main scene.
     */
    public setScene(scene: THREE.Scene) {
        if (this.scene === scene) return;

        this.agentMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            scene.add(mesh);
        });
        this.statusSprites.forEach(sprite => {
            this.scene.remove(sprite);
            scene.add(sprite);
        });
        if (this.eagle) {
            this.scene.remove(this.eagle);
            scene.add(this.eagle);
        }
        this.scene.remove(this.agentSelectionRing);
        scene.add(this.agentSelectionRing);

        this.scene = scene;
    }

    public dispose() {
        this.agentMeshes.forEach(mesh => this.scene.remove(mesh));
        this.statusSprites.forEach(sprite => this.scene.remove(sprite));
        if (this.eagle) this.scene.remove(this.eagle);
        this.scene.remove(this.agentSelectionRing);
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    private syncMeshes(agents: Agent[]) {
        const offset = (this.gridSize - 1) / 2;
        const seen = new Set<string>();

        agents.forEach(agent => {
            seen.add(agent.id);
            let meshGroup = this.agentMeshes.get(agent.id);

            // Recreate if role changed
            if (meshGroup && meshGroup.userData.role !== agent.type) {
                this.scene.remove(meshGroup);
                this.agentMeshes.delete(agent.id);
                const statusGroup = this.statusSprites.get(agent.id);
                if (statusGroup) {
                    this.scene.remove(statusGroup);
                    this.statusSprites.delete(agent.id);
                }
                meshGroup = undefined;
            }

            if (!meshGroup) {
                meshGroup = createAgentGroup(agent);
                meshGroup.userData.agentId = agent.id;
                meshGroup.userData.role = agent.type;
                this.scene.add(meshGroup);
                this.agentMeshes.set(agent.id, meshGroup);

                const statusGroup = this.createStatusGroup(agent);
                this.scene.add(statusGroup);
                this.statusSprites.set(agent.id, statusGroup);
            }

            // Calculate Position
            const x = agent.visualX ?? agent.x;
            const z = agent.visualZ ?? agent.z;
            const worldX = x - offset;
            const worldZ = z - offset;

            // Target Rotation Logic
            let targetRot = meshGroup.userData.targetRot ?? meshGroup.rotation.y;
            const prevX = meshGroup.userData.prevX ?? worldX;
            const prevZ = meshGroup.userData.prevZ ?? worldZ;

            if (agent.state === 'MOVING') {
                if (agent.path && agent.path.length > 0) {
                    const nextWaypoint = agent.path[0];
                    const nextX = (nextWaypoint.index % this.gridSize) - offset;
                    const nextZ = Math.floor(nextWaypoint.index / this.gridSize) - offset;
                    targetRot = Math.atan2(nextX - worldX, nextZ - worldZ);
                } else {
                    const dx = worldX - prevX;
                    const dz = worldZ - prevZ;
                    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
                        targetRot = Math.atan2(dx, dz);
                    }
                }
            } else if ((agent.state === 'WORKING' || agent.state === 'SOCIALIZING') && agent.targetTileId !== null) {
                const tx = (agent.targetTileId % this.gridSize) - offset;
                const tz = Math.floor(agent.targetTileId / this.gridSize) - offset;
                targetRot = Math.atan2(tx - worldX, tz - worldZ);
            }

            meshGroup.userData = {
                ...meshGroup.userData,
                targetPos: new THREE.Vector3(worldX, 0, worldZ),
                agentState: agent.state,
                targetRot: targetRot,
                prevX: worldX,
                prevZ: worldZ,
                agentData: agent
            };
        });

        // Cleanup removed
        this.agentMeshes.forEach((m, id) => {
            if (!seen.has(id)) {
                this.scene.remove(m);
                this.agentMeshes.delete(id);
                const s = this.statusSprites.get(id);
                if (s) {
                    this.scene.remove(s);
                    this.statusSprites.delete(id);
                }
            }
        });
    }

    private animate(dt: number, time: number, zoomLevel: number, viewMode: 'SURFACE' | 'UNDERGROUND' | 'FIRST_PERSON' = 'SURFACE') {
        const LOD_LOW = 160;

        // Eagle
        if (this.eagle) {
            if (zoomLevel > LOD_LOW || viewMode === 'UNDERGROUND') {
                this.eagle.visible = false;
            } else {
                this.eagle.visible = true;
                this.updateEagle(dt, time, zoomLevel);
            }
        }

        // Agents
        this.agentMeshes.forEach((meshGroup, agentId) => {
            const targetPos = meshGroup.userData.targetPos;
            const agentData = meshGroup.userData.agentData as Agent;
            const layerOffset = agentData?.layer || 0;

            // NEW: Visibility filter based on layer and viewMode
            if (viewMode === 'UNDERGROUND') {
                // Hide agents on surface (layer 0) when underground
                meshGroup.visible = (layerOffset < 0);
            } else {
                // Hide agents deep underground when on surface
                meshGroup.visible = (layerOffset === 0);
            }

            // Pos Lerp
            if (targetPos) {
                meshGroup.position.x = THREE.MathUtils.lerp(meshGroup.position.x, targetPos.x, 0.15);
                meshGroup.position.z = THREE.MathUtils.lerp(meshGroup.position.z, targetPos.z, 0.15);
                const h = this.getHeightAt(meshGroup.position.x, meshGroup.position.z);
                meshGroup.position.y = THREE.MathUtils.lerp(meshGroup.position.y, h + layerOffset + 0.05, 0.3);
            }

            // Rot Lerp
            const targetRot = meshGroup.userData.targetRot;
            if (targetRot !== undefined && !isNaN(targetRot)) {
                let diff = targetRot - meshGroup.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                meshGroup.rotation.y += THREE.MathUtils.lerp(0, diff, 0.12);
            }

            // Status Indicators
            const statusGroup = this.statusSprites.get(agentId);
            if (statusGroup) {
                statusGroup.position.set(meshGroup.position.x, meshGroup.position.y + STATUS_CONFIG.height, meshGroup.position.z);
                if (meshGroup.userData.agentData) {
                    this.updateStatusIndicators(meshGroup.userData.agentData, statusGroup, time);
                }
                statusGroup.visible = meshGroup.visible && zoomLevel <= 130;
            }

            // Selection Ring
            if (this.selectedAgentId === agentId) {
                this.agentSelectionRing.position.set(meshGroup.position.x, meshGroup.position.y + 0.02, meshGroup.position.z);
                this.agentSelectionRing.scale.setScalar(1 + Math.sin(time * 10) * 0.05);
                this.agentSelectionRing.visible = meshGroup.visible;
            }

            // Animations (Simple/LOD aware)
            this.updateAgentAnimation(meshGroup, time, zoomLevel, agentId);
        });

        if (!this.agentMeshes.has(this.selectedAgentId || '') || !this.agentMeshes.get(this.selectedAgentId!)?.visible) {
            this.agentSelectionRing.visible = false;
        }
    }

    private updateAgentAnimation(mesh: THREE.Group, time: number, zoomLevel: number, agentId: string) {
        const state = mesh.userData.agentState;
        const parts = mesh.userData.parts;
        if (!parts) return;

        const idSeed = agentId.charCodeAt(0) * 0.1;
        const localTime = time + idSeed; // Offset for variety

        if (zoomLevel > 140) return; // Static when far

        if (state === 'MOVING') {
            const speed = 12;
            const walk = Math.sin(localTime * speed);

            // Legs
            if (parts.legL) parts.legL.rotation.x = -walk * 0.6;
            if (parts.legR) parts.legR.rotation.x = walk * 0.6;

            // Arms (opposite to legs)
            if (parts.armL) parts.armL.rotation.x = walk * 0.4;
            if (parts.armR) parts.armR.rotation.x = -walk * 0.4;

            // Subtle body bobbing
            mesh.position.y += Math.abs(walk) * 0.02;
        } else if (state === 'WORKING') {
            const speed = 15;
            const work = Math.sin(localTime * speed);

            // Hammering/working motion with right arm
            if (parts.armR) parts.armR.rotation.x = -0.5 + work * 0.8;
            if (parts.armL) parts.armL.rotation.x = 0.2;

            // Reset legs
            if (parts.legL) parts.legL.rotation.x = 0;
            if (parts.legR) parts.legR.rotation.x = 0;
        } else {
            // Idle breathing / bobbing
            const breathe = Math.sin(localTime * 2);

            // Very subtle arm movement
            if (parts.armL) parts.armL.rotation.x = breathe * 0.05;
            if (parts.armR) parts.armR.rotation.x = breathe * 0.05;

            // Reset legs
            if (parts.legL) parts.legL.rotation.x = 0;
            if (parts.legR) parts.legR.rotation.x = 0;

            // Head tilt
            if (parts.head) parts.head.rotation.z = Math.sin(localTime * 0.5) * 0.1;
        }
    }

    private updateEagle(dt: number, time: number, zoomLevel: number) {
        if (!this.eagle) return;
        if (typeof this.eagle.userData.angle === 'undefined') this.eagle.userData.angle = 0;

        this.eagle.userData.angle += 0.2 * dt; // approx
        const t = this.eagle.userData.angle;

        const r = 16 + Math.sin(time * 0.1) * 6;
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r;
        const y = 32 + Math.sin(time * 0.3) * 2;

        this.eagle.position.set(x, y, z);

        const dx = -Math.sin(t);
        const dz = Math.cos(t);
        this.eagle.rotation.y = Math.atan2(dx, dz);
    }

    // Helper functions
    private createIconTexture(icon: string, bgColor?: string): THREE.CanvasTexture {
        const cacheKey = `${icon}_${bgColor || 'none'}`;
        if (this.spriteTextures.has(cacheKey)) return this.spriteTextures.get(cacheKey)!;

        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        if (bgColor) {
            ctx.fillStyle = bgColor;
            ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        }

        ctx.font = bgColor ? '28px Arial' : '40px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(icon, 32, 32);

        const tex = new THREE.CanvasTexture(canvas);
        this.spriteTextures.set(cacheKey, tex);
        return tex;
    }

    private createStatusGroup(agent: Agent): THREE.Group {
        const group = new THREE.Group();

        const roleConfig = ROLE_ICONS[agent.type] || ROLE_ICONS['WORKER'];
        const roleMat = new THREE.SpriteMaterial({ map: this.createIconTexture(roleConfig.icon, roleConfig.color), depthTest: false });
        const roleSprite = new THREE.Sprite(roleMat);
        roleSprite.scale.setScalar(STATUS_CONFIG.scale * 0.8);
        roleSprite.position.set(-0.12, 0, 0);
        group.add(roleSprite);

        const stateMat = new THREE.SpriteMaterial({ map: this.createIconTexture(STATE_ICONS['IDLE']), depthTest: false });
        const stateSprite = new THREE.Sprite(stateMat);
        stateSprite.name = 'stateSprite';
        stateSprite.scale.setScalar(STATUS_CONFIG.scale);
        stateSprite.position.set(0.05, 0, 0);
        group.add(stateSprite);

        return group;
    }

    private updateStatusIndicators(agent: Agent, group: THREE.Group, time: number) {
        const stateSprite = group.getObjectByName('stateSprite') as THREE.Sprite;
        if (stateSprite) {
            const icon = STATE_ICONS[agent.state] || STATE_ICONS.IDLE;
            (stateSprite.material as THREE.SpriteMaterial).map = this.createIconTexture(icon);
        }
    }
}
