import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { cylinder, dome, FactoryOptions, taperedCylinder, voxel } from '../../../../render/utils/VoxelBuilder';

export const SafariLodgeFactory = (opts?: FactoryOptions) => {
    const g = new THREE.Group();
    const detailLevel = opts?.detailLevel ?? 'MEDIUM';
    const isHighDetail = detailLevel === 'HIGH';

    const addLantern = (x: number, z: number, height = 1.5) => {
        g.add(cylinder(0.05, height, mats.wood, x, 0.15, z));
        g.add(voxel(0.18, 0.24, 0.18, mats.gold, x, height + 0.08, z));
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveGreen, x, height + 0.28, z));
    };

    const addPalm = (x: number, z: number, trunkHeight: number, lean = 0) => {
        const trunk = taperedCylinder(0.08, 0.12, trunkHeight, mats.palmTrunk, x, 0.15, z);
        trunk.rotation.z = lean;
        g.add(trunk);
        g.add(voxel(0.95, 0.14, 0.28, mats.palmLeaf, x + 0.12, trunkHeight + 0.1, z,));
        g.add(voxel(0.95, 0.14, 0.28, mats.palmLeaf, x - 0.12, trunkHeight + 0.06, z,));
        g.add(voxel(0.28, 0.14, 0.95, mats.palmLeaf, x, trunkHeight + 0.12, z + 0.12));
        g.add(voxel(0.28, 0.14, 0.95, mats.palmLeaf, x, trunkHeight + 0.08, z - 0.12));
        g.add(voxel(0.48, 0.22, 0.48, mats.leaf, x, trunkHeight + 0.24, z));
    };

    const addGuestVilla = (x: number, z: number, mirrored = false) => {
        const dir = mirrored ? -1 : 1;
        g.add(voxel(1.8, 0.18, 1.45, mats.concrete, x, 0.15, z));
        g.add(voxel(1.52, 1.7, 1.18, mats.wood, x, 0.33, z));
        g.add(voxel(1.66, 0.16, 1.28, mats.wood, x, 2.0, z));
        g.add(voxel(1.84, 0.42, 0.96, mats.wood, x, 2.14, z));
        g.add(voxel(1.1, 0.28, 0.62, mats.wood, x, 2.54, z));
        g.add(voxel(0.82, 0.78, 0.14, mats.glass, x, 0.92, z + 0.6));
        g.add(voxel(0.26, 1.18, 0.14, mats.wood, x - 0.46 * dir, 0.38, z + 0.66));
        g.add(voxel(0.26, 1.18, 0.14, mats.wood, x + 0.46 * dir, 0.38, z + 0.66));
        g.add(voxel(1.16, 0.14, 0.76, mats.wood, x, 1.46, z + 0.56));
        g.add(voxel(0.98, 0.1, 0.52, mats.concrete, x, 0.15, z + 0.92));
        g.add(voxel(0.24, 0.66, 0.1, mats.glass, x - 0.56 * dir, 0.88, z - 0.52));
        g.add(voxel(0.24, 0.66, 0.1, mats.glass, x + 0.56 * dir, 0.88, z - 0.52));
    };

    const addPlanter = (x: number, z: number, lush = false) => {
        g.add(voxel(0.52, 0.16, 0.52, mats.concrete, x, 0.15, z));
        g.add(voxel(0.42, 0.28, 0.42, mats.leafDark, x, 0.27, z));
        g.add(voxel(0.14, 0.24, 0.14, mats.emissiveRed, x - 0.1, 0.5, z + 0.05));
        g.add(voxel(0.12, 0.18, 0.12, mats.gold, x + 0.08, 0.46, z - 0.08));
        if (lush) {
            g.add(voxel(0.12, 0.2, 0.12, mats.emissiveCyan, x, 0.54, z));
            g.add(voxel(0.18, 0.28, 0.18, mats.progressGreen, x + 0.05, 0.55, z + 0.05));
        }
    };

    g.add(voxel(6.95, 0.24, 6.95, mats.sandStone, 0, 0, 0));
    g.add(voxel(6.55, 0.06, 6.55, mats.savannaGreen, 0, 0.22, 0));

    // Raise the hardscape above the planted base so the camera never z-fights
    // between co-planar resort paths and the ground cover.
    g.add(voxel(0.54, 0.1, 6.35, mats.concrete, 0, 0.3, 0));
    g.add(voxel(5.05, 0.1, 0.48, mats.concrete, 0, 0.3, 1.1));
    g.add(voxel(2.4, 0.1, 0.34, mats.concrete, -1.75, 0.3, -2.0));
    g.add(voxel(2.4, 0.1, 0.34, mats.concrete, 1.75, 0.3, -2.0));

    g.add(voxel(3.6, 0.26, 2.2, mats.concrete, 0, 0.18, -2.0));
    g.add(voxel(3.2, 2.35, 1.85, mats.wood, 0, 0.44, -2.0));
    g.add(voxel(3.36, 0.18, 1.98, mats.wood, 0, 2.7, -2.0));
    g.add(voxel(3.7, 0.52, 1.58, mats.wood, 0, 2.86, -2.0));
    g.add(voxel(2.75, 0.36, 1.1, mats.wood, 0, 3.3, -2.0));
    g.add(voxel(1.56, 0.22, 0.66, mats.wood, 0, 3.62, -2.0));

    g.add(voxel(0.92, 1.4, 0.14, mats.glass, -0.96, 0.92, -1.0));
    g.add(voxel(0.92, 1.4, 0.14, mats.glass, 0.96, 0.92, -1.0));
    g.add(voxel(1.08, 1.06, 0.14, mats.glass, 0, 1.3, -1.0));
    g.add(voxel(0.22, 1.78, 0.18, mats.wood, -1.48, 0.42, -0.86));
    g.add(voxel(0.22, 1.78, 0.18, mats.wood, 1.48, 0.42, -0.86));
    g.add(voxel(2.28, 0.16, 1.08, mats.wood, 0, 1.92, -0.7));
    g.add(voxel(2.04, 0.14, 1.02, mats.concrete, 0, 0.18, -0.26));
    g.add(voxel(0.82, 1.65, 0.16, mats.wood, 0, 0.4, -1.02));

    g.add(voxel(1.72, 0.16, 1.3, mats.wood, -2.18, 0.18, 0.48));
    g.add(dome(0.72, mats.glass, -2.18, 0.64, 0.48, { detailLevel }));
    g.add(voxel(1.22, 0.08, 1.02, mats.glass, -2.18, 0.24, 0.48));
    g.add(voxel(0.24, 0.42, 0.24, mats.leaf, -2.04, 0.24, 0.34));
    g.add(voxel(0.3, 0.48, 0.3, mats.progressGreen, -2.34, 0.24, 0.66));

    g.add(voxel(2.05, 0.22, 1.36, mats.concrete, 0, 0.24, 1.58));
    g.add(voxel(1.88, 0.12, 1.18, mats.glass, 0, 0.28, 1.58));
    g.add(voxel(0.28, 0.3, 0.28, mats.leaf, -0.42, 0.26, 1.42));
    g.add(voxel(0.28, 0.38, 0.28, mats.progressGreen, 0.36, 0.26, 1.68));
    g.add(voxel(0.2, 0.28, 0.2, mats.emissiveCyan, 0, 0.42, 1.58));

    addGuestVilla(-2.22, 2.0, false);
    addGuestVilla(2.22, 2.0, true);

    g.add(voxel(1.36, 0.14, 0.66, mats.wood, 1.66, 0.24, -0.46));
    g.add(voxel(0.38, 0.36, 0.38, mats.wood, 1.24, 0.24, -0.58));
    g.add(voxel(0.38, 0.36, 0.38, mats.wood, 2.08, 0.24, -0.58));
    g.add(voxel(0.28, 0.2, 0.28, mats.wood, 1.24, 0.62, -0.58));
    g.add(voxel(0.28, 0.2, 0.28, mats.wood, 2.08, 0.62, -0.58));

    addPalm(-2.9, -2.7, 3.0, -0.12);
    addPalm(2.92, -2.58, 3.2, 0.1);
    addPalm(-3.02, 0.58, 2.7, -0.08);
    addPalm(3.0, 0.42, 2.78, 0.08);
    addPalm(-2.86, 2.82, 2.58, -0.04);
    addPalm(2.88, 2.9, 2.64, 0.03);

    addPlanter(-1.52, 0.46, true);
    addPlanter(1.52, 0.46, true);
    addPlanter(-0.96, -1.12, false);
    addPlanter(0.96, -1.12, false);
    addPlanter(-1.92, 3.0, isHighDetail);
    addPlanter(1.92, 3.0, isHighDetail);
    addPlanter(0, 3.1, true);

    g.add(voxel(0.16, 1.08, 0.16, mats.wood, -0.32, 0.18, 3.18));
    g.add(voxel(0.16, 1.08, 0.16, mats.wood, 0.32, 0.18, 3.18));
    g.add(voxel(0.92, 0.36, 0.12, mats.wood, 0, 0.96, 3.18));

    g.add(voxel(0.08, 0.82, 4.1, mats.wood, -3.32, 0.18, 0.96));
    g.add(voxel(0.08, 0.82, 4.1, mats.wood, 3.32, 0.18, 0.96));
    g.add(voxel(3.88, 0.82, 0.08, mats.wood, 0, 0.18, 3.32));
    g.add(voxel(2.4, 0.82, 0.08, mats.wood, 0, 0.18, -3.18));

    addLantern(-0.34, 2.48, 1.7);
    addLantern(0.34, 2.48, 1.7);
    addLantern(-1.16, -0.18, 1.45);
    addLantern(1.16, -0.18, 1.45);
    addLantern(-2.56, 1.24, 1.5);
    addLantern(2.56, 1.24, 1.5);
    if (isHighDetail) {
        addLantern(-2.1, 3.04, 1.36);
        addLantern(2.1, 3.04, 1.36);
    }

    return g;
};
