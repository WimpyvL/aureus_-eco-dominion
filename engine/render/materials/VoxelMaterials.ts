
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as THREE from 'three';

// Global shared clipping plane removed - surface only architecture

// --- Procedural Textures ---

type TextureFilterMode = 'pixel' | 'smooth';

function finalizeCanvasTexture(canvas: HTMLCanvasElement, filterMode: TextureFilterMode = 'pixel'): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  if (filterMode === 'smooth') {
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
  } else {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createNoiseTexture(
  width: number,
  height: number,
  colorHex: number,
  grainScale: number = 20,
  filterMode: TextureFilterMode = 'pixel'
): THREE.Texture {
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
  return finalizeCanvasTexture(canvas, filterMode);
}

function varyChannel(channel: number, amount: number) {
  return Math.max(0, Math.min(255, channel + amount));
}

function paintSoftBlob(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colorHex: number,
  alpha: number,
  minRadius: number,
  maxRadius: number
) {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const radius = minRadius + Math.random() * Math.max(0.01, maxRadius - minRadius);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const color = new THREE.Color(colorHex);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function paintSoftSpeckles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: number[],
  count: number,
  minRadius: number,
  maxRadius: number,
  alphaMin: number,
  alphaMax: number
) {
  for (let i = 0; i < count; i++) {
    const colorHex = colors[i % colors.length];
    paintSoftBlob(
      ctx,
      width,
      height,
      colorHex,
      alphaMin + Math.random() * Math.max(0.001, alphaMax - alphaMin),
      minRadius,
      maxRadius
    );
  }
}

function createLayeredTerrainTexture(
  width: number,
  height: number,
  baseHex: number,
  detailHexes: number[],
  grainScale: number,
  filterMode: TextureFilterMode = 'smooth'
): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#' + new THREE.Color(baseHex).getHexString();
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 48; i++) {
    const detailHex = detailHexes[i % detailHexes.length];
    paintSoftBlob(ctx, width, height, detailHex, 0.06 + Math.random() * 0.08, width * 0.04, width * 0.18);
  }

  // Keep the breakup non-directional. Thin stroke overlays shimmer badly when
  // repeated across large surfaces and were the source of the moving ground lines.
  paintSoftSpeckles(
    ctx,
    width,
    height,
    detailHexes,
    36,
    width * 0.012,
    width * 0.035,
    0.025,
    0.05
  );

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * grainScale;
    const secondary = (Math.random() - 0.5) * grainScale * 0.55;
    data[i] = varyChannel(data[i], grain);
    data[i + 1] = varyChannel(data[i + 1], secondary);
    data[i + 2] = varyChannel(data[i + 2], grain * 0.75);
  }
  ctx.putImageData(imgData, 0, 0);

  return finalizeCanvasTexture(canvas, filterMode);
}

function createTerrainSurfaceMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.98,
    vertexColors: true,
    side: THREE.DoubleSide,
    clipShadows: true
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vBaseColor;
      ${shader.vertexShader}
    `
      .replace(
        '#include <color_vertex>',
        `
        #include <color_vertex>
        vBaseColor = color.xyz;
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vec4 terrainWorldPosition = modelMatrix * vec4(transformed, 1.0);
        vWorldPos = terrainWorldPosition.xyz;
        `
      );

    shader.fragmentShader = `
      varying vec3 vWorldPos;
      varying vec3 vBaseColor;

      float terrainHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float terrainNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = terrainHash(i);
        float b = terrainHash(i + vec2(1.0, 0.0));
        float c = terrainHash(i + vec2(0.0, 1.0));
        float d = terrainHash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      ${shader.fragmentShader}
    `.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>

      vec2 terrainUv = vWorldPos.xz;
      float broadNoise = terrainNoise(terrainUv * 0.12);
      float fineNoise = terrainNoise(terrainUv * 0.55);
      float pebbleNoise = terrainNoise(terrainUv * 1.65);
      float stripe = abs(fract((terrainUv.x + terrainUv.y * 0.6) * 0.22) - 0.5);

      float grassMask = smoothstep(0.34, 0.6, vBaseColor.g) * (1.0 - smoothstep(0.5, 0.78, vBaseColor.r));
      float sandMask = smoothstep(0.68, 0.92, vBaseColor.r) * smoothstep(0.48, 0.78, vBaseColor.g) * (1.0 - smoothstep(0.2, 0.35, vBaseColor.b));
      float dirtMask = smoothstep(0.24, 0.52, vBaseColor.r) * (1.0 - smoothstep(0.24, 0.42, vBaseColor.g));
      float stoneMask = clamp(1.0 - max(grassMask, max(sandMask, dirtMask)), 0.0, 1.0);

      vec3 albedo = diffuseColor.rgb;

      vec3 grassTint = vec3(0.92, 1.04, 0.9);
      grassTint *= 0.94 + broadNoise * 0.16;
      grassTint *= 0.96 + step(0.56, stripe) * 0.07;
      grassTint *= 0.93 + fineNoise * 0.12;

      vec3 sandTint = vec3(1.05, 0.99, 0.9);
      sandTint *= 0.9 + broadNoise * 0.12;
      sandTint *= 0.9 + smoothstep(0.12, 0.48, stripe) * 0.14;
      sandTint *= 0.96 + pebbleNoise * 0.08;

      vec3 dirtTint = vec3(1.0, 0.9, 0.82);
      dirtTint *= 0.9 + broadNoise * 0.15;
      dirtTint *= 0.94 + fineNoise * 0.11;
      dirtTint *= 0.93 + smoothstep(0.65, 0.92, pebbleNoise) * 0.08;

      vec3 stoneTint = vec3(0.96, 0.99, 1.04);
      stoneTint *= 0.88 + broadNoise * 0.18;
      stoneTint *= 0.9 + fineNoise * 0.16;

      albedo *= mix(vec3(1.0), grassTint, grassMask);
      albedo *= mix(vec3(1.0), sandTint, sandMask);
      albedo *= mix(vec3(1.0), dirtTint, dirtMask);
      albedo *= mix(vec3(1.0), stoneTint, stoneMask);

      diffuseColor.rgb = albedo;
      `
    );
  };

  return mat;
}

function createFoliageInstancedMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.DoubleSide,
    clipShadows: true,
  });
}

// Universal terrain texture for chunk solids: neutral, layered, and mip-smoothed.
const texMaster = createLayeredTerrainTexture(128, 128, 0xb6b6b6, [0xe4e4e4, 0x8c8c8c, 0xc9c9c9], 18);
const texConcrete = createLayeredTerrainTexture(96, 96, 0x9aa4b2, [0xd4dbe4, 0x7b8794, 0xadb8c7], 16);
const texMetal = createLayeredTerrainTexture(96, 96, 0x64748b, [0xa1afc4, 0x495768, 0x7b8ba1], 18);
const texWood = createLayeredTerrainTexture(96, 96, 0x8b5e34, [0xb67843, 0x6f431e, 0xa97346], 20);
const texSand = createLayeredTerrainTexture(128, 128, 0xe2bf84, [0xf0d9a9, 0xcda664, 0xd8b578], 14);
const texGrass = createLayeredTerrainTexture(128, 128, 0x5f8a41, [0x84b55e, 0x476a2d, 0x729e51], 16);
const texRock = createLayeredTerrainTexture(128, 128, 0x586371, [0x8993a1, 0x3f4855, 0x697585], 20);
const texAsphalt = createLayeredTerrainTexture(128, 128, 0x3a4654, [0x5d6d7f, 0x27303b, 0x475566], 14);
const texDirt = createLayeredTerrainTexture(128, 128, 0x7d5127, [0xa06a3a, 0x5d3816, 0x8d5d2d], 18);
const texPine = createLayeredTerrainTexture(96, 96, 0x25461f, [0x3d6c35, 0x183015, 0x2f5928], 18);
const texDriedGrass = createLayeredTerrainTexture(96, 96, 0xba9d6d, [0xd6be8d, 0x93764d, 0xc3a877], 14);
const texSavanna = createLayeredTerrainTexture(96, 96, 0x5d6c34, [0x7e914c, 0x455027, 0x6a7f3e], 14);
const texSandWet = createLayeredTerrainTexture(96, 96, 0xcfb07d, [0xe1c08e, 0xa88758, 0xc69d66], 10);

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

