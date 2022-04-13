import { Material, Mesh, Object3D } from 'three';
import { SubsetConfig, IfcState } from '../../BaseDefinitions';
import { BvhManager } from '../BvhManager';
import { ItemsMap } from './ItemsMap';
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
    readonly items: ItemsMap;
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

    getAllSubsets(){
        return this.subsets
    }

    getSubset(modelID: number, material?: Material, customId?: string) {
        const subsetID = this.getSubsetID(modelID, material, customId);
        return this.subsets[subsetID].mesh;
    }

    removeSubset(modelID: number, material?: Material, customID?: string) {
        const subsetID = this.getSubsetID(modelID, material, customID);
        const subset = this.subsets[subsetID];
        if (!subset) return;
        if (subset.mesh.parent) subset.mesh.removeFromParent();
        subset.mesh.geometry.attributes = {};
        subset.mesh.geometry.index = null;
        subset.mesh.geometry.dispose();
        // @ts-ignore
        subset.mesh.geometry = null;
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

    clearSubset(modelID: number, customID?: string, material?: Material) {
        const subsetID = this.getSubsetID(modelID, material, customID);
        if (!this.subsets[subsetID]) return;
        this.subsets[subsetID].ids.clear();
        const subset = this.getSubset(modelID, material, customID);
        subset.geometry.setIndex([]);
    }

    // Use this only for destroying the current IFCLoader instance
    dispose() {
        this.items.dispose();
        this.subsetCreator.dispose();

        Object.values(this.subsets).forEach(subset => {
            (subset.ids as any) = null;
            subset.mesh.removeFromParent();
            const mats = subset.mesh.material;
            if(Array.isArray(mats)) mats.forEach(mat => mat.dispose());
            else mats.dispose();
            subset.mesh.geometry.index = null;
            subset.mesh.geometry.dispose();
            const geom = subset.mesh.geometry as any;
            if(geom.disposeBoundsTree) geom.disposeBoundsTree();
            (subset.mesh as any) = null;
        });
        (this.subsets as any) = null;
    }

    private getSubsetID(modelID: number, material?: Material, customID = 'DEFAULT') {
        const baseID = modelID;
        const materialID = material ? material.uuid : 'DEFAULT';
        return `${baseID} - ${materialID} - ${customID}`;
    }
}
