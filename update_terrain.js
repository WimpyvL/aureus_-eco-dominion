import fs from 'node:fs';

const filePath = 'c:\\Users\\willi\\Downloads\\aureus_-eco-dominion-main (7)\\game\\render\\systems\\TerrainRenderSystem.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update disposal in applyChunkUpdate
content = content.replace(
    /if\s*\(chunk\.waterMesh\)\s*{\s*this\.scene\.remove\(chunk\.waterMesh\);\s*chunk\.waterMesh\.geometry\.dispose\(\);\s*}/,
    (match) => match + `\n        if (chunk.ghostMesh) {\n            this.scene.remove(chunk.ghostMesh);\n            chunk.ghostMesh.geometry.dispose();\n        }`
);

// 2. Update mesh creation in applyChunkUpdate
content = content.replace(
    /chunk\.waterMesh\s*=\s*createMesh\(res\.water,\s*mats\.reservoirWater,\s*false\);\s*if\s*\(chunk\.waterMesh\)\s*{\s*chunk\.waterMesh\.receiveShadow\s*=\s*false;\s*this\.scene\.add\(chunk\.waterMesh\);\s*}/,
    (match) => match + `\n\n        chunk.ghostMesh = createMesh(res.ghost, mats.ghost, false);\n        if (chunk.ghostMesh) {\n            chunk.ghostMesh.receiveShadow = false;\n            this.scene.add(chunk.ghostMesh);\n        }`
);

// 3. Update disposeChunk method
content = content.replace(
    /(private\s+disposeChunk\(key:\s*string,\s*chunk:\s*ChunkRenderData\):\s*void\s*{\s*if\s*\(chunk\.mesh\)\s*{[\s\S]*?if\s*\(chunk\.waterMesh\)\s*{[\s\S]*?})/,
    (match) => match + `\n        if (chunk.ghostMesh) {\n            this.scene.remove(chunk.ghostMesh);\n            chunk.ghostMesh.geometry.dispose();\n        }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated TerrainRenderSystem.ts with regex');
