
import * as THREE from 'three';

export class VoxelEngine {
  size: { x: number; y: number; z: number };
  data: Uint8Array;
  revealed: Uint8Array; // 1 for revealed, 0 for hidden
  mesh: THREE.Group;
  instancedMeshes: Map<number, THREE.InstancedMesh>;
  textures: Map<number, THREE.Texture> = new Map();
  
  static AIR = 0;
  static DIRT = 1;
  static STONE = 2;
  static GOLD = 3;
  static GEMS = 4;
  static MANA = 5;
  static HEART = 6;
  static SUPPORT = 7;
  static RECHARGER = 8;

  static CEILING_HEIGHT = 4;

  static BLOCK_HARDNESS: Record<number, number> = {
    [VoxelEngine.DIRT]: 1,
    [VoxelEngine.STONE]: 3,
    [VoxelEngine.GOLD]: 1.5,
    [VoxelEngine.GEMS]: 2,
    [VoxelEngine.MANA]: 2,
    [VoxelEngine.HEART]: 999,
    [VoxelEngine.SUPPORT]: 5,
    [VoxelEngine.RECHARGER]: 2,
  };

  constructor(x: number, y: number, z: number) {
    this.size = { x, y, z };
    this.data = new Uint8Array(x * y * z);
    this.revealed = new Uint8Array(x * y * z);
    this.mesh = new THREE.Group();
    this.instancedMeshes = new Map();
    this.initTextures();
    this.initWorld();
  }

  private initTextures() {
    this.textures.set(VoxelEngine.DIRT, this.createProceduralTexture('dirt'));
    this.textures.set(VoxelEngine.STONE, this.createProceduralTexture('stone'));
    this.textures.set(VoxelEngine.GOLD, this.createProceduralTexture('gold'));
    this.textures.set(VoxelEngine.GEMS, this.createProceduralTexture('gems'));
    this.textures.set(VoxelEngine.MANA, this.createProceduralTexture('mana'));
    this.textures.set(VoxelEngine.SUPPORT, this.createProceduralTexture('support'));
    this.textures.set(VoxelEngine.RECHARGER, this.createProceduralTexture('recharger'));
  }

