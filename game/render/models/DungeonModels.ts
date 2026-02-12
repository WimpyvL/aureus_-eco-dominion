
import * as THREE from 'three';

export function createDungeonHeart() {
    const group = new THREE.Group();

    // Base platform
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 0.4, 8),
        new THREE.MeshStandardMaterial({
            color: 0x3d2b1f,
            roughness: 0.9,
            metalness: 0.1,
            emissive: 0x221100,
            emissiveIntensity: 0.2
        })
    );
    base.position.y = -0.3;
    group.add(base);

    // Glowing core (Crystal shape)
    const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.6, 0),
        new THREE.MeshStandardMaterial({
            color: 0xff3300,
            emissive: 0xff0000,
            emissiveIntensity: 2.5,
            roughness: 0.2,
            metalness: 0.5,
            transparent: true,
            opacity: 0.9
        })
    );
    core.name = 'core';
    core.position.y = 0.5;
    group.add(core);

    // Floating rings
    const ringGeometry = new THREE.TorusGeometry(0.9, 0.03, 8, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xaa8844,
        metalness: 1,
        roughness: 0.2,
        emissive: 0x442200,
        emissiveIntensity: 0.5
    });

    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.rotation.x = Math.PI / 2;
    ring1.name = 'ring1';
    ring1.position.y = 0.5;
    group.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring2.rotation.z = Math.PI / 2;
    ring2.name = 'ring2';
    ring2.position.y = 0.5;
    group.add(ring2);

    // Support pillars
    const pillarGeom = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });

    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const p = new THREE.Mesh(pillarGeom, pillarMat);
        p.position.set(Math.cos(angle) * 0.7, 0.1, Math.sin(angle) * 0.7);
        p.rotation.y = -angle;
        p.rotation.z = 0.2;
        group.add(p);
    }

    // Light
    const light = new THREE.PointLight(0xff0000, 3, 10);
    light.position.y = 0.5;
    group.add(light);

    return group;
}
