import { Material, Mesh, Object3D } from 'three';
import { SubsetConfig, IfcState } from '../../BaseDefinitions';
import { BvhManager } from '../BvhManager';
import { ItemsMap } from './ItemsMap';
import { SubsetCreator } from './SubsetCreator';
import { SubsetItemsRemover } from './SubsetItemsRemover';

export type Subsets = {
    [subsetID: string]: { ids: Set<number>; mesh: Mesh };
};

/**
 * Contains the logic to get, create and delete geometric subsets of an IFC model. For example,
 * this can extract all the items in a specific IfcBuildingStorey and create a new Mesh.
 */
export class SubsetManager {
    private readonly items: ItemsMap;
    private state: IfcState;
    private BVH: BvhManager;
    private subsets: Subsets = {};
    private subsetCreator: SubsetCreator;
    private subsetItemsRemover: SubsetItemsRemover;

    constructor(state: IfcState, BVH: BvhManager) {
        this.state = state;
        this.items = new ItemsMap(state);
        this.BVH = BVH;
        this.subsetCreator = new SubsetCreator(state, this.items, this.subsets);
        this.subsetItemsRemover = new SubsetItemsRemover(state, this.items, this.subsets);
    }

    getSubset(modelID: number, material?: Material, customId?: string) {
        const subsetID = this.getSubsetID(modelID, material, customId);
        return this.subsets[subsetID].mesh;
    }

    removeSubset(modelID: number, parent?: Object3D, material?: Material, customId?: string) {
        const subsetID = this.getSubsetID(modelID, material, customId);
        const subset = this.subsets[subsetID];
        if (!subset) return;
        subset.mesh.geometry.dispose();
        if(subset.mesh.parent) subset.mesh.removeFromParent();
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
        this.subsetItemsRemover.removeFromSubset(modelID, ids, subsetID, customID, material);
    }

    private getSubsetID(modelID: number, material?: Material, customID = 'DEFAULT') {
        const baseID = modelID;
        const materialID = material ? material.uuid : 'DEFAULT';
        return `${baseID} - ${materialID} - ${customID}`;
    }
}
