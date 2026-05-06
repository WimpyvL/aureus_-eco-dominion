import { Runtime } from '../kernel/Runtime';
import { ThreeRenderAdapter, RuntimeRenderQualityProfile } from './ThreeRenderAdapter';

interface RuntimeQualityGovernorConfig {
    sampleIntervalMs: number;
    downgradeFpsThreshold: number;
    upgradeFpsThreshold: number;
    downgradeSamples: number;
    upgradeSamples: number;
    changeCooldownMs: number;
}

export interface RuntimeQualityGovernorSnapshot {
    activeQuality: RuntimeRenderQualityProfile;
    downgradePressure: number;
    upgradePressure: number;
    lastChangeAt: number;
}

const DEFAULT_CONFIG: RuntimeQualityGovernorConfig = {
    sampleIntervalMs: 1500,
    downgradeFpsThreshold: 48,
    upgradeFpsThreshold: 57,
    downgradeSamples: 2,
    upgradeSamples: 5,
    changeCooldownMs: 6000,
};

export class RuntimeQualityGovernor {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private downgradePressure = 0;
    private upgradePressure = 0;
    private lastChangeAt = 0;

    constructor(
        private runtime: Runtime,
        private render: ThreeRenderAdapter,
        private config: RuntimeQualityGovernorConfig = DEFAULT_CONFIG
    ) {}

    start(): void {
        if (this.intervalId) {
            return;
        }

        this.intervalId = setInterval(() => this.sample(), this.config.sampleIntervalMs);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    getSnapshot(): RuntimeQualityGovernorSnapshot {
        return {
            activeQuality: this.render.getRuntimeQuality(),
            downgradePressure: this.downgradePressure,
            upgradePressure: this.upgradePressure,
            lastChangeAt: this.lastChangeAt,
        };
    }

    private sample(): void {
        const now = performance.now();
        const status = this.runtime.getStatus();
        const profiler = this.runtime.getProfiler();
        const fps = status.fps;
        const drawMs = profiler.get('draw');
        const syncMs = profiler.get('renderSync');
        const totalRenderMs = drawMs + syncMs;
        const cooldownActive = now - this.lastChangeAt < this.config.changeCooldownMs;
        const ladder = this.render.getRuntimeQualityLadder();
        const currentLevel = this.render.getRuntimeQuality().level;
        const canDowngrade = currentLevel > 0;
        const canUpgrade = currentLevel < ladder.length - 1;

        const shouldDowngrade = canDowngrade && (fps < this.config.downgradeFpsThreshold || totalRenderMs > 18);
        const shouldUpgrade = canUpgrade && fps > this.config.upgradeFpsThreshold && totalRenderMs < 11;

        if (shouldDowngrade) {
            this.downgradePressure += 1;
            this.upgradePressure = Math.max(0, this.upgradePressure - 1);
        } else if (shouldUpgrade) {
            this.upgradePressure += 1;
            this.downgradePressure = Math.max(0, this.downgradePressure - 1);
        } else {
            this.downgradePressure = Math.max(0, this.downgradePressure - 1);
            this.upgradePressure = Math.max(0, this.upgradePressure - 1);
        }

        if (cooldownActive) {
            return;
        }

        if (this.downgradePressure >= this.config.downgradeSamples) {
            this.render.setRuntimeQualityLevel(currentLevel - 1);
            this.lastChangeAt = now;
            this.downgradePressure = 0;
            this.upgradePressure = 0;
            return;
        }

        if (this.upgradePressure >= this.config.upgradeSamples) {
            this.render.setRuntimeQualityLevel(currentLevel + 1);
            this.lastChangeAt = now;
            this.downgradePressure = 0;
            this.upgradePressure = 0;
        }
    }
}
