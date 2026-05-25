import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { FoliageRenderSystem } from '../game/render/systems/FoliageRenderSystem.ts';

test('updating one foliage chunk leaves other chunk meshes intact', () => {
    const scene = new THREE.Scene();
    const system = new FoliageRenderSystem(scene);

    system.updateChunk('0,0', [
        { x: 0, y: 0, z: 0, type: 'TREE_OAK' },
    ]);
    system.updateChunk('1,0', [
        { x: 16, y: 0, z: 0, type: 'TREE_OAK' },
    ]);

    const initialMeshes = system.getInteractables() as THREE.InstancedMesh[];
    const firstChunkMesh = initialMeshes.find((mesh) => mesh.userData.chunkKey === '0,0');
    const secondChunkMesh = initialMeshes.find((mesh) => mesh.userData.chunkKey === '1,0');

    assert.equal(initialMeshes.length, 2);
    assert.ok(firstChunkMesh);
    assert.ok(secondChunkMesh);

    system.updateChunk('0,0', [
        { x: 1, y: 0, z: 0, type: 'TREE_OAK' },
        { x: 2, y: 0, z: 0, type: 'TREE_OAK', marked: true },
    ]);

    const updatedMeshes = system.getInteractables() as THREE.InstancedMesh[];
    const updatedFirstChunkMesh = updatedMeshes.find((mesh) => mesh.userData.chunkKey === '0,0');
    const updatedSecondChunkMesh = updatedMeshes.find((mesh) => mesh.userData.chunkKey === '1,0');

    assert.equal(updatedMeshes.length, 2);
    assert.ok(updatedFirstChunkMesh);
    assert.ok(updatedSecondChunkMesh);
    assert.notEqual(updatedFirstChunkMesh, firstChunkMesh);
    assert.equal(updatedSecondChunkMesh, secondChunkMesh);
    assert.equal(updatedFirstChunkMesh?.count, 2);
});
