import { IfcState } from '../../BaseDefinitions';
import { BufferAttribute, BufferGeometry, Material } from 'three';

// The number array has the meaning: [start, end, start, end, start, end...]
export interface Indices {
    [materialID: number]: number[]
}

export interface IndexedGeometry extends BufferGeometry {
    index: BufferAttribute;
}

export interface Group {
    start: number,
    count: number,
    materialIndex?: number
}

export interface Items {
    indexCache: Uint32Array,
    map: Map<number, Indices>
}

export interface IndicesMap {
    [modelID: number]: {
        indexCache: Uint32Array;
        map: Map<number, Indices>;
    }
}

export class ItemsMap {

    constructor(private state: IfcState) {
    }

    map: IndicesMap = {};

    generateGeometryIndexMap(modelID: number) {
        if (this.map[modelID]) return;
        const geometry = this.getGeometry(modelID);
        const items = this.newItemsMap(modelID, geometry);
        for (const group of geometry.groups) {
            this.fillItemsWithGroupInfo(group, geometry, items);
        }
    }

    getSubsetID(modelID: number, material?: Material, customID = 'DEFAULT') {
        const baseID = modelID;
        const materialID = material ? material.uuid : 'DEFAULT';
        return `${baseID} - ${materialID} - ${customID}`;
    }

    // Use this only for destroying the current IFCLoader instance
    dispose() {
        Object.values(this.map).forEach(model => {
            (model.indexCache as any) = null;
            (model.map as any) = null;
        });

        (this.map as any) = null;
    }

    private getGeometry(modelID: number) {
        const geometry = this.state.models[modelID].mesh.geometry;
        if (!geometry) throw new Error('Model without geometry.');
        if (!geometry.index) throw new Error('Geometry must be indexed');
        return geometry as IndexedGeometry;
    }

    private newItemsMap(modelID: number, geometry: IndexedGeometry) {
        const startIndices = geometry.index.array as Uint32Array;
        this.map[modelID] = {
            indexCache: startIndices.slice(0, geometry.index.array.length),
            map: new Map()
        };
        return this.map[modelID] as Items;
    }

    private fillItemsWithGroupInfo(group: Group, geometry: IndexedGeometry, items: Items) {
        let prevExpressID = -1;

        const materialIndex = group.materialIndex as number;
        const materialStart = group.start;
        const materialEnd = materialStart + group.count - 1;

        let objectStart = -1;
        let objectEnd = -1;

        for (let i = materialStart; i <= materialEnd; i++) {
            const index = geometry.index.array[i];
            const bufferAttr = geometry.attributes.expressID as BufferAttribute;
            const expressID = bufferAttr.array[index];

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