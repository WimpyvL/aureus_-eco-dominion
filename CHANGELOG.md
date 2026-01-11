# Aureus: Eco Dominion - Version 1.1 Changelog

## 🚀 Performance Optimizations & Rendering
- **Frustum Culling**: Implemented strict frustum culling to prevent rendering of objects outside the camera viewport.
- **View Radius Reduction**: Reduced active chunk loading radius from 12 to 5 to significantly lower CPU usage and triangle count.
- **Foliage Optimization**: Dramatically reduced foliage density spawning probabilities in `Procedural.ts` to improve FPS.
- **Shadow Culling**: Disabled directional light shadows when zoomed out to save GPU resources.
- **Day/Night Cycle**: Enhanced day/night cycle visuals and performance.

## 🛠 Features & Systems
- **Era System**: Era progression logic is now active. Advancing eras unlocks new buildings and technologies based on population, eco-score, and resource milestones.
- **Research System**: Implemented functional research logic. Clicking technologies in the Tech Tree now validates costs, prerequisites, and instantly unlocks the tech with audio feedback.
- **Operations Sidebar**: Fixed critical bugs in the Ops Drawer where "Crew" and "Tech" tabs were unresponsive. Refactored `TabButton` for stability.
- **HUD Fixes**: Repaired corrupted Tailwind CSS classes in `Controls.tsx` effectively restoring the bottom control bar's styling.

## 🐛 Bug Fixes
- **Infinite Foliage**: Fixed an issue where foliage would spawn infinitely or incorrectly due to loose worker logic.
- **UI Interaction**: Resolved duplicate identifier errors in `OpsDrawer.tsx`.
- **Tutorial**: Updated tutorial text and flow in `Modals.tsx`.

## 📦 General
- **Game Flow**: Enforced Normal Mode (Cheats Disabled).
- **Balance**: Removed Eagle start unit. Set starting AGT to 5000.
