export const DEEP_LEDGER_TUNING = {
    actionCosts: {
        openTunnelAGT: 75,
        reinforceTunnelAGT: 100,
        clearCollapseAGT: 125,
        mitigateHazardAGT: 90
    },
    tileStability: {
        openTunnelCost: 8,
        reinforceGain: 25,
        clearCollapseMinimum: 22,
        extractionCost: 5,
        mitigationGain: 10
    },
    globalStability: {
        openTunnelCost: 1,
        reinforceGain: 1,
        clearCollapseCost: 1,
        mitigationGain: 1,
        extractionCost: 1
    },
    extraction: {
        oreDepletionPerExtract: 25,
        gemAGTPerYield: 20,
        aureusAGTPerYield: 50,
        relicFallbackAGTPerYield: 35
    },
    exposure: {
        openHazardTunnel: 1,
        clearCollapse: 1,
        aureusExtraction: 2,
        relicExtraction: 1,
        hazardousExtraction: 1,
        illegalTunnelMitigationReduction: 2
    },
    oxygen: {
        gasMitigationGain: 8
    },
    tilePriority: {
        collapsed: 1400,
        existingTunnelPenalty: -500,
        extractableOpenDeposit: 900,
        unsupportedDugTunnel: 750,
        disconnectedTunnel: 650,
        activeHazard: 1600,
        resourceDeposit: 500
    }
} as const;
