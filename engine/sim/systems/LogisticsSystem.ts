
import { BaseSimSystem } from '../Simulation';
import { FixedContext } from '../../kernel';
import { BuildingType, FactoryNodeState, FactoryResourceType, FactoryState, GameState } from '../../../types';
import { updateWaterConnectivity } from '../../utils/GameUtils';
import { ChunkStore } from '../../space/ChunkStore';

export class LogisticsSystem extends BaseSimSystem {
    readonly id = 'logistics';
    readonly priority = 20;

    private lastExplorationUpdate = 0;
    private lastWaterUpdate = 0;
    private lastFactoryUpdate = 0;
    private readonly FACTORY_INTERVAL = 0.2;
    private readonly MAX_ROUTE_DEPTH = 18;

    tick(ctx: FixedContext, state: GameState): void {
        const chunks = state.chunks;
        if (!chunks) return;

        if (ctx.time - this.lastExplorationUpdate > 0.2) {
            this.lastExplorationUpdate = ctx.time;
            this.updateExploration(state);
        }

        if (ctx.time - this.lastWaterUpdate > 1.0) {
            this.lastWaterUpdate = ctx.time;
            updateWaterConnectivity(state.chunks);
        }

        if (ctx.time - this.lastFactoryUpdate > this.FACTORY_INTERVAL) {
            this.lastFactoryUpdate = ctx.time;
            const factory = this.getFactoryState(state);
            this.syncFactoryNodes(state, factory);
            this.routeFactoryResources(state, factory);
        }
    }

    private getFactoryState(state: GameState): FactoryState {
        if (!state.factory) {
            state.factory = {
                nodes: {},
                throughput: 0,
                backlog: 0,
                stalledNodes: 0,
                lastNetworkTick: 0,
            };
        }

        return state.factory;
    }

    private isFactoryBuilding(type: BuildingType): boolean {
        return [
            BuildingType.MINING_HEADFRAME,
            BuildingType.WASH_PLANT,
            BuildingType.RECYCLING_PLANT,
            BuildingType.ORE_FOUNDRY,
            BuildingType.GEM_REFINERY,
            BuildingType.SAWMILL,
            BuildingType.STONE_QUARRY,
            BuildingType.RAIL_LINE,
            BuildingType.STORAGE_DEPOT,
            BuildingType.STOCKPILE,
            BuildingType.TRAIN_STATION,
            BuildingType.DISTRIBUTION_HUB,
        ].includes(type);
    }

    private getNodeMode(type: BuildingType): FactoryNodeState['mode'] | null {
        if (type === BuildingType.RAIL_LINE || type === BuildingType.DISTRIBUTION_HUB) return 'TRANSPORT';
        if ([BuildingType.STORAGE_DEPOT, BuildingType.STOCKPILE, BuildingType.TRAIN_STATION].includes(type)) return 'SINK';
        if ([BuildingType.WASH_PLANT, BuildingType.RECYCLING_PLANT, BuildingType.ORE_FOUNDRY, BuildingType.GEM_REFINERY].includes(type)) return 'PROCESSOR';
        if ([BuildingType.MINING_HEADFRAME, BuildingType.SAWMILL, BuildingType.STONE_QUARRY].includes(type)) return 'SOURCE';
        return null;
    }

    private syncFactoryNodes(state: GameState, factory: FactoryState): void {
        const seen = new Set<string>();

        for (const chunk of Object.values(state.chunks)) {
            for (const tile of chunk.tiles) {
                if (tile.isUnderConstruction) continue;
                if (tile.structureHeadX !== undefined && (tile.x !== tile.structureHeadX || tile.z !== tile.structureHeadZ)) continue;
                if (!this.isFactoryBuilding(tile.buildingType)) continue;

                const mode = this.getNodeMode(tile.buildingType);
                if (!mode) continue;

                const key = `${tile.x},${tile.z}`;
                seen.add(key);

                const existing = factory.nodes[key];
                if (!existing || existing.buildingType !== tile.buildingType || existing.mode !== mode) {
                    factory.nodes[key] = {
                        key,
                        x: tile.x,
                        z: tile.z,
                        buildingType: tile.buildingType,
                        mode,
                        buffer: existing?.buffer || {},
                        inputBuffer: existing?.inputBuffer || {},
                        stalledTicks: existing?.stalledTicks || 0,
                        lastActiveTick: existing?.lastActiveTick || state.tickCount,
                    };
                }
            }
        }

        Object.keys(factory.nodes).forEach((key) => {
            if (!seen.has(key)) {
                delete factory.nodes[key];
            }
        });
    }

    private routeFactoryResources(state: GameState, factory: FactoryState): void {
        const pendingInbound: Array<{ to: FactoryNodeState; resource: FactoryResourceType; amount: number; target: 'buffer' | 'input' }> = [];
        const stalledNodeKeys = new Set<string>();
        let throughput = 0;

        for (const node of Object.values(factory.nodes)) {
            for (const [resource, rawAmount] of Object.entries(node.buffer) as Array<[FactoryResourceType, number]>) {
                if (!rawAmount || rawAmount < 0.25) continue;

                const route = this.findRoute(factory, node, resource);
                if (!route) {
                    stalledNodeKeys.add(node.key);
                    node.stalledTicks += 1;
                    continue;
                }

                const amount = Math.min(rawAmount, this.getTransferBudget(node), this.getCapacityLeft(route.node, route.target));
                if (amount <= 0) {
                    stalledNodeKeys.add(node.key);
                    continue;
                }

                node.buffer[resource] = rawAmount - amount;
                if (node.buffer[resource]! <= 0.001) {
                    delete node.buffer[resource];
                }

                if (route.node.mode === 'SINK') {
                    this.depositResource(state, resource, amount);
                } else {
                    pendingInbound.push({ to: route.node, resource, amount, target: route.target });
                }

                node.stalledTicks = Math.max(0, node.stalledTicks - 1);
                route.node.stalledTicks = Math.max(0, route.node.stalledTicks - 1);
                node.lastActiveTick = state.tickCount;
                route.node.lastActiveTick = state.tickCount;
                throughput += amount;
            }
        }

        for (const inbound of pendingInbound) {
            const bucket = inbound.target === 'input' ? inbound.to.inputBuffer : inbound.to.buffer;
            bucket[inbound.resource] = (bucket[inbound.resource] || 0) + inbound.amount;
        }

        factory.throughput = throughput / this.FACTORY_INTERVAL;
        factory.stalledNodes = stalledNodeKeys.size;
        factory.backlog = Object.values(factory.nodes).reduce((sum, node) => {
            const out = Object.values(node.buffer).reduce((acc, value) => acc + (value || 0), 0);
            const input = Object.values(node.inputBuffer).reduce((acc, value) => acc + (value || 0), 0);
            return sum + out + input;
        }, 0);
        factory.lastNetworkTick = state.tickCount;
    }

    private findRoute(factory: FactoryState, origin: FactoryNodeState, resource: FactoryResourceType): { node: FactoryNodeState; target: 'buffer' | 'input' } | null {
        const visited = new Set<string>([origin.key]);
        const queue: Array<{ key: string; depth: number }> = [{ key: origin.key, depth: 0 }];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;
            const node = factory.nodes[current.key];
            if (!node) continue;

            for (const neighbor of this.getNeighbors(factory, node)) {
                if (visited.has(neighbor.key)) continue;
                visited.add(neighbor.key);

                const acceptTarget = this.getAcceptTarget(neighbor, resource);
                if (acceptTarget) {
                    return { node: neighbor, target: acceptTarget };
                }

                if (neighbor.mode === 'TRANSPORT' && current.depth < this.MAX_ROUTE_DEPTH) {
                    queue.push({ key: neighbor.key, depth: current.depth + 1 });
                }
            }
        }

        return null;
    }

    private getNeighbors(factory: FactoryState, node: FactoryNodeState): FactoryNodeState[] {
        const keys = [
            `${node.x + 1},${node.z}`,
            `${node.x - 1},${node.z}`,
            `${node.x},${node.z + 1}`,
            `${node.x},${node.z - 1}`,
        ];

        return keys.map((key) => factory.nodes[key]).filter(Boolean) as FactoryNodeState[];
    }

    private getAcceptTarget(node: FactoryNodeState, resource: FactoryResourceType): 'buffer' | 'input' | null {
        if (node.mode === 'TRANSPORT') {
            return this.getCapacityLeft(node, 'buffer') > 0 ? 'buffer' : null;
        }

        if (node.mode === 'SINK') {
            return ['MINERALS', 'WOOD', 'STONE', 'GEMS'].includes(resource) ? 'buffer' : null;
        }

        if (node.mode !== 'PROCESSOR') return null;

        if ([BuildingType.WASH_PLANT, BuildingType.RECYCLING_PLANT].includes(node.buildingType)) {
            return resource === 'ORE' && this.getCapacityLeft(node, 'input') > 0 ? 'input' : null;
        }

        if (node.buildingType === BuildingType.ORE_FOUNDRY) {
            return (resource === 'CONCENTRATE' || resource === 'STONE') && this.getCapacityLeft(node, 'input') > 0 ? 'input' : null;
        }

        if (node.buildingType === BuildingType.GEM_REFINERY) {
            return resource === 'CONCENTRATE' && this.getCapacityLeft(node, 'input') > 0 ? 'input' : null;
        }

        return null;
    }

    private getTransferBudget(node: FactoryNodeState): number {
        if (node.buildingType === BuildingType.DISTRIBUTION_HUB) return 10;
        if (node.buildingType === BuildingType.RAIL_LINE) return 4;
        return 4;
    }

    private getCapacityLeft(node: FactoryNodeState, target: 'buffer' | 'input'): number {
        if (node.mode === 'SINK') {
            return Number.MAX_SAFE_INTEGER;
        }

        const cap = node.buildingType === BuildingType.DISTRIBUTION_HUB ? 40 : node.mode === 'TRANSPORT' ? 16 : node.mode === 'SOURCE' ? 24 : 18;
        const active = target === 'input' ? node.inputBuffer : node.buffer;
        const used = Object.values(active).reduce((sum, value) => sum + (value || 0), 0);
        return Math.max(0, cap - used);
    }

    private depositResource(state: GameState, resource: FactoryResourceType, amount: number): void {
        if (resource === 'MINERALS') state.resources.minerals = Math.min(state.resources.maxCapacity, state.resources.minerals + amount);
        if (resource === 'WOOD') state.resources.wood = Math.min(state.resources.maxCapacity, state.resources.wood + amount);
        if (resource === 'STONE') state.resources.stone = Math.min(state.resources.maxCapacity, state.resources.stone + amount);
        if (resource === 'GEMS') state.resources.gems += amount;
    }

    private updateExploration(state: GameState) {
        const radius = 3;
        const chunks = state.chunks;

        for (const agent of state.agents) {
            const cx = Math.floor(agent.x);
            const cz = Math.floor(agent.z);

            for (let dz = -radius; dz <= radius; dz++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dz * dz > radius * radius) continue;

                    const tx = cx + dx;
                    const tz = cz + dz;

                    const tile = ChunkStore.getTile(chunks, tx, tz);
                    if (tile && !tile.explored) {
                        tile.explored = true;
                    }
                }
            }
        }
    }
}
