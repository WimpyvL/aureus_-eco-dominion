
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as THREE from 'three';

// Global shared clipping plane removed - surface only architecture

// --- Procedural Textures ---

function createNoiseTexture(width: number, height: number, colorHex: number, grainScale: number = 20): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#' + new THREE.Color(colorHex).getHexString();
  ctx.fillRect(0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * grainScale;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Universal Noise Texture for Master Material (Grayscale with Grain)
const texMaster = createNoiseTexture(64, 64, 0xffffff, 40);

function createWaterMaterial(baseColorHex: number, foamColorHex: number): THREE.ShaderMaterial {
    const mat = new THREE.MeshStandardMaterial({
        color: baseColorHex,
        transparent: true,
        opacity: 0.85,
        roughness: 0.05,
        metalness: 0.8,
        side: THREE.DoubleSide
    }) as unknown as THREE.ShaderMaterial;

    const uniforms = {
        time: { value: 0 },
        waterColor: { value: new THREE.Color(baseColorHex) },
        foamColor: { value: new THREE.Color(foamColorHex) }
    };
    (mat as any).uniforms = uniforms;

    mat.onBeforeCompile = (shader) => {
        shader.uniforms.time = uniforms.time;
        shader.uniforms.waterColor = uniforms.waterColor;
        shader.uniforms.foamColor = uniforms.foamColor;

        shader.vertexShader = `
            uniform float time;
            varying vec3 vWorldPos;
            varying float vWaveHeight;
            ${shader.vertexShader}
        `.replace(
            `#include <begin_vertex>`,
            `
            vec3 transformed = vec3(position);
            
            #ifdef USE_INSTANCING
              vec4 myWorldPosition = instanceMatrix * vec4(transformed, 1.0);
            #else
              vec4 myWorldPosition = modelMatrix * vec4(transformed, 1.0);
            #endif

            #ifdef USE_INSTANCING
               myWorldPosition = modelMatrix * myWorldPosition;
            #endif

            // More realistic wave sum
            float wave1 = sin(myWorldPosition.x * 1.5 + time * 1.2) * 0.15;
            float wave2 = cos(myWorldPosition.z * 1.2 + time * 1.5) * 0.15;
            float wave3 = sin((myWorldPosition.x * 0.8 + myWorldPosition.z * 0.5) - time) * 0.1;
            
            float height = wave1 + wave2 + wave3;
            transformed.y += height;

            vWorldPos = myWorldPosition.xyz + vec3(0.0, height, 0.0);
            vWaveHeight = height;
            `
        ).replace(
            `#include <beginnormal_vertex>`,
            `
            vec3 objectNormal = vec3(normal);
            
            float dHx = 1.5 * 0.15 * cos(vWorldPos.x * 1.5 + time * 1.2) + 0.8 * 0.1 * cos((vWorldPos.x * 0.8 + vWorldPos.z * 0.5) - time);
            float dHz = 1.2 * 0.15 * -sin(vWorldPos.z * 1.2 + time * 1.5) + 0.5 * 0.1 * cos((vWorldPos.x * 0.8 + vWorldPos.z * 0.5) - time);
            
            if (normal.y > 0.5) {
                vec3 modifiedNormal = normalize(vec3(-dHx, 1.0, -dHz));
                objectNormal = modifiedNormal;
            }
            `
        );

        shader.fragmentShader = `
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 foamColor;
            varying vec3 vWorldPos;
            varying float vWaveHeight;
            ${shader.fragmentShader}
        `.replace(
            `#include <color_fragment>`,
            `
            #include <color_fragment>
            
            float pattern = sin((vWorldPos.x + vWorldPos.z) * 4.0 - time * 2.0) * 0.5 + 0.5;
            pattern += sin((vWorldPos.x - vWorldPos.z) * 2.0 + time) * 0.2;
            
            float wavePeak = smoothstep(-0.1, 0.3, vWaveHeight); 
            float foam = smoothstep(0.85, 1.0, pattern) * wavePeak;
            
            vec3 finalMix = mix(waterColor, foamColor, foam);
            diffuseColor.rgb = finalMix;
            `
        );
    };

    return mat;
}

export const waterFlowMaterial = createWaterMaterial(0x06b6d4, 0xa5f3fc);

export const bioLumeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0x22d3ee) }, // Cyan
    glowColor: { value: new THREE.Color(0x00ffff) }
  },
  vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
  fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform vec3 glowColor;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        void main() {
            float pulse = (sin(time * 2.0 + vWorldPosition.x * 0.5 + vWorldPosition.z * 0.5) * 0.5 + 0.5);
            vec3 finalColor = mix(color, glowColor, pulse);
            // Fresnel-like effect for soft edges
            float fresnel = pow(1.0 - max(0.0, vNormal.z), 2.0);
            gl_FragColor = vec4(finalColor, 0.8 + fresnel * 0.2);
        }
    `,
  transparent: true,
  side: THREE.DoubleSide
});

// Murky/Oil water material for unpowered reservoirs or industrial waste
export const oilWaterMaterial = createWaterMaterial(0x1a365d, 0x2d3748);

// Deep turquoise water for reservoirs and basins
export const reservoirWaterMaterial = createWaterMaterial(0x0e7490, 0x22d3ee);

// Single Master Material for Terrain Consolidation
export const matMaster = new THREE.MeshStandardMaterial({
  map: texMaster,
  roughness: 1.0,
  vertexColors: true, // ENABLED for merged geometry
  side: THREE.DoubleSide, // Ensure complex voxel models are visible from all angles
  clipShadows: true
});

// Base Materials (Still used for specific Buildings/UI/Particles)
export const mats: Record<string, THREE.Material> = {
  concrete: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x94a3b8), roughness: 0.9 }),
  metal: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x64748b, 40), metalness: 0.6, roughness: 0.3 }),
  metalLight: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x94a3b8, 30), metalness: 0.5, roughness: 0.4 }),
  blueMetal: new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.5 }),
  greenMetal: new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.4, roughness: 0.5 }),
  darkPipe: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 }),
  solar: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2, emissive: 0x1e3a8a, emissiveIntensity: 0.2 }),
  wood: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x92400e, 30), roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 }),
  sand: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xe6c288, 20), color: 0xe6c288, roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 1.0 }),
  pine: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x14532d), color: 0x14532d, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.85, roughness: 0.1 }),
  brick: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xb91c1c, 40), roughness: 0.9 }),
  white: new THREE.MeshStandardMaterial({ map: createNoiseTexture(128, 128, 0xf8fafc, 35), roughness: 0.5 }),
  concreteLight: new THREE.MeshStandardMaterial({ map: createNoiseTexture(128, 128, 0xe2e8f0, 40), roughness: 0.75 }),
  ghost: new THREE.MeshStandardMaterial({ color: 0x64748b, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xffe135, 10), color: 0xffe135, metalness: 0.9, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.4 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.4, metalness: 0.9, roughness: 0.0 }),
  hazard: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xfacc15), color: 0xfacc15, roughness: 0.5 }),
  cactus: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x65a30d, 25), color: 0x65a30d, roughness: 0.8 }),
  cactusFlower: new THREE.MeshStandardMaterial({ color: 0xff4bb0, emissive: 0xff4bb0, emissiveIntensity: 0.3 }),
  driedGrass: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xba9d6d, 15), color: 0xba9d6d, roughness: 1.0 }),
  savannaGreen: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x4d5d30, 20), color: 0x4d5d30, roughness: 0.9 }),
  rock: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x475569, 40), color: 0x475569, roughness: 0.9 }),
  tarp: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x991b1b, 20), roughness: 0.9, side: THREE.DoubleSide }),
  asphalt: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x334155, 15), roughness: 0.9 }),
  dirt: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x78350f), roughness: 1.0 }),
  progressGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
  emissiveRed: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0 }),
  emissiveCyan: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.0 }),
  emissiveGreen: new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2.0 }),
  pit: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0 }),

  // Specific Tree Mats
  birchWood: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xf5f5dc, 20), roughness: 0.9 }),
  birchLeaf: new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.8 }),
  willowLeaf: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x3f6212, 30), roughness: 0.8 }),
  appleFruit: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }),
  snowLeaf: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xffffff, 10), roughness: 0.6 }),
  palmTrunk: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xa16207, 35), color: 0xa16207, roughness: 0.8 }),
  palmLeaf: new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 }),
  deadWood: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x525252, 40), color: 0x525252, roughness: 1.0 }),
  deadWoodLight: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x71717a, 30), color: 0x71717a, roughness: 1.0 }),
  mushroomStem: new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 }),
  mushroomCap: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xdc2626, 10), color: 0xdc2626, roughness: 0.7 }),
  bone: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xe5e5e5, 5), roughness: 0.6 }),
  flowerPurple: new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.2 }),
  flowerYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.2 }),
  crystalCyan: new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.9, roughness: 0.1, emissive: 0x22d3ee, emissiveIntensity: 0.5 }),
  sandStone: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 1.0 }),

  // New Water System Mats
  sandWet: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xe6c288, 15), roughness: 0.6 }),
  waterDeep: new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.9, roughness: 0.1 }),
  waterSurface: waterFlowMaterial,
  waterMaterial: waterFlowMaterial,
  waterSeaweed: new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 }),
  waterCoral: new THREE.MeshStandardMaterial({ color: 0xf44336, roughness: 0.8 }),
  waterGold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 }),
  oilWater: oilWaterMaterial,
  reservoirWater: reservoirWaterMaterial,
  biolume: bioLumeMaterial
};

// Apply clipping plane to all standard materials in the record
Object.values(mats).forEach(mat => {
  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial || mat instanceof THREE.ShaderMaterial) {
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.clipShadows = true;
    }
    if (mat instanceof THREE.ShaderMaterial) {
      mat.clipping = true;
    }
  }
});

// Specific Shader Materials

// Map keys used in worker to material definitions.
export const terrainMats = {
  ...mats
};
