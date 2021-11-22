import { BufferGeometry, Material, Mesh, Object3D } from 'three';
import { HighlightConfigOfModel, IfcState } from '../BaseDefinitions';
import { BvhManager } from './BvhManager';

// The number array has the meaning: [start, end, start, end, start, end...]
export interface Indices {
    [materialID: number]: number[]
}

export type Subsets = {
    [subsetID: string]: { ids: Set<number>; mesh: Mesh };
};

export interface ItemsMap {
    [modelID: number]: {
        indexCache: Uint32Array;
        map: Map<number, Indices>;
    }
}

export interface ExpressIDMap {
    [modelID: number]: Map<number, number>
}

/**
 * Contains the logic to get, create and delete geometric subsets of an IFC model. For example,
 * this can extract all the items in a specific IfcBuildingStorey and create a new Mesh.
 */
export class SubsetManager {
    private state: IfcState;
    private BVH: BvhManager;

    private subsets: Subsets = {};
    private itemsMap: ItemsMap = {};
    private expressIDMap: ExpressIDMap = {};

    private tempIndex: number[] = [];

    constructor(state: IfcState, BVH: BvhManager) {
        this.state = state;
        this.BVH = BVH;
    }

    getExpressID(modelID: number, _index: number) {
        if (!this.itemsMap[modelID]) this.generateGeometryIndexMap(modelID);
        const map = this.itemsMap[modelID];
        return 0;
    }

    getSubset(modelID: number, material?: Material, customId?: string) {
        const subsetID = this.getSubsetID(modelID, material, customId);
        return this.subsets[subsetID].mesh;
    }

    removeSubset(modelID: number, parent?: Object3D, material?: Material, customId?: string) {
        const subsetID = this.getSubsetID(modelID, material, customId);
        const subset = this.subsets[subsetID];
        if (!subset) throw new Error('The subset to delete does not exist.');
        subset.mesh.geometry.dispose();
        if (material) material.dispose();
        delete this.subsets[subsetID];
    }

    createSubset(config: HighlightConfigOfModel) {
        if (config.removePrevious) {
            this.tempIndex.length = 0;
        }

        if (!this.itemsMap[config.modelID]) this.generateGeometryIndexMap(config.modelID);
        const model = this.state.models[config.modelID].mesh;
        const subsetID = this.getSubsetID(config.modelID, config.material, config.customID);

        // If it's the first time, create the mesh and the geometry
        if (!this.subsets[subsetID]) {
            const subsetGeom = new BufferGeometry();
            // The subset shares the same attributes as the original (no memory consumed)
            subsetGeom.setAttribute('position', model.geometry.attributes.position);
            subsetGeom.setAttribute('normal', model.geometry.attributes.normal);
            subsetGeom.setAttribute('expressID', model.geometry.attributes.expressID);
            const mesh = new Mesh(subsetGeom, config.material || model.material);
            this.subsets[subsetID] = { ids: new Set<number>(), mesh };
            model.add(mesh);
        }

        const items = this.itemsMap[config.modelID];
        const geometry = this.subsets[subsetID].mesh.geometry;

        for (let i = 0; i < model.geometry.groups.length; i++) {

            const start = this.tempIndex.length;

            for (const expressID of config.ids) {
                const entry = items.map.get(expressID);

                if (!entry) continue;

                const value = entry[i];
                if (!value) continue;

                const pairs = value.length / 2;
                for (let pair = 0; pair < pairs; pair++) {

                    const pairIndex = pair * 2;
                    const start = value[pairIndex];
                    const end = value[pairIndex + 1];

                    for (let i = start; i <= end; i++) {
                        this.tempIndex.push(items.indexCache[i]);
                    }
                }
            }

            if (!config.material) {
                const count = this.tempIndex.length - start;
                geometry.addGroup(start, count, i);
            }
        }

        geometry.setIndex(this.tempIndex);
        return this.subsets[subsetID].mesh;
    }

    generateGeometryIndexMap(modelID: number) {
        if (this.itemsMap[modelID]) return;

        const geometry = this.state.models[modelID].mesh.geometry;
        if (!geometry) throw new Error('Model without geometry.');
        if (!geometry.index) throw new Error('Geometry must be indexed');
        const startIndices = geometry.index.array as Uint32Array;

        this.itemsMap[modelID] = {
            indexCache: startIndices.slice(0, geometry.index.array.length),
            map: new Map()
        };

        const items = this.itemsMap[modelID];

        this.expressIDMap[modelID] = new Map<number, number>();
        const idsMap = this.expressIDMap[modelID];

        for (const group of geometry.groups) {

            let prevExpressID = -1;

            const materialIndex = group.materialIndex as number;
            const materialStart = group.start;
            const materialEnd = materialStart + group.count - 1;

            let objectStart = -1;
            let objectEnd = -1;

            for (let i = materialStart; i <= materialEnd; i++) {
                const index = geometry.index.array[i];
                const expressID = geometry.attributes.expressID.array[index];

                // First iteration
                if (prevExpressID === -1) {
                    prevExpressID = expressID;
                    objectStart = i;
                }

                // It's the end of the material, which also means end of the object
                const isEndOfMaterial = i === materialEnd;
                if (isEndOfMaterial) {
                    const store = this.getMaterialStore(items.map, expressID, materialIndex);
                    store.push(objectStart, materialEnd);
                    idsMap.set(materialEnd, expressID);
                    break;
                }

                // Still going through the same object
                if (prevExpressID === expressID) continue;

                // New object starts; save previous object

                // Store previous object
                const store = this.getMaterialStore(items.map, prevExpressID, materialIndex);
                objectEnd = i - 1;
                store.push(objectStart, objectEnd);
                idsMap.set(objectEnd, expressID);

                // Get ready to process next object
                prevExpressID = expressID;
                objectStart = i;
            }
        }

        console.log(this.expressIDMap);
    }

    private getSubsetID(modelID: number, material?: Material, customID = 'DEFAULT') {
        const baseID = modelID;
        const materialID = material ? material.uuid : 'DEFAULT';
        return `${baseID} - ${materialID} - ${customID}`;
    }

    private getMaterialStore(map: Map<number, Indices>, id: number, matIndex: number) {
        // If this object wasn't store before, add it to the map
        if (map.get(id) === undefined) {
            map.set(id, {});
        }
        const storedIfcItem = map.get(id);
        if (storedIfcItem === undefined) throw new Error('Geometry map generation error');

        // If this material wasn't stored for this object before, add it to the object
        if (storedIfcItem[matIndex] === undefined) {
            storedIfcItem[matIndex] = [];
        }
        return storedIfcItem[matIndex];
    }
}