// Shared terrain material, but with biome-aware breakup so grass, sand, dirt,
// and stone no longer read like the same grey texture with different tinting.
export const terrainSurfaceMaterial = createTerrainSurfaceMaterial();
export const foliageInstancedMaterial = createFoliageInstancedMaterial();
export const matMaster = terrainSurfaceMaterial;

// Base Materials (Still used for specific Buildings/UI/Particles)
export const mats: Record<string, THREE.Material> = {
  concrete: new THREE.MeshStandardMaterial({ map: texConcrete, roughness: 0.88 }),
  metal: new THREE.MeshStandardMaterial({ map: texMetal, metalness: 0.6, roughness: 0.3 }),
  metalLight: new THREE.MeshStandardMaterial({ map: texConcrete, metalness: 0.5, roughness: 0.4 }),
  blueMetal: new THREE.MeshStandardMaterial({ map: texMetal, color: 0x4f8ff5, metalness: 0.45, roughness: 0.42 }),
  greenMetal: new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.4, roughness: 0.5 }),
  darkPipe: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 }),
  solar: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2, emissive: 0x1e3a8a, emissiveIntensity: 0.2 }),
  wood: new THREE.MeshStandardMaterial({ map: texWood, roughness: 0.8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 }),
  sand: new THREE.MeshStandardMaterial({ map: texSand, color: 0xe6c288, roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ map: texGrass, color: 0x72b35f, roughness: 1.0 }),
  pine: new THREE.MeshStandardMaterial({ map: texPine, color: 0x1f5a1a, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.85, roughness: 0.1 }),
  brick: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xb91c1c, 40, 'smooth'), roughness: 0.9 }),
  white: new THREE.MeshStandardMaterial({ map: createNoiseTexture(128, 128, 0xf8fafc, 35, 'smooth'), roughness: 0.5 }),
  concreteLight: new THREE.MeshStandardMaterial({ map: createNoiseTexture(128, 128, 0xe2e8f0, 40, 'smooth'), roughness: 0.75 }),
  ghost: new THREE.MeshStandardMaterial({ color: 0x64748b, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xffe135, 10), color: 0xffe135, metalness: 0.9, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.4 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.4, metalness: 0.9, roughness: 0.0 }),
  hazard: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0xfacc15), color: 0xfacc15, roughness: 0.5 }),
  cactus: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x65a30d, 25), color: 0x65a30d, roughness: 0.8 }),
  cactusFlower: new THREE.MeshStandardMaterial({ color: 0xff4bb0, emissive: 0xff4bb0, emissiveIntensity: 0.3 }),
  driedGrass: new THREE.MeshStandardMaterial({ map: texDriedGrass, color: 0xba9d6d, roughness: 1.0 }),
  savannaGreen: new THREE.MeshStandardMaterial({ map: texSavanna, color: 0x4d5d30, roughness: 0.9 }),
  rock: new THREE.MeshStandardMaterial({ map: texRock, color: 0x475569, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ map: texRock, color: 0x7b8794, roughness: 0.95 }),
  tarp: new THREE.MeshStandardMaterial({ map: createNoiseTexture(64, 64, 0x991b1b, 20), roughness: 0.9, side: THREE.DoubleSide }),
  asphalt: new THREE.MeshStandardMaterial({ map: texAsphalt, roughness: 0.92 }),
  dirt: new THREE.MeshStandardMaterial({ map: texDirt, roughness: 1.0 }),
  progressGreen: new THREE.MeshStandardMaterial({ map: texGrass, color: 0x58a84a, roughness: 0.95 }),
  emissiveOrange: new THREE.MeshStandardMaterial({ color: 0xfb923c, emissive: 0xfb923c, emissiveIntensity: 1.6 }),
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
  sandWet: new THREE.MeshStandardMaterial({ map: texSandWet, roughness: 0.6 }),
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
