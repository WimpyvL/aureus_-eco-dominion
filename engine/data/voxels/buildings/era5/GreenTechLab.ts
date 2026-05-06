
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { dome, torusRing, voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const GreenTechLabFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';

    // Large foundation
    g.add(voxel(3.0, 0.3, 3.0, mats.concrete, 0, 0, 0));

    // MAIN RESEARCH BUILDING (center)
    g.add(voxel(1.8, 2.5, 1.8, mats.concreteLight, 0, 0.3, 0));

    // Glass facade panels
    for (let y = 0.7; y <= 2.2; y += 0.5) {
        g.add(voxel(1.6, 0.2, 0.1, mats.glass, 0, y, 0.91));
        g.add(voxel(0.1, 0.2, 1.6, mats.glass, 0.91, y, 0));
        g.add(voxel(0.1, 0.2, 1.6, mats.glass, -0.91, y, 0));
    }

    // MAIN BIOSPHERE DOME (on top of main building)
    g.add(dome(1.0, mats.glass, 0, 2.8, 0, { detailLevel }));

    // Dome frame rings
    for (let r = 0.3; r <= 0.9; r += 0.3) {
        g.add(torusRing(r, 0.04, mats.greenMetal, 0, 2.8 + Math.sqrt(1.0 - r * r) * 0.5, 0, {
            detailLevel,
            rotationX: Math.PI / 2,
        }));
    }

    // Plants inside main dome
    g.add(voxel(0.5, 0.7, 0.5, mats.leaf, 0, 2.8, 0));
    g.add(voxel(0.3, 0.9, 0.3, mats.progressGreen, 0.3, 2.8, 0.3));
    g.add(voxel(0.25, 0.6, 0.25, mats.leaf, -0.3, 2.8, -0.2));

    // EQUIPMENT TOWERS (corners)
    // Tower 1 - Processing
    g.add(voxel(0.6, 3.5, 0.6, mats.metal, 1.1, 0.3, 1.1));
    g.add(voxel(0.65, 0.12, 0.65, mats.greenMetal, 1.1, 1.5, 1.1));
    g.add(voxel(0.65, 0.12, 0.65, mats.greenMetal, 1.1, 2.3, 1.1));
    g.add(voxel(0.65, 0.12, 0.65, mats.greenMetal, 1.1, 3.1, 1.1));
    g.add(voxel(0.25, 0.3, 0.25, mats.emissiveGreen, 1.1, 3.8, 1.1));

    // Tower 2 - Data processing
    g.add(voxel(0.6, 3.0, 0.6, mats.metal, -1.1, 0.3, 1.1));
    g.add(voxel(0.2, 0.2, 0.1, mats.emissiveCyan, -1.1, 1.2, 1.42));
    g.add(voxel(0.2, 0.2, 0.1, mats.emissiveCyan, -1.1, 1.8, 1.42));
    g.add(voxel(0.2, 0.2, 0.1, mats.emissiveCyan, -1.1, 2.4, 1.42));
    g.add(voxel(0.7, 0.15, 0.7, mats.greenMetal, -1.1, 3.3, 1.1));

    // Tower 3 - Air processing
    g.add(voxel(0.5, 4.0, 0.5, mats.concreteLight, -1.1, 0.3, -1.1));
    g.add(voxel(0.6, 0.2, 0.6, mats.metal, -1.1, 4.3, -1.1));
    g.add(voxel(0.3, 0.3, 0.3, mats.emissiveGreen, -1.1, 4.5, -1.1));

    // SOLAR ARRAY WING (right side)
    g.add(voxel(0.8, 0.08, 0.8, mats.metal, 1.1, 0.3, -0.9));
    const solarWing = new THREE.Group();
    solarWing.position.set(1.1, 0.8, -0.9);
    solarWing.rotation.x = Math.PI / 5;
    solarWing.add(voxel(0.9, 0.08, 0.8, mats.solar, 0, 0, 0));
    g.add(solarWing);

    // GREENHOUSE ANNEX (back left)
    g.add(voxel(1.0, 1.2, 0.8, mats.glass, -0.9, 0.3, -0.9));
    g.add(voxel(1.05, 0.1, 0.85, mats.metal, -0.9, 1.5, -0.9));
    // Plants in greenhouse
    g.add(voxel(0.3, 0.5, 0.3, mats.leaf, -1.0, 0.3, -0.9));
    g.add(voxel(0.25, 0.6, 0.25, mats.progressGreen, -0.75, 0.3, -0.8));
    g.add(voxel(0.25, 0.4, 0.25, mats.leaf, -0.9, 0.3, -1.1));

    // PATHWAYS
    g.add(voxel(0.5, 0.05, 2.0, mats.concrete, 0.5, 0.3, 0));
    g.add(voxel(2.0, 0.05, 0.5, mats.concrete, 0, 0.3, 0.5));

    // MAIN ENTRANCE
    g.add(voxel(0.7, 1.2, 0.15, mats.glass, 0, 0.3, 0.93));
    g.add(voxel(0.9, 0.15, 0.5, mats.metal, 0, 1.5, 1.05)); // Canopy

    // RESEARCH EQUIPMENT (scattered)
    g.add(voxel(0.3, 0.4, 0.3, mats.metal, 0.6, 0.3, -0.4));
    g.add(voxel(0.1, 0.1, 0.1, mats.emissiveCyan, 0.6, 0.7, -0.4));

    // WATER FEATURE (eco pond)
    g.add(voxel(0.6, 0.1, 0.6, mats.glass, 0.9, 0.3, 0.4));
    g.add(voxel(0.15, 0.3, 0.15, mats.leaf, 1.0, 0.4, 0.5));

    // HELIPAD marking (for research deliveries)
    g.add(voxel(0.8, 0.02, 0.8, mats.concrete, -0.5, 0.32, 0.9));
    g.add(voxel(0.1, 0.03, 0.5, mats.hazard, -0.5, 0.34, 0.9));
    g.add(voxel(0.5, 0.03, 0.1, mats.hazard, -0.5, 0.34, 0.9));

    return g;
};
