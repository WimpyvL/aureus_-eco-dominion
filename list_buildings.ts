import { BUILDINGS } from './engine/data/buildings';
import * as fs from 'fs';

let out = "# Buildings and Their Upgrades\n\n";
for (const key in BUILDINGS) {
    const b = BUILDINGS[key];
    if (!b) continue;
    
    out += `## ${b.name} (Level 1)\n`;
    out += `- **Description:** ${b.desc || 'No description'}\n`;
    out += `- **Base Cost:** ${b.cost}\n`;
    if (b.stats) out += `- **Stats:** ${b.stats}\n`;
    
    if (b.upgrades && b.upgrades.length > 0) {
        out += `\n**Upgrades:**\n`;
        for (const u of b.upgrades) {
            out += `- **Level ${u.level}: ${u.name}**\n`;
            if (u.description) out += `  - Description: ${u.description}\n`;
            if (u.statsDiff) out += `  - Stats: ${u.statsDiff}\n`;
        }
    } else {
        out += `\n*(No upgrades available)*\n`;
    }
    out += `\n---\n\n`;
}

fs.writeFileSync('buildings_list.md', out);
console.log("File written to buildings_list.md");
