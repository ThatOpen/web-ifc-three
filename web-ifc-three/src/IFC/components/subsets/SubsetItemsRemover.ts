import {Material} from 'three';
import {Subsets} from './SubsetManager';
import {IfcState} from '../../BaseDefinitions';
import {IndexedGeometry, ItemsMap} from './ItemsMap';
import {SubsetUtils} from './SubsetUtils';

export class SubsetItemsRemover {

    constructor(private state: IfcState, private items: ItemsMap, private subsets: Subsets) {
    }

    removeFromSubset(modelID: number, ids: number[], subsetID: string, customID?: string, material?: Material) {
        if (!this.subsets[subsetID]) return;
        ids = this.filterIndices(subsetID, ids);
        if (ids.length === 0) return;
        const geometry = this.getGeometry(subsetID);
        let previous = { indices: Array.from(geometry.index.array).toString() };
        this.subtractIndicesByMaterial(modelID, subsetID, ids, previous, material != undefined);
        this.updateIndices(subsetID, previous);
        this.updateIDs(subsetID, ids);
    }

    private getGeometry(subsetID: string) {
        const geometry = this.subsets[subsetID].mesh.geometry;
        if (!geometry.index) throw new Error('The subset is not indexed');
        return geometry as IndexedGeometry;
    }

    // Only ids contained in the subset can be subtracted
    private filterIndices(subsetID: string, ids: number[]) {
        const previousIDs = this.subsets[subsetID].ids;
        return ids.filter(id => previousIDs.has(id));
    }

    private subtractIndicesByMaterial(modelID: number, subsetID: string, ids: number[], previous: any, material: boolean) {
        let removedIndices = {amount: 0};
        const model = this.state.models[modelID].mesh;
        for (let i = 0; i < model.geometry.groups.length; i++) {
            const items = this.items.map[modelID];
            const indicesByGroup = SubsetUtils.getAllIndicesOfGroup(modelID, ids, i, items, false) as number[][];
            this.removeIndices(indicesByGroup, previous);
            this.cleanUpResult(previous);
            if (!material) this.updateGroups(subsetID, i, removedIndices, indicesByGroup);
        }
    }

    private removeIndices(indicesByGroup: number[][], previous: any) {
        const indicesStringByGroup = indicesByGroup.map(indices => indices.toString());
        indicesStringByGroup.forEach(indices => {
            if (previous.indices.includes(indices)) previous.indices = previous.indices.replace(indices, '');
        });
    }

    // If result string doesn't have correct format, adjust it (eg. double commas)
    private cleanUpResult(previous: any) {
        const commaAtStart = /^,/;
        const commaAtEnd = /,$/;
        if (commaAtStart.test(previous.indices)) previous.indices = previous.indices.replace(commaAtStart, '');
        if (commaAtEnd.test(previous.indices)) previous.indices = previous.indices.replace(commaAtEnd, '');
        if (previous.indices.includes(',,')) previous.indices = previous.indices.replace(',,', ',');
    }

    // If this subset has original materials, insert indices in correct position and update groups
    private updateGroups(subsetID: string, index: number, removedIndices: any, indicesByGroup: number[][]) {
        const geometry = this.getGeometry(subsetID);
        const currentGroup = geometry.groups[index];
        currentGroup.start -= removedIndices.amount;
        let removedIndicesAmount = 0;
        indicesByGroup.forEach(indices => removedIndicesAmount += indices.length);
        currentGroup.count -= removedIndicesAmount;
        removedIndices.amount += removedIndicesAmount;
    }

    private updateIndices(subsetID: string, previous: any) {
        const geometry = this.getGeometry(subsetID);
        const noIndicesFound = previous.indices.length === 0;
        let parsedIndices = noIndicesFound ? [] : this.parseIndices(previous);
        geometry.setIndex(parsedIndices);
    }

    private updateIDs(subsetID: string, ids: number[]) {
        const subset = this.subsets[subsetID];
        ids.forEach(id => {
            if (subset.ids.has(id)) subset.ids.delete(id);
        });
    }

    private parseIndices(previous: any) {
        return previous.indices.split(',').map((text: string) => parseInt(text, 10));
    }
}