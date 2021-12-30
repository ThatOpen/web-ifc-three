//@ts-ignore
import {
  BufferAttribute, BufferGeometry, Color, DoubleSide,
  Matrix4, Mesh, MeshLambertMaterial
} from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Color as ifcColor, FlatMesh, IfcGeometry, IFCOPENINGELEMENT, IFCSPACE, PlacedGeometry } from 'web-ifc';
import { IfcMesh, IfcState } from '../BaseDefinitions';
import { BvhManager } from './BvhManager';
import { IFCModel } from './IFCModel';

export interface ParserProgress {
    loaded: number;
    total: number;
}

export interface OptionalCategories {
    [category: number]: boolean
}

export interface ParserAPI {
    parse(buffer: any, coordinationMatrix?: number[]): Promise<IFCModel>;

    getAndClearErrors(_modelId: number): void;

    setupOptionalCategories(config: OptionalCategories): void;
}

export interface GeometriesByMaterial {
    [materialID: string]: {
        material: MeshLambertMaterial,
        geometries: BufferGeometry[]
    }
}

/**
 * Reads all the geometry of the IFC file and generates an optimized `THREE.Mesh`.
 */
export class IFCParser implements ParserAPI {
    loadedModels = 0;

    optionalCategories: OptionalCategories = {
        [IFCSPACE]: true,
        [IFCOPENINGELEMENT]: false
    };

    private geometriesByMaterials: GeometriesByMaterial = {};

    // Represents the index of the model in webIfcAPI
    private currentWebIfcID = -1;
    // When using JSON data for optimization, webIfcAPI is reinitialized every time a model is loaded
    // This means that currentID is always 0, while currentModelID is the real index of stored models
    private currentModelID = -1;

    // BVH is optional because when using workers we have to apply it in the main thread,
    // once the model has been serialized and reconstructed
    constructor(private state: IfcState, private BVH?: BvhManager) {
    }

    async setupOptionalCategories(config: OptionalCategories) {
        this.optionalCategories = config;
    }

    async parse(buffer: any, coordinationMatrix?: number[]) {
        if (this.state.api.wasmModule === undefined) await this.state.api.Init();
        await this.newIfcModel(buffer);
        this.loadedModels++;
        if (coordinationMatrix) {
            await this.state.api.SetGeometryTransformation(this.currentWebIfcID, coordinationMatrix);
        }
        return this.loadAllGeometry(this.currentWebIfcID);
    }

    getAndClearErrors(_modelId: number) {
        // return this.state.api.GetAndClearErrors(modelId);
    }

    private notifyProgress(loaded: number, total: number) {
        if (this.state.onProgress) this.state.onProgress({ loaded, total });
    }

    private async newIfcModel(buffer: any) {
        const data = new Uint8Array(buffer);
        this.currentWebIfcID = await this.state.api.OpenModel(data, this.state.webIfcSettings);
        this.currentModelID = this.state.useJSON ? this.loadedModels : this.currentWebIfcID;
        this.state.models[this.currentModelID] = {
            modelID: this.currentModelID,
            mesh: {} as IfcMesh,
            types: {},
            jsonData: {}
        };
    }

    private async loadAllGeometry(modelID: number) {

        this.addOptionalCategories(modelID);

        this.state.api.StreamAllMeshes(modelID, (mesh: FlatMesh) => {
            // only during the lifetime of this function call, the geometry is available in memory
            this.streamMesh(modelID, mesh);
        });

        const geometries: BufferGeometry[] = [];
        const materials: MeshLambertMaterial[] = [];

        Object.keys(this.geometriesByMaterials).forEach((key) => {
            const geometriesByMaterial = this.geometriesByMaterials[key].geometries;
            const merged = mergeBufferGeometries(geometriesByMaterial);
            materials.push(this.geometriesByMaterials[key].material);
            geometries.push(merged);
        });

        const combinedGeometry = mergeBufferGeometries(geometries, true);
        this.cleanUpGeometryMemory(geometries);
        if (this.BVH) this.BVH.applyThreeMeshBVH(combinedGeometry);
        const model = new IFCModel(this.currentModelID, combinedGeometry, materials);
        this.state.models[this.currentModelID].mesh = model;
        return model;
    }

    // Some categories (like IfcSpace and IfcOpeningElement) need to be set explicitly
    private addOptionalCategories(modelID: number) {

        const optionalTypes: number[] = [];

        for (let key in this.optionalCategories) {
            if (this.optionalCategories.hasOwnProperty(key)) {
                const category = parseInt(key);
                if (this.optionalCategories[category]) optionalTypes.push(category);
            }
        }

        this.state.api.StreamAllMeshesWithTypes(this.currentWebIfcID, optionalTypes, (mesh: FlatMesh) => {
            this.streamMesh(modelID, mesh);
        });
    }

    private streamMesh(modelID: number, mesh: FlatMesh) {
        const placedGeometries = mesh.geometries;
        const size = placedGeometries.size();

        for (let i = 0; i < size; i++) {
            const placedGeometry = placedGeometries.get(i);
            let itemMesh = this.getPlacedGeometry(modelID, mesh.expressID, placedGeometry);
            let geom = itemMesh.geometry.applyMatrix4(itemMesh.matrix);
            this.storeGeometryByMaterial(placedGeometry.color, geom);
        }
    }

    private getPlacedGeometry(modelID: number, expressID: number, placedGeometry: PlacedGeometry) {
        const geometry = this.getBufferGeometry(modelID, expressID, placedGeometry);
        const mesh = new Mesh(geometry);
        mesh.matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
        mesh.matrixAutoUpdate = false;
        return mesh;
    }

    private getBufferGeometry(modelID: number, expressID: number, placedGeometry: PlacedGeometry) {
        const geometry = this.state.api.GetGeometry(modelID, placedGeometry.geometryExpressID) as IfcGeometry;
        const verts = this.state.api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize()) as Float32Array;
        const indices = this.state.api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize()) as Uint32Array;
        const buffer = this.ifcGeometryToBuffer(expressID, verts, indices);
        //@ts-ignore
        geometry.delete();
        return buffer;
    }

    private storeGeometryByMaterial(color: ifcColor, geometry: BufferGeometry) {
        let colID = `${color.x}${color.y}${color.z}${color.w}`;
        if (this.geometriesByMaterials[colID]) {
            this.geometriesByMaterials[colID].geometries.push(geometry);
            return;
        }

        const col = new Color(color.x, color.y, color.z);
        const material = new MeshLambertMaterial({ color: col, side: DoubleSide });
        material.transparent = color.w !== 1;
        if (material.transparent) material.opacity = color.w;
        this.geometriesByMaterials[colID] = { material, geometries: [geometry] };
    }

    private getMeshMatrix(matrix: Array<number>) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }

    private ifcGeometryToBuffer(expressID: number, vertexData: Float32Array, indexData: Uint32Array) {
        const geometry = new BufferGeometry();

        const posFloats = new Float32Array(vertexData.length / 2);
        const normFloats = new Float32Array(vertexData.length / 2);
        const idAttribute = new Uint32Array(vertexData.length / 6);

        for (let i = 0; i < vertexData.length; i += 6) {
            posFloats[i / 2] = vertexData[i];
            posFloats[i / 2 + 1] = vertexData[i + 1];
            posFloats[i / 2 + 2] = vertexData[i + 2];

            normFloats[i / 2] = vertexData[i + 3];
            normFloats[i / 2 + 1] = vertexData[i + 4];
            normFloats[i / 2 + 2] = vertexData[i + 5];

            idAttribute[i / 6] = expressID;
        }

        geometry.setAttribute(
            'position',
            new BufferAttribute(posFloats, 3));
        geometry.setAttribute(
            'normal',
            new BufferAttribute(normFloats, 3));
        geometry.setAttribute(
            'expressID',
            new BufferAttribute(idAttribute, 1));

        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
    }

    // Three.js geometry has to be manually deallocated
    private cleanUpGeometryMemory(geometries: BufferGeometry[]) {
        geometries.forEach(geometry => geometry.dispose());

        Object.keys(this.geometriesByMaterials).forEach((materialID) => {
            const geometriesByMaterial = this.geometriesByMaterials[materialID];
            geometriesByMaterial.geometries.forEach(geometry => geometry.dispose());
            geometriesByMaterial.geometries = [];
            // @ts-ignore
            geometriesByMaterial.material = null;
        });
        this.geometriesByMaterials = {};
    }
}
