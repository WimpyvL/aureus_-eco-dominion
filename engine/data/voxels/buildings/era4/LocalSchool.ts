
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const LocalSchoolFactory = () => {
    const g = new THREE.Group();

    // Large foundation/courtyard
    g.add(voxel(3.0, 0.2, 3.0, mats.concrete, 0, 0, 0));

    // MAIN BUILDING - L-shaped structure
    // Main hall (back)
    g.add(voxel(2.6, 2.8, 0.8, mats.brick, 0, 0.2, -1.0));
    // Wing (side)
    g.add(voxel(0.8, 2.8, 1.6, mats.brick, -1.0, 0.2, 0.2));

    // Windows - Main building front
    for (let y = 0.6; y <= 2.2; y += 0.8) {
        for (let x = -1.0; x <= 1.0; x += 0.5) {
            g.add(voxel(0.35, 0.5, 0.1, mats.glass, x, y, -0.55));
        }
    }

    // Windows - Wing side
    for (let y = 0.6; y <= 2.2; y += 0.8) {
        for (let z = -0.4; z <= 0.8; z += 0.6) {
            g.add(voxel(0.1, 0.5, 0.4, mats.glass, -0.55, y, z));
        }
    }

    // Main entrance with canopy
    g.add(voxel(0.8, 1.2, 0.15, mats.wood, 0, 0.2, -0.55));
    g.add(voxel(1.2, 0.1, 0.6, mats.metal, 0, 1.6, -0.35));
    g.add(voxel(0.1, 0.8, 0.1, mats.metal, -0.5, 0.8, -0.1));
    g.add(voxel(0.1, 0.8, 0.1, mats.metal, 0.5, 0.8, -0.1));

    // Roofs
    g.add(voxel(2.8, 0.25, 1.0, mats.metal, 0, 3.0, -1.0));
    g.add(voxel(1.0, 0.25, 1.8, mats.metal, -1.0, 3.0, 0.2));

    // BELL TOWER
    g.add(voxel(0.5, 4.0, 0.5, mats.brick, 1.1, 0.2, -1.1));
    g.add(voxel(0.6, 0.15, 0.6, mats.concrete, 1.1, 4.2, -1.1));
    g.add(voxel(0.3, 0.4, 0.3, mats.gold, 1.1, 4.35, -1.1));
    g.add(voxel(0.15, 0.15, 0.15, mats.emissiveGreen, 1.1, 4.75, -1.1));

    // FLAG POLE
    g.add(voxel(0.08, 3.0, 0.08, mats.metal, 1.2, 0.2, 1.2));
    g.add(voxel(0.4, 0.25, 0.05, mats.hazard, 1.2, 3.0, 1.2));

    // PLAYGROUND AREA (front right)
    g.add(voxel(1.2, 0.08, 1.2, mats.asphalt, 0.8, 0.2, 0.8));

    // Swing set
    g.add(voxel(0.1, 1.2, 0.1, mats.metal, 0.5, 0.28, 0.5));
    g.add(voxel(0.1, 1.2, 0.1, mats.metal, 1.1, 0.28, 0.5));
    g.add(voxel(0.7, 0.08, 0.08, mats.metal, 0.8, 1.48, 0.5));
    g.add(voxel(0.05, 0.5, 0.05, mats.metal, 0.65, 1.0, 0.5));
    g.add(voxel(0.15, 0.08, 0.1, mats.wood, 0.65, 0.5, 0.5));
    g.add(voxel(0.05, 0.5, 0.05, mats.metal, 0.95, 1.0, 0.5));
    g.add(voxel(0.15, 0.08, 0.1, mats.wood, 0.95, 0.5, 0.5));

    // Slide
    g.add(voxel(0.15, 1.0, 0.15, mats.metal, 1.0, 0.28, 1.0));
    g.add(voxel(0.4, 0.08, 0.4, mats.metal, 1.0, 1.28, 1.0));
    const slide = voxel(0.25, 0.06, 0.8, mats.blueMetal, 1.0, 0.8, 0.55);
    slide.rotation.x = 0.5;
    g.add(slide);

    // BENCHES around courtyard
    g.add(voxel(0.6, 0.3, 0.2, mats.wood, -0.3, 0.2, 0.5));
    g.add(voxel(0.6, 0.3, 0.2, mats.wood, 0.4, 0.2, 1.2));

    // TREES/PLANTERS
    g.add(voxel(0.4, 0.3, 0.4, mats.concrete, -1.2, 0.2, 1.0));
    g.add(voxel(0.2, 0.8, 0.2, mats.wood, -1.2, 0.5, 1.0));
    g.add(voxel(0.5, 0.5, 0.5, mats.leaf, -1.2, 1.1, 1.0));

    // Bicycle rack
    g.add(voxel(0.6, 0.4, 0.15, mats.metal, 0.3, 0.2, -0.15));

    // School sign
    g.add(voxel(0.8, 0.5, 0.1, mats.concreteLight, 0, 2.5, -0.5));
    g.add(voxel(0.6, 0.3, 0.05, mats.emissiveCyan, 0, 2.55, -0.44));

    return g;
};
