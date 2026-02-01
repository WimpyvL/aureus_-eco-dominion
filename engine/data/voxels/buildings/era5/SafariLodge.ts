
import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { voxel, FactoryOptions } from '../../../../render/utils/VoxelBuilder';

export const SafariLodgeFactory = () => {
    const g = new THREE.Group();

    // LUSH GRASS BASE with garden paths
    g.add(voxel(3.0, 0.15, 3.0, mats.progressGreen, 0, 0, 0));

    // Stone pathways
    g.add(voxel(0.4, 0.08, 2.8, mats.concrete, 0, 0.15, 0));
    g.add(voxel(2.0, 0.08, 0.4, mats.concrete, 0, 0.15, 0.5));
    g.add(voxel(1.0, 0.08, 0.4, mats.concrete, -0.8, 0.15, -0.8));

    // MAIN LODGE BUILDING (center-back) - Wooden cabin style
    g.add(voxel(1.8, 0.15, 1.2, mats.wood, 0, 0.15, -0.8)); // Foundation
    g.add(voxel(1.6, 1.6, 1.0, mats.wood, 0, 0.3, -0.8)); // Main cabin
    g.add(voxel(1.7, 0.1, 1.1, mats.wood, 0, 1.9, -0.8)); // Roof trim
    // Pitched roof
    g.add(voxel(1.8, 0.4, 0.6, mats.wood, 0, 2.0, -0.8));
    g.add(voxel(1.4, 0.3, 0.4, mats.wood, 0, 2.4, -0.8));
    g.add(voxel(0.8, 0.2, 0.3, mats.wood, 0, 2.7, -0.8));

    // Lodge windows
    g.add(voxel(0.4, 0.5, 0.1, mats.glass, -0.4, 0.8, -0.24));
    g.add(voxel(0.4, 0.5, 0.1, mats.glass, 0.4, 0.8, -0.24));
    g.add(voxel(0.5, 0.6, 0.1, mats.glass, 0, 1.2, -0.24));

    // Lodge entrance porch
    g.add(voxel(1.0, 0.1, 0.5, mats.wood, 0, 0.15, -0.1));
    g.add(voxel(0.5, 1.0, 0.1, mats.wood, 0, 0.25, -0.2)); // Door
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, -0.4, 0.25, 0.05)); // Porch post
    g.add(voxel(0.1, 1.2, 0.1, mats.wood, 0.4, 0.25, 0.05)); // Porch post
    g.add(voxel(1.0, 0.1, 0.6, mats.wood, 0, 1.45, -0.05)); // Porch roof

    // GUEST CABIN 1 (left) - Smaller wooden cabin
    g.add(voxel(0.9, 0.1, 0.9, mats.wood, -1.0, 0.15, 0.9)); // Foundation
    g.add(voxel(0.8, 1.2, 0.8, mats.wood, -1.0, 0.25, 0.9)); // Cabin
    g.add(voxel(0.9, 0.3, 0.5, mats.wood, -1.0, 1.45, 0.9)); // Roof
    g.add(voxel(0.6, 0.2, 0.3, mats.wood, -1.0, 1.75, 0.9)); // Roof peak
    g.add(voxel(0.3, 0.4, 0.1, mats.glass, -1.0, 0.7, 0.49)); // Window

    // GUEST CABIN 2 (right) - Smaller wooden cabin
    g.add(voxel(0.9, 0.1, 0.9, mats.wood, 1.0, 0.15, 0.9)); // Foundation
    g.add(voxel(0.8, 1.2, 0.8, mats.wood, 1.0, 0.25, 0.9)); // Cabin
    g.add(voxel(0.9, 0.3, 0.5, mats.wood, 1.0, 1.45, 0.9)); // Roof
    g.add(voxel(0.6, 0.2, 0.3, mats.wood, 1.0, 1.75, 0.9)); // Roof peak
    g.add(voxel(0.3, 0.4, 0.1, mats.glass, 1.0, 0.7, 0.49)); // Window

    // SWIMMING POOL / POND (center-front)
    g.add(voxel(1.0, 0.15, 0.8, mats.concrete, 0, 0.15, 0.6)); // Pool edge
    g.add(voxel(0.9, 0.1, 0.7, mats.glass, 0, 0.12, 0.6)); // Water

    // LARGE TREES
    const addTree = (x: number, z: number, height: number) => {
        g.add(voxel(0.2, height, 0.2, mats.wood, x, 0.15, z));
        g.add(voxel(0.7, 0.6, 0.7, mats.leaf, x, height * 0.6, z));
        g.add(voxel(0.5, 0.5, 0.5, mats.leaf, x, height * 0.85, z));
        g.add(voxel(0.3, 0.4, 0.3, mats.leaf, x, height * 1.05, z));
    };
    addTree(-1.2, -1.2, 1.8);
    addTree(1.2, -1.2, 2.0);
    addTree(-1.3, 0, 1.5);
    addTree(1.3, 0, 1.6);

    // FLOWER GARDENS
    const addFlowerBed = (x: number, z: number) => {
        g.add(voxel(0.4, 0.25, 0.4, mats.leaf, x, 0.15, z));
        g.add(voxel(0.1, 0.15, 0.1, mats.emissiveRed, x - 0.1, 0.4, z - 0.1));
        g.add(voxel(0.1, 0.15, 0.1, mats.gold, x + 0.1, 0.4, z + 0.1));
        g.add(voxel(0.1, 0.12, 0.1, mats.emissiveCyan, x, 0.35, z));
    };
    addFlowerBed(-0.6, 0.3);
    addFlowerBed(0.6, 0.3);
    addFlowerBed(-0.5, -0.4);
    addFlowerBed(0.5, -0.4);

    // BUSHES/HEDGES around perimeter
    g.add(voxel(0.5, 0.4, 0.3, mats.leaf, -1.3, 0.15, -0.4));
    g.add(voxel(0.5, 0.4, 0.3, mats.leaf, 1.3, 0.15, -0.4));
    g.add(voxel(0.3, 0.35, 0.5, mats.progressGreen, -0.7, 0.15, 1.3));
    g.add(voxel(0.3, 0.35, 0.5, mats.progressGreen, 0.7, 0.15, 1.3));

    // WOODEN FENCE (partial, decorative)
    g.add(voxel(0.08, 0.6, 1.5, mats.wood, -1.45, 0.15, 0.6));
    g.add(voxel(0.08, 0.6, 1.5, mats.wood, 1.45, 0.15, 0.6));
    g.add(voxel(1.5, 0.6, 0.08, mats.wood, 0, 0.15, 1.45));

    // OUTDOOR DINING AREA
    g.add(voxel(0.5, 0.35, 0.5, mats.wood, 0.4, 0.15, -0.3)); // Table
    g.add(voxel(0.2, 0.25, 0.2, mats.wood, 0.2, 0.15, -0.3)); // Chair
    g.add(voxel(0.2, 0.25, 0.2, mats.wood, 0.6, 0.15, -0.3)); // Chair

    // LANTERNS with warm glow
    const addLantern = (x: number, z: number) => {
        g.add(voxel(0.1, 1.0, 0.1, mats.wood, x, 0.15, z));
        g.add(voxel(0.18, 0.3, 0.18, mats.gold, x, 1.15, z));
        g.add(voxel(0.12, 0.12, 0.12, mats.emissiveGreen, x, 1.4, z));
    };
    addLantern(-0.2, 0.95);
    addLantern(0.2, 0.95);
    addLantern(-0.6, -0.1);
    addLantern(0.6, -0.1);

    // POTTED PLANTS on porch
    g.add(voxel(0.15, 0.2, 0.15, mats.concrete, -0.35, 0.25, 0.1));
    g.add(voxel(0.12, 0.3, 0.12, mats.leaf, -0.35, 0.45, 0.1));
    g.add(voxel(0.15, 0.2, 0.15, mats.concrete, 0.35, 0.25, 0.1));
    g.add(voxel(0.12, 0.3, 0.12, mats.progressGreen, 0.35, 0.45, 0.1));

    // WELCOME SIGN
    g.add(voxel(0.1, 0.8, 0.1, mats.wood, 0, 0.15, 1.3));
    g.add(voxel(0.5, 0.3, 0.08, mats.wood, 0, 0.8, 1.3));

    return g;
};
