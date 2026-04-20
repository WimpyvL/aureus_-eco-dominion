export function confirmMobilePlacement(
    placeBuilding: (index: number) => boolean,
    clearPinnedBuilding: () => void,
    index: number
): boolean {
    const placed = placeBuilding(index);
    if (placed) {
        clearPinnedBuilding();
    }
    return placed;
}
