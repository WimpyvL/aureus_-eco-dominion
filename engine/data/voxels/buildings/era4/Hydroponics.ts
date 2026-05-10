import * as THREE from 'three';
import { mats } from '../../../../render/materials/VoxelMaterials';
import { dome, FactoryOptions, torusRing, voxel } from '../../../../render/utils/VoxelBuilder';

export const HydroponicsFactory = () => {
    const g = new THREE.Group();

    g.add(voxel(2.0, 0.18, 2.0, mats.concrete, 0, 0, 0));
    g.add(voxel(1.82, 0.08, 1.82, mats.concreteLight, 0, 0.18, 0));
    g.add(voxel(1.72, 1.88, 1.72, mats.glass, 0, 0.22, 0));

    g.add(voxel(0.1, 1.88, 0.1, mats.metalLight, -0.86, 0.22, -0.86));
    g.add(voxel(0.1, 1.88, 0.1, mats.metalLight, 0.86, 0.22, -0.86));
    g.add(voxel(0.1, 1.88, 0.1, mats.metalLight, -0.86, 0.22, 0.86));
    g.add(voxel(0.1, 1.88, 0.1, mats.metalLight, 0.86, 0.22, 0.86));
    g.add(voxel(1.72, 0.08, 0.08, mats.metalLight, 0, 2.02, -0.86));
    g.add(voxel(1.72, 0.08, 0.08, mats.metalLight, 0, 2.02, 0.86));

    for (let y = 0.52; y <= 1.48; y += 0.48) {
        g.add(voxel(1.34, 0.1, 0.32, mats.leaf, 0, y, -0.42));
        g.add(voxel(1.34, 0.1, 0.32, mats.leaf, 0, y, 0.42));
        g.add(voxel(1.46, 0.05, 0.08, mats.metalLight, 0, y + 0.12, -0.22));
        g.add(voxel(1.46, 0.05, 0.08, mats.metalLight, 0, y + 0.12, 0.22));
    }

    g.add(voxel(1.56, 0.05, 0.12, mats.emissiveCyan, 0, 1.9, 0));
    g.add(voxel(0.08, 1.66, 0.08, mats.blueMetal, -0.72, 0.34, 0));
    g.add(voxel(0.08, 1.66, 0.08, mats.blueMetal, 0.72, 0.34, 0));
    g.add(voxel(1.46, 0.08, 0.08, mats.blueMetal, 0, 0.44, -0.76));
    g.add(voxel(0.52, 0.18, 0.52, mats.concrete, 0, 0.18, 0.9));
    g.add(dome(0.38, mats.glass, 0, 0.48, 0.9));
    g.add(torusRing(0.3, 0.03, mats.greenMetal, 0, 0.6, 0.9, { rotationX: Math.PI / 2 }));

    return g;
};
