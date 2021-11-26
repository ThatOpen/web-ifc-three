import {BufferGeometry, Material, Mesh, Object3D} from 'three';
import {HighlightConfigOfModel, IfcState} from '../BaseDefinitions';
import {BvhManager} from './BvhManager';

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

    private tempIndex: number[] = [];

    constructor(state: IfcState, BVH: BvhManager) {
        this.state = state;
        this.BVH = BVH;
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

            // If the subset has orginial materials, initialize the groups for the subset
            if (!config.material) {
                subsetGeom.groups = JSON.parse(JSON.stringify(model.geometry.groups));
                subsetGeom.groups.forEach((group) => {
                    group.start = 0;
                    group.count = 0;
                })
            }

            const mesh = new Mesh(subsetGeom, config.material || model.material);
            mesh.position.x = 9;
            this.subsets[subsetID] = {ids: new Set<number>(), mesh};
            model.add(mesh);
        }

        const items = this.itemsMap[config.modelID];
        const mesh = this.subsets[subsetID].mesh;
        const geometry = mesh.geometry;

        // Remove previous indices or filter the given ones to avoid repeating items
        if (config.removePrevious) {
            mesh.geometry.setIndex([]);
            geometry.groups.forEach((group) => {
                group.start = 0;
                group.count = 0;
            })
        } else if (mesh.geometry.index) {
            const previousIndices = mesh.geometry.index.array;
            const previousIDs = this.subsets[subsetID].ids;
            config.ids = config.ids.filter(id => !previousIDs.has(id));
            this.tempIndex = Array.from(previousIndices);
        }

        let totalAmountOfNewIndices = 0;

        // For each material
        for (let i = 0; i < model.geometry.groups.length; i++) {

            const indicesByGroup: number[] = [];

            // Gets all indices of current material

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

                    for (let j = start; j <= end; j++) {
                        indicesByGroup.push(items.indexCache[j]);
                    }
                }
            }

            // If this subset has original materials, insert indices in correct position and update groups
            if (!config.material) {
                const currentGroup = geometry.groups[i];
                currentGroup.start += totalAmountOfNewIndices;
                let newIndicesPosition = currentGroup.start + currentGroup.count;
                totalAmountOfNewIndices += indicesByGroup.length;

                if (indicesByGroup.length > 0) {
                    // @ts-ignore
                    this.tempIndex.splice.apply(this.tempIndex, [newIndicesPosition, 0].concat(indicesByGroup));
                    currentGroup.count += indicesByGroup.length;
                }
            } else {
                // Otherwise, just insert indices at any position
                indicesByGroup.forEach(index => this.tempIndex.push(index));
            }
        }

        config.ids.forEach(id => this.subsets[subsetID].ids.add(id));
        geometry.setIndex(this.tempIndex);
        this.tempIndex.length = 0;
        return mesh;
    }

    removeFromSubset(modelID: number, ids: number[], customID?: string, material?: Material) {
        const subsetID = this.getSubsetID(modelID, material, customID);
        if(!this.subsets[subsetID]) return;
        const model = this.state.models[modelID].mesh;
        const items = this.itemsMap[modelID];
        const subset = this.subsets[subsetID];
        const mesh = subset.mesh;
        const geometry = mesh.geometry;
        if(!geometry.index) throw new Error("The subset is not indexed");

        // Only ids contained in the subset can be subtracted
        ids = ids.filter(id => subset.ids.has(id));
        if(ids.length === 0) return;

        let totalAmountOfRemovedIndices = 0;
        let previousIndices = Array.from(geometry.index.array).toString();
        // console.log(previousIndices);

        // For each material
        for (let i = 0; i < model.geometry.groups.length; i++) {

            let indicesByGroup: number[][] = [];

            // Gets all indices of current material

            for (const expressID of ids) {
                const entry = items.map.get(expressID);

                if (!entry) continue;

                const value = entry[i];
                if (!value) continue;

                const pairs = value.length / 2;
                for (let pair = 0; pair < pairs; pair++) {

                    const pairIndex = pair * 2;
                    const start = value[pairIndex];
                    const end = value[pairIndex + 1];

                    for (let j = start; j <= end; j++) {
                        if(!indicesByGroup[i]) indicesByGroup[i] = [];
                        indicesByGroup[i].push(items.indexCache[j]);
                    }
                }
            }

            const indicesStringByGroup = indicesByGroup.map(indices => indices.toString());
            // console.log(indicesStringByGroup);
            indicesStringByGroup.forEach(indices => {
               if(previousIndices.includes(indices)) previousIndices = previousIndices.replace(indices, '');
            });

            // Clean up result
            const commaAtStart = /^,/;
            const commaAtEnd = /,$/;
            if(commaAtStart.test(previousIndices)) previousIndices = previousIndices.replace(commaAtStart, '');
            if(commaAtEnd.test(previousIndices)) previousIndices = previousIndices.replace(commaAtEnd, '');
            if(previousIndices.includes(",,")) previousIndices = previousIndices.replace(",,", ',');

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
        if(previousIndices.length === 0){
            parsedIndices = [];
        } else {
            parsedIndices = previousIndices.split(',').map(string => parseInt(string, 10));
        }
        geometry.setIndex(parsedIndices);
        ids.forEach(id => {
            if (subset.ids.has(id)) subset.ids.delete(id);
        })
        console.log(geometry.index);
        console.log(geometry.groups);
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
                    break;
                }

                // Still going through the same object
                if (prevExpressID === expressID) continue;

                // New object starts; save previous object

                // Store previous object
                const store = this.getMaterialStore(items.map, prevExpressID, materialIndex);
                objectEnd = i - 1;
                store.push(objectStart, objectEnd);

                // Get ready to process next object
                prevExpressID = expressID;
                objectStart = i;
            }
        }
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