  private createProceduralTexture(type: string): THREE.Texture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (type === 'stone' || type === 'support') {
      ctx.fillStyle = type === 'support' ? '#3d2b1f' : '#1a1a1a';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, size, size);
      if (type === 'support') {
          ctx.strokeStyle = '#5d4037';
          ctx.beginPath();
          ctx.moveTo(0,0); ctx.lineTo(size, size);
          ctx.moveTo(size,0); ctx.lineTo(0, size);
          ctx.stroke();
      }
    } else if (type === 'dirt') {
      ctx.fillStyle = '#2d1b0f';
      ctx.fillRect(0, 0, size, size);
    } else if (type === 'recharger') {
      ctx.fillStyle = '#001111';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 216, 216);
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(size/2, size/2, 40, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, size, size);
      const color = type === 'gold' ? '#ffd700' : type === 'gems' ? '#ff00ff' : '#00ffff';
      ctx.fillStyle = color;
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 5 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  initWorld() {
    for (let i = 0; i < this.data.length; i++) {
      const { y } = this.indexToPos(i);
      if (y === 0) {
        this.data[i] = VoxelEngine.STONE;
      } else if (y >= 1 && y <= 3) {
        const rand = Math.random();
        if (rand > 0.985) this.data[i] = VoxelEngine.MANA;
        else if (rand > 0.96) this.data[i] = VoxelEngine.GEMS;
        else if (rand > 0.92) this.data[i] = VoxelEngine.GOLD;
        else if (rand > 0.75) this.data[i] = VoxelEngine.STONE;
        else this.data[i] = VoxelEngine.DIRT;
      } else {
        this.data[i] = VoxelEngine.AIR;
      }
    }
    const midX = Math.floor(this.size.x / 2);
    const midZ = Math.floor(this.size.z / 2);
    for (let x = midX - 3; x <= midX + 3; x++) {
      for (let z = midZ - 3; z <= midZ + 3; z++) {
        for (let y = 1; y <= 3; y++) {
          this.setBlock(x, y, z, VoxelEngine.AIR);
          this.reveal(x, y, z);
        }
        this.reveal(x, 0, z);
      }
    }
    this.setBlock(midX, 1, midZ, VoxelEngine.HEART);
    this.reveal(midX, 1, midZ);
  }

  reveal(x: number, y: number, z: number) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y || z < 0 || z >= this.size.z) return;
    this.revealed[x + y * this.size.x + z * this.size.x * this.size.y] = 1;
  }

  isRevealed(x: number, y: number, z: number): boolean {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y || z < 0 || z >= this.size.z) return false;
    return this.revealed[x + y * this.size.x + z * this.size.x * this.size.y] === 1;
  }

  getVoxel(x: number, y: number, z: number): number {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y || z < 0 || z >= this.size.z) return VoxelEngine.AIR;
    return this.data[x + y * this.size.x + z * this.size.x * this.size.y];
  }

  setBlock(x: number, y: number, z: number, type: number) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y || z < 0 || z >= this.size.z) return;
    this.data[x + y * this.size.x + z * this.size.x * this.size.y] = type;
  }

  indexToPos(index: number) {
    const x = index % this.size.x;
    const y = Math.floor((index / this.size.x) % this.size.y);
    const z = Math.floor(index / (this.size.x * this.size.y));
    return { x, y, z };
  }

  // Stability Logic: Returns a list of coordinates that collapsed
  checkStability(): {x: number, y: number, z: number}[] {
    const collapses: {x: number, y: number, z: number}[] = [];
    const radius = 4; // Max distance from a support/wall

    for (let x = 0; x < this.size.x; x++) {
      for (let z = 0; z < this.size.z; z++) {
        const type = this.getVoxel(x, 1, z);
        if (type === VoxelEngine.AIR && this.isRevealed(x, 1, z)) {
          // Check distance to nearest solid at y=1,2,3
          let supported = false;
          for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (Math.abs(dx) + Math.abs(dz) > radius) continue;
                const tx = x + dx; const tz = z + dz;
                const checkType = this.getVoxel(tx, 1, tz);
                if (checkType !== VoxelEngine.AIR && checkType !== VoxelEngine.RECHARGER) {
                    supported = true; break;
                }
            }
            if (supported) break;
          }

          if (!supported && Math.random() < 0.05) {
            // Collapse! Fill the space with debris
            for (let y = 1; y <= 3; y++) {
                if (this.getVoxel(x, y, z) === VoxelEngine.AIR) {
                    this.setBlock(x, y, z, VoxelEngine.DIRT);
                    collapses.push({x, y, z});
                }
            }
          }
        }
      }
    }
    return collapses;
  }

  shouldRender(x: number, y: number, z: number): boolean {
    const type = this.getVoxel(x, y, z);
    if (type === VoxelEngine.AIR) return false;
    if (y > VoxelEngine.CEILING_HEIGHT) return false;
    if (type === VoxelEngine.HEART && this.isRevealed(x, y, z)) return true;
    if ((type === VoxelEngine.SUPPORT || type === VoxelEngine.RECHARGER) && this.isRevealed(x, y, z)) return true;

    const neighbors = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ];

    for (const [nx, ny, nz] of neighbors) {
      const tx = x + nx; const ty = y + ny; const tz = z + nz;
      if (this.isRevealed(tx, ty, tz) && this.getVoxel(tx, ty, tz) === VoxelEngine.AIR) return true;
    }
    if (y === 0 && this.isRevealed(x, 1, z) && this.getVoxel(x, 1, z) === VoxelEngine.AIR) return true;
    return false;
  }

  generateMesh() {
    this.mesh.children.forEach((child) => {
      if (child instanceof THREE.InstancedMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
    this.mesh.clear();
    this.instancedMeshes.clear();

    const box = new THREE.BoxGeometry(1, 1, 1);
    const materials: Record<number, THREE.Material> = {
      [VoxelEngine.DIRT]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.DIRT) }),
      [VoxelEngine.STONE]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.STONE) }),
      [VoxelEngine.GOLD]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.GOLD), emissive: 0xffd700, emissiveIntensity: 0.1 }),
      [VoxelEngine.GEMS]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.GEMS), emissive: 0xff00ff, emissiveIntensity: 0.1 }),
      [VoxelEngine.MANA]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.MANA), emissive: 0x00ffff, emissiveIntensity: 0.1 }),
      [VoxelEngine.HEART]: new THREE.MeshStandardMaterial({ color: 0x880000, emissive: 0xff0000, emissiveIntensity: 2 }),
      [VoxelEngine.SUPPORT]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.SUPPORT) }),
      [VoxelEngine.RECHARGER]: new THREE.MeshStandardMaterial({ map: this.textures.get(VoxelEngine.RECHARGER), emissive: 0x00ffff, emissiveIntensity: 0.2 }),
    };

    const counts = new Map<number, number>();
    for (let i = 0; i < this.data.length; i++) {
      const { x, y, z } = this.indexToPos(i);
      if (this.shouldRender(x, y, z)) {
        const type = this.data[i];
        counts.set(type, (counts.get(type) || 0) + 1);
      }
    }

    counts.forEach((count, type) => {
      const im = new THREE.InstancedMesh(box, materials[type], count);
      im.castShadow = true; im.receiveShadow = true;
      this.instancedMeshes.set(type, im);
      this.mesh.add(im);
    });

    const indices = new Map<number, number>();
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.data.length; i++) {
      const { x, y, z } = this.indexToPos(i);
      if (this.shouldRender(x, y, z)) {
        const type = this.data[i];
        const idx = indices.get(type) || 0;
        dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
        if (type === VoxelEngine.HEART) { dummy.scale.set(2, 2, 2); dummy.position.y += 0.5; } 
        else if (type === VoxelEngine.SUPPORT) { dummy.scale.set(0.6, 1, 0.6); }
        else if (type === VoxelEngine.RECHARGER) { dummy.scale.set(1, 0.1, 1); dummy.position.y -= 0.45; }
        else { dummy.scale.set(1, 1, 1); }
        dummy.updateMatrix();
        this.instancedMeshes.get(type)!.setMatrixAt(idx, dummy.matrix);
        indices.set(type, idx + 1);
      }
    }

    this.instancedMeshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
  }
}
