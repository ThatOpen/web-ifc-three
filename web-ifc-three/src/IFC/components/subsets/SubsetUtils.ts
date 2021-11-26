export class SubsetUtils {

    // If flatten, all indices are in the same array; otherwise, indices are split in subarrays by material
    static getAllIndicesOfGroup(modelID: number, ids: number[], materialIndex: number, items: any, flatten = true) {
        const indicesByGroup: any = [];
        for (const expressID of ids) {
            const entry = items.map.get(expressID);
            if (!entry) continue;
            const value = entry[materialIndex];
            if (!value) continue;
            SubsetUtils.getIndexChunk(value, indicesByGroup, materialIndex, items, flatten);
        }
        return indicesByGroup;
    }

    private static getIndexChunk(value: number[], indicesByGroup: any, materialIndex: number, items: any, flatten: boolean) {
        const pairs = value.length / 2;
        for (let pair = 0; pair < pairs; pair++) {
            const pairIndex = pair * 2;
            const start = value[pairIndex];
            const end = value[pairIndex + 1];
            for (let j = start; j <= end; j++) {
                if(flatten) indicesByGroup.push(items.indexCache[j]);
                else {
                    if (!indicesByGroup[materialIndex]) indicesByGroup[materialIndex] = [];
                    indicesByGroup[materialIndex].push(items.indexCache[j]);
                }
            }
        }
    }
}