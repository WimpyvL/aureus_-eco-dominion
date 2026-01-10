
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';

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

// Updated Shader with Instancing Support
export const waterFlowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0x06b6d4) }, // Matches Minimap Cyan
    foamColor: { value: new THREE.Color(0xa5f3fc) }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    
    void main() { 
        vec3 transformed = position;
        
        #ifdef USE_INSTANCING
          vec4 worldPosition = instanceMatrix * vec4(transformed, 1.0);
        #else
          vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        #endif
        
        // Apply modelMatrix for non-instanced or global transform if needed
        #ifdef USE_INSTANCING
           worldPosition = modelMatrix * worldPosition;
        #endif

        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition; 
    }
  `,
  fragmentShader: `
    uniform float time; 
    uniform vec3 color; 
    uniform vec3 foamColor;
    varying vec3 vWorldPosition; 
    void main() { 
        // World-space continuous pattern
        float pattern = sin((vWorldPosition.x + vWorldPosition.z) * 4.0 - time * 2.0) * 0.5 + 0.5;
        // Secondary interference
        pattern += sin((vWorldPosition.x - vWorldPosition.z) * 2.0 + time) * 0.2;
        
        float foam = smoothstep(0.85, 1.0, pattern);
        vec3 finalColor = mix(color, foamColor, foam * 0.5);
        
        // Edge transparency falloff could go here if we had depth buffer access, 
        // but for now simple alpha
        gl_FragColor = vec4(finalColor, 0.9); 
    }
  `,
  transparent: true,
  side: THREE.DoubleSide // Ensure visibility from all angles
});

// Single Master Material for Terrain Consolidation
export const matMaster = new THREE.MeshStandardMaterial({
  map: texMaster,
  roughness: 1.0,
  vertexColors: true, // ENABLED for merged geometry
  side: THREE.DoubleSide // Fixes invisible faces if winding is off
});

// Base Materials (Still used for specific Buildings/UI/Particles)
export const mats = {
  concrete: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x94a3b8), roughness: 0.9 }),
  metal: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x64748b, 40), metalness: 0.6, roughness: 0.3 }),
  metalLight: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x94a3b8, 30), metalness: 0.5, roughness: 0.4 }),
  blueMetal: new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.5 }),
  greenMetal: new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.4, roughness: 0.5 }),
  darkPipe: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 }),
  solar: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2, emissive: 0x1e3a8a, emissiveIntensity: 0.2 }),
  wood: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x92400e, 30), roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }),
  pine: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x14532d), roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.85, roughness: 0.1 }),
  brick: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xb91c1c, 40), roughness: 0.9 }),
  white: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xf1f5f9, 10), roughness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xffe135, 10), metalness: 0.9, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.4 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.4, metalness: 0.9, roughness: 0.0 }),
  hazard: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xfacc15), roughness: 0.5 }),
  cactus: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x65a30d, 25), roughness: 0.8 }),
  rock: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x475569, 40), roughness: 0.9 }),
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
  palmTrunk: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xa16207, 35), roughness: 0.8 }),
  palmLeaf: new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 }),
  deadWood: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x525252, 40), roughness: 1.0 }),
  mushroomStem: new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 }),
  mushroomCap: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xdc2626, 10), roughness: 0.7 }),
  bone: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xe5e5e5, 5), roughness: 0.6 }),
  flowerPurple: new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.2 }),
  flowerYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.2 }),
  crystalCyan: new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.9, roughness: 0.1, emissive: 0x22d3ee, emissiveIntensity: 0.5 }),
  sandStone: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 1.0 }),

  // New Water System Mats
  sandWet: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xe6c288, 15), roughness: 0.6 }),
  waterDeep: new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.9, roughness: 0.1 }),
  waterSurface: waterFlowMaterial,
  waterSeaweed: new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 }),
  waterCoral: new THREE.MeshStandardMaterial({ color: 0xf44336, roughness: 0.8 }),
  waterGold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 }),

  // Dedicated basin/reservoir water - turquoise with focused sun specular
  reservoirWater: new THREE.MeshStandardMaterial({
    color: 0x0e7490,           // Deep cyan/teal water
    transparent: true,
    opacity: 0.8,
    metalness: 0.05,           // Very low - water isn't metallic
    roughness: 0.4,            // Higher - diffuses reflection except sun specular
    emissive: 0x083344,        // Very subtle deep glow
    emissiveIntensity: 0.08
  })
};

// Map keys used in worker to material definitions.
export const terrainMats = {
  ...mats
};
