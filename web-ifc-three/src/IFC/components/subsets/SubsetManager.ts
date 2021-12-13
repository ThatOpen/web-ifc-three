import { Material, Mesh, Object3D } from 'three';
import { SubsetConfig, IfcState } from '../../BaseDefinitions';
import { BvhManager } from '../BvhManager';
import { IndexedGeometry, ItemsMap } from './ItemsMap';
import { SubsetCreator } from './SubsetCreator';

export interface Subset extends Mesh {
    modelID: number;
}

export type Subsets = {
    [subsetID: string]: { ids: Set<number>, mesh: Subset, bvh: boolean };
};

/**
 * Contains the logic to get, create and delete geometric subsets of an IFC model. For example,
 * this can extract all the items in a specific IfcBuildingStorey and create a new Mesh.
 */
export class SubsetManager {
    private readonly items: ItemsMap;
    private readonly BVH: BvhManager;
    private state: IfcState;
    private subsets: Subsets = {};
    private subsetCreator: SubsetCreator;

    constructor(state: IfcState, BVH: BvhManager) {
        this.state = state;
        this.items = new ItemsMap(state);
        this.BVH = BVH;
        this.subsetCreator = new SubsetCreator(state, this.items, this.subsets, this.BVH);
    }

    getSubset(modelID: number, material?: Material, customId?: string) {
        const subsetID = this.getSubsetID(modelID, material, customId);
        return this.subsets[subsetID].mesh;
    }

    removeSubset(modelID: number, material?: Material, customID?: string) {
        const subsetID = this.getSubsetID(modelID, material, customID);
        const subset = this.subsets[subsetID];
        if (!subset) return;
        subset.mesh.geometry.dispose();
        if (subset.mesh.parent) subset.mesh.removeFromParent();
        // @ts-ignore
        subset.mesh.geometry = null;
        if (material) material.dispose();
        delete this.subsets[subsetID];
    }

    createSubset(config: SubsetConfig) {
        const subsetID = this.getSubsetID(config.modelID, config.material, config.customID);
        return this.subsetCreator.createSubset(config, subsetID);
    }

    removeFromSubset(modelID: number, ids: number[], customID?: string, material?: Material) {
        const subsetID = this.getSubsetID(modelID, material, customID);
        if (!this.subsets[subsetID]) return;

        const previousIDs = this.subsets[subsetID].ids;
        ids.forEach((id) => {
            if(previousIDs.has(id)) previousIDs.delete(id);
        })

        return this.createSubset({
            modelID,
            removePrevious: true,
            material,
            customID,
            applyBVH: this.subsets[subsetID].bvh,
            ids: Array.from(previousIDs),
            scene: this.subsets[subsetID].mesh.parent as Object3D
        });
    }


    private getSubsetID(modelID: number, material?: Material, customID = 'DEFAULT') {
        const baseID = modelID;
        const materialID = material ? material.uuid : 'DEFAULT';
        return `${baseID} - ${materialID} - ${customID}`;
    }
}
