import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, dome, FactoryOptions, taperedCylinder, torusRing, voxel } from '../../../../render/utils/VoxelBuilder';

export const GreenTechLabFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    const isHighDetail = detailLevel === 'HIGH';

    const addResearchTower = (z: number, beacon: THREE.Material) => {
        g.add(voxel(0.56, 3.4, 0.56, mats.metal, 1.08, 0.38, z));
        g.add(voxel(0.7, 0.12, 0.7, mats.greenMetal, 1.08, 1.24, z));
        g.add(voxel(0.7, 0.12, 0.7, mats.greenMetal, 1.08, 2.08, z));
        g.add(voxel(0.7, 0.12, 0.7, mats.greenMetal, 1.08, 2.92, z));
        g.add(voxel(0.22, 0.3, 0.22, beacon, 1.08, 3.82, z));
    };

    const addGrowPod = (x: number, z: number, radius: number) => {
        g.add(voxel(radius * 1.85, 0.16, radius * 1.85, mats.concrete, x, 0.16, z));
        g.add(dome(radius, mats.glass, x, 0.32, z, { detailLevel }));
        g.add(voxel(0.2, radius * 0.82, 0.2, mats.leaf, x - 0.1, 0.16, z));
        g.add(voxel(0.16, radius, 0.16, mats.progressGreen, x + 0.12, 0.16, z + 0.08));
        g.add(voxel(0.1, 0.18, 0.1, mats.emissiveCyan, x, radius * 0.58, z));
    };

    const addBridgeMarker = (z: number) => {
        g.add(voxel(1.08, 0.05, 0.18, mats.concreteLight, 0, 0.34, z));
        g.add(voxel(0.16, 0.08, 0.16, mats.emissiveGreen, -0.42, 0.36, z));
        g.add(voxel(0.16, 0.08, 0.16, mats.emissiveGreen, 0.42, 0.36, z));
    };

    g.add(voxel(3.05, 0.34, 9.05, mats.concrete, 0, 0, 0));
    g.add(voxel(2.72, 0.12, 8.62, mats.concreteLight, 0, 0.34, 0));
    g.add(voxel(1.82, 2.95, 6.45, mats.concreteLight, 0, 0.46, 0));
    g.add(voxel(2.02, 0.18, 6.9, mats.greenMetal, 0, 3.24, 0));

    for (let y = 0.84; y <= 2.72; y += 0.48) {
        g.add(voxel(1.66, 0.12, 0.12, mats.glass, 0, y, 3.06));
        g.add(voxel(1.66, 0.12, 0.12, mats.glass, 0, y, 1.58));
        g.add(voxel(1.66, 0.12, 0.12, mats.glass, 0, y, -0.1));
        g.add(voxel(1.66, 0.12, 0.12, mats.glass, 0, y, -1.78));
        g.add(voxel(1.66, 0.12, 0.12, mats.glass, 0, y, -3.28));
        g.add(voxel(0.12, 0.12, 6.3, mats.glass, 0.92, y, -0.12));
        g.add(voxel(0.12, 0.12, 6.3, mats.glass, -0.92, y, -0.12));
    }

    g.add(dome(0.94, mats.glass, 0, 3.42, 0.04, { detailLevel }));
    g.add(torusRing(0.86, 0.05, mats.greenMetal, 0, 3.5, 0.04, { detailLevel, rotationX: Math.PI / 2 }));
    g.add(torusRing(0.62, 0.04, mats.greenMetal, 0, 3.82, 0.04, { detailLevel, rotationX: Math.PI / 2 }));
    g.add(torusRing(0.4, 0.03, mats.greenMetal, 0, 4.08, 0.04, { detailLevel, rotationX: Math.PI / 2 }));
    g.add(voxel(0.5, 0.84, 0.5, mats.leaf, 0, 3.28, 0.04));
    g.add(voxel(0.22, 0.36, 0.22, mats.progressGreen, 0.24, 3.54, 0.16));
    g.add(voxel(0.2, 0.28, 0.2, mats.leafDark, -0.24, 3.42, -0.1));

    addResearchTower(2.88, mats.emissiveGreen);
    addResearchTower(0.72, mats.emissiveCyan);
    addResearchTower(-1.4, mats.emissiveGreen);

    g.add(taperedCylinder(0.16, 0.24, 4.6, mats.concreteLight, -1.08, 0.38, -2.86));
    g.add(voxel(0.58, 0.2, 0.58, mats.metal, -1.08, 4.96, -2.86));
    g.add(voxel(0.22, 0.4, 0.22, mats.emissiveCyan, -1.08, 5.1, -2.86));
    g.add(voxel(0.62, 0.08, 0.62, mats.greenMetal, -1.08, 2.18, -2.86));

    g.add(voxel(1.2, 0.22, 0.84, mats.concrete, 0, 0.36, 4.02));
    g.add(voxel(0.84, 1.34, 0.16, mats.glass, 0, 0.46, 4.12));
    g.add(voxel(1.02, 0.12, 0.44, mats.metal, 0, 1.76, 4.18));
    g.add(voxel(0.76, 0.08, 0.3, mats.concrete, 0, 0.16, 4.52));

    // Connected annex: 1x1 link into a dedicated 3x3 biosphere block.
    g.add(voxel(0.94, 0.18, 0.94, mats.concrete, 1.48, 0.28, 2.58));
    g.add(voxel(0.72, 0.96, 0.72, mats.glass, 1.48, 0.46, 2.58));
    g.add(voxel(0.88, 0.08, 0.88, mats.metalLight, 1.48, 1.4, 2.58));

    g.add(voxel(2.78, 0.22, 2.78, mats.concrete, 3.24, 0.16, 2.58));
    g.add(voxel(2.46, 0.12, 2.46, mats.concreteLight, 3.24, 0.38, 2.58));
    g.add(voxel(2.18, 1.2, 2.18, mats.glass, 3.24, 0.46, 2.58));
    g.add(dome(1.18, mats.glass, 3.24, 1.62, 2.58, { detailLevel }));
    g.add(torusRing(1.02, 0.05, mats.greenMetal, 3.24, 1.72, 2.58, { detailLevel, rotationX: Math.PI / 2 }));
    g.add(torusRing(0.72, 0.04, mats.greenMetal, 3.24, 2.06, 2.58, { detailLevel, rotationX: Math.PI / 2 }));
    g.add(torusRing(0.48, 0.03, mats.greenMetal, 3.24, 2.34, 2.58, { detailLevel, rotationX: Math.PI / 2 }));
    g.add(voxel(1.98, 0.08, 0.12, mats.greenMetal, 3.24, 1.18, 2.58));
    g.add(voxel(0.12, 0.08, 1.98, mats.greenMetal, 3.24, 1.18, 2.58));
    g.add(voxel(0.62, 0.1, 1.96, mats.metalLight, 2.16, 0.96, 2.58));
    g.add(voxel(0.62, 0.1, 1.96, mats.metalLight, 4.32, 0.96, 2.58));
    g.add(voxel(1.86, 0.1, 0.52, mats.concreteLight, 3.24, 0.26, 1.72));
    g.add(voxel(1.86, 0.1, 0.52, mats.concreteLight, 3.24, 0.26, 3.44));
    g.add(voxel(0.22, 0.56, 0.22, mats.leaf, 2.82, 0.38, 2.28));
    g.add(voxel(0.24, 0.72, 0.24, mats.progressGreen, 3.44, 0.38, 2.84));
    g.add(voxel(0.16, 0.26, 0.16, mats.emissiveCyan, 3.24, 1.18, 2.58));
    g.add(voxel(0.18, 0.28, 0.18, mats.leafDark, 3.02, 0.38, 2.98));
    g.add(voxel(0.18, 0.28, 0.18, mats.leafDark, 3.58, 0.38, 2.16));
    g.add(voxel(0.32, 1.02, 0.32, mats.leaf, 3.24, 0.38, 2.58));
    g.add(voxel(0.2, 0.54, 0.2, mats.progressGreen, 3.02, 1.02, 2.46));
    g.add(voxel(0.2, 0.54, 0.2, mats.progressGreen, 3.46, 0.94, 2.7));
    g.add(voxel(0.16, 0.34, 0.16, mats.emissiveGreen, 3.24, 1.48, 2.58));
    g.add(voxel(0.22, 0.46, 0.22, mats.leaf, 2.9, 0.38, 2.72));
    g.add(voxel(0.22, 0.46, 0.22, mats.leaf, 3.58, 0.38, 2.4));
    g.add(voxel(0.18, 0.4, 0.18, mats.progressGreen, 2.96, 0.38, 2.16));
    g.add(voxel(0.18, 0.4, 0.18, mats.progressGreen, 3.52, 0.38, 3.02));
    g.add(voxel(0.12, 0.2, 0.12, mats.emissiveCyan, 2.84, 0.98, 2.26));
    g.add(voxel(0.12, 0.2, 0.12, mats.emissiveCyan, 3.62, 0.98, 2.9));
    g.add(cylinder(0.06, 1.02, mats.metal, 2.5, 0.38, 2.58));
    g.add(cylinder(0.06, 1.02, mats.metal, 3.98, 0.38, 2.58));
    g.add(voxel(0.12, 0.12, 0.12, mats.emissiveGreen, 2.5, 1.34, 2.58));
    g.add(voxel(0.12, 0.12, 0.12, mats.emissiveGreen, 3.98, 1.34, 2.58));
    g.add(voxel(0.52, 0.12, 0.52, mats.concrete, 4.18, 0.16, 3.42));
    g.add(voxel(0.18, 0.38, 0.18, mats.emissiveGreen, 4.18, 0.68, 3.42));

    g.add(voxel(1.18, 0.14, 0.96, mats.metal, 1.02, 0.42, -3.58));
    const solarWingNorth = new THREE.Group();
    solarWingNorth.position.set(1.02, 0.94, -3.58);
    solarWingNorth.rotation.x = Math.PI / 4.5;
    solarWingNorth.add(voxel(1.24, 0.08, 0.96, mats.solar, 0, 0, 0));
    solarWingNorth.add(voxel(1.04, 0.05, 0.12, mats.metalLight, 0, 0.06, -0.3));
    solarWingNorth.add(voxel(1.04, 0.05, 0.12, mats.metalLight, 0, 0.06, 0.3));
    g.add(solarWingNorth);

    g.add(voxel(1.18, 0.14, 0.96, mats.metal, 1.02, 0.42, 3.48));
    const solarWingSouth = new THREE.Group();
    solarWingSouth.position.set(1.02, 0.94, 3.48);
    solarWingSouth.rotation.x = Math.PI / 4.5;
    solarWingSouth.add(voxel(1.24, 0.08, 0.96, mats.solar, 0, 0, 0));
    solarWingSouth.add(voxel(1.04, 0.05, 0.12, mats.metalLight, 0, 0.06, -0.3));
    solarWingSouth.add(voxel(1.04, 0.05, 0.12, mats.metalLight, 0, 0.06, 0.3));
    g.add(solarWingSouth);

    g.add(voxel(1.16, 1.36, 0.88, mats.glass, -1.02, 0.42, -3.62));
    g.add(voxel(1.22, 0.12, 0.94, mats.metal, -1.02, 1.78, -3.62));
    g.add(voxel(0.2, 0.46, 0.2, mats.leaf, -1.2, 0.42, -3.62));
    g.add(voxel(0.18, 0.56, 0.18, mats.progressGreen, -0.82, 0.42, -3.48));
    g.add(voxel(0.14, 0.36, 0.14, mats.leafDark, -0.98, 0.42, -3.84));

    g.add(voxel(1.16, 1.36, 0.88, mats.glass, -1.02, 0.42, 3.56));
    g.add(voxel(1.22, 0.12, 0.94, mats.metal, -1.02, 1.78, 3.56));
    g.add(voxel(0.2, 0.46, 0.2, mats.leaf, -1.2, 0.42, 3.56));
    g.add(voxel(0.18, 0.56, 0.18, mats.progressGreen, -0.82, 0.42, 3.72));
    g.add(voxel(0.14, 0.36, 0.14, mats.leafDark, -0.98, 0.42, 3.34));

    addGrowPod(-1.02, -1.48, 0.34);
    addGrowPod(-1.02, 1.62, 0.34);
    addGrowPod(1.04, -0.2, 0.3);
    addGrowPod(1.04, 2.22, 0.3);

    g.add(voxel(0.48, 0.05, 8.0, mats.concrete, 0.46, 0.34, 0));
    g.add(voxel(1.9, 0.05, 0.48, mats.concrete, 0, 0.34, 2.9));
    g.add(voxel(1.9, 0.05, 0.48, mats.concrete, 0, 0.34, -2.9));
    g.add(voxel(1.2, 0.05, 0.42, mats.concrete, 0, 0.34, 0));
    addBridgeMarker(1.48);
    addBridgeMarker(-1.48);

    g.add(voxel(0.42, 0.44, 0.42, mats.metal, 0.82, 0.38, -0.94));
    g.add(voxel(0.16, 0.16, 0.16, mats.emissiveCyan, 0.82, 0.82, -0.94));
    g.add(voxel(0.36, 0.3, 0.36, mats.metalLight, -0.44, 0.38, 2.48));
    g.add(voxel(0.12, 0.14, 0.12, mats.emissiveGreen, -0.44, 0.68, 2.48));
    g.add(cylinder(0.08, 1.52, mats.metal, 1.42, 0.38, 4.02));
    g.add(cylinder(0.08, 1.52, mats.metal, -1.42, 0.38, 4.02));
    g.add(voxel(0.16, 0.16, 0.16, mats.emissiveGreen, 1.42, 1.88, 4.02));
    g.add(voxel(0.16, 0.16, 0.16, mats.emissiveGreen, -1.42, 1.88, 4.02));

    if (isHighDetail) {
        g.add(voxel(0.28, 0.78, 0.28, mats.glass, 1.46, 0.4, 1.14));
        g.add(voxel(0.14, 0.24, 0.14, mats.progressGreen, 1.46, 1.04, 1.14));
        g.add(voxel(0.28, 0.78, 0.28, mats.glass, 1.46, 0.4, -2.24));
        g.add(voxel(0.14, 0.24, 0.14, mats.emissiveCyan, 1.46, 1.04, -2.24));
        g.add(cylinder(0.08, 1.72, mats.metal, -1.46, 0.38, 2.96));
        g.add(cylinder(0.08, 1.72, mats.metal, -1.46, 0.38, -0.86));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, -1.46, 2.02, 2.96));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, -1.46, 2.02, -0.86));
        g.add(cylinder(0.08, 1.58, mats.metal, 4.12, 0.38, 1.78));
        g.add(voxel(0.18, 0.18, 0.18, mats.emissiveGreen, 4.12, 1.9, 1.78));
        g.add(voxel(0.26, 0.84, 0.26, mats.glass, 2.08, 0.4, 3.34));
        g.add(voxel(0.12, 0.22, 0.12, mats.emissiveCyan, 2.08, 1.1, 3.34));
    }

    return g;
};
