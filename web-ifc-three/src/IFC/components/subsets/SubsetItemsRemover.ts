import { Material } from 'three';
import { Subsets } from './SubsetManager';
import { IfcState } from '../../BaseDefinitions';
import { ItemsMap } from './ItemsMap';
import { SubsetUtils } from './SubsetUtils';

export class SubsetItemsRemover {

    constructor(private state: IfcState, private items: ItemsMap, private subsets: Subsets) {
    }

    removeFromSubset(modelID: number, ids: number[], subsetID: string, customID?: string, material?: Material) {
        if (!this.subsets[subsetID]) return;
        const model = this.state.models[modelID].mesh;
        const subset = this.subsets[subsetID];
        const mesh = subset.mesh;

        const geometry = mesh.geometry;
        if (!geometry.index) throw new Error('The subset is not indexed');

        // Only ids contained in the subset can be subtracted
        ids = ids.filter(id => subset.ids.has(id));
        if (ids.length === 0) return;

        let totalAmountOfRemovedIndices = 0;
        let previousIndices = Array.from(geometry.index.array).toString();

        // For each material
        for (let i = 0; i < model.geometry.groups.length; i++) {

            const items = this.items.map[modelID];
            const indicesByGroup = SubsetUtils.getAllIndicesOfGroup(modelID, ids, i, items, false) as number[][];

            const indicesStringByGroup = indicesByGroup.map(indices => indices.toString());
            indicesStringByGroup.forEach(indices => {
                if (previousIndices.includes(indices)) previousIndices = previousIndices.replace(indices, '');
            });

            // Clean up result
            const commaAtStart = /^,/;
            const commaAtEnd = /,$/;
            if (commaAtStart.test(previousIndices)) previousIndices = previousIndices.replace(commaAtStart, '');
            if (commaAtEnd.test(previousIndices)) previousIndices = previousIndices.replace(commaAtEnd, '');
            if (previousIndices.includes(',,')) previousIndices = previousIndices.replace(',,', ',');

            // If this subset has original materials, insert indices in correct position and update groups
            if (!material) {
                const currentGroup = geometry.groups[i];
                currentGroup.start -= totalAmountOfRemovedIndices;

                let removedIndicesAmount = 0;
                indicesByGroup.forEach(indices => removedIndicesAmount += indices.length);
                currentGroup.count -= removedIndicesAmount;
                totalAmountOfRemovedIndices += removedIndicesAmount;
            }
        }

        let parsedIndices: number[];
        if (previousIndices.length === 0) {
            parsedIndices = [];
        } else {
            parsedIndices = previousIndices.split(',').map(string => parseInt(string, 10));
        }
        geometry.setIndex(parsedIndices);
        ids.forEach(id => {
            if (subset.ids.has(id)) subset.ids.delete(id);
        });
    }
}