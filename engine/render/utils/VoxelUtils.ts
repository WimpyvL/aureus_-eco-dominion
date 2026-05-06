
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Helper to bake a Group of colored meshes into a single Geometry with Vertex Colors
export function mergeGroupGeometry(group: THREE.Group): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = [];

    group.updateMatrixWorld(true);

    group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            let geom = child.geometry.clone();

            // RoundedBoxGeometry and some Three primitives are indexed while legacy voxel
            // meshes are not. Normalize before merge so foliage batching can combine both.
            if (geom.index) {
                geom = geom.toNonIndexed();
            }

            // Apply transform
            geom.applyMatrix4(child.matrixWorld);

            // Ensure attributes
            if (!geom.getAttribute('color')) {
                const count = geom.getAttribute('position').count;
                geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
            }

            // Bake material color into vertex colors
            const colors = geom.getAttribute('color');
            const mat = child.material;
            let r = 1, g = 1, b = 1;

            if (mat && (mat as any).color) {
                r = (mat as any).color.r;
                g = (mat as any).color.g;
                b = (mat as any).color.b;
            }

            for (let i = 0; i < colors.count; i++) {
                const existingR = colors.getX(i);
                const existingG = colors.getY(i);
                const existingB = colors.getZ(i);

                if (existingR === 0 && existingG === 0 && existingB === 0) {
                    colors.setXYZ(i, r, g, b);
                } else {
                    if (r !== 1 || g !== 1 || b !== 1) {
                        colors.setXYZ(i, r, g, b);
                    }
                }
            }

            geometries.push(geom);
        }
    });

    if (geometries.length === 0) return new THREE.BoxGeometry();

    const merged = BufferGeometryUtils.mergeGeometries(geometries);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
}
