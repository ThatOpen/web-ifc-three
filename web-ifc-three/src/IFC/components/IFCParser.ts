//@ts-ignore
import { PlacedGeometry, Color as ifcColor, IfcGeometry, IFCSPACE, FlatMesh, IFCOPENINGELEMENT } from 'web-ifc';
import {
    IfcState,
    IfcMesh,
    IdAttrName,
    merge,
    newFloatAttr,
    newIntAttr, MaterialIndices
} from '../BaseDefinitions';
import {
    Color,
    MeshLambertMaterial,
    DoubleSide,
    Matrix4,
    BufferGeometry,
    BufferAttribute,
    Material
} from 'three';
import {BvhManager} from './BvhManager';
import {IFCModel} from './IFCModel';
import {createGeomByExpressID, generateGeometryIndexMap} from "./GeometryIndexTest";

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

/**
 * Reads all the geometry of the IFC file and generates an optimized `THREE.Mesh`.
 */
export class IFCParser implements ParserAPI {
    loadedModels = 0;

    optionalCategories: OptionalCategories = {
        [IFCSPACE]: true,
        [IFCOPENINGELEMENT]: false
    }

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
        if(coordinationMatrix){
            await this.state.api.SetGeometryTransformation(this.currentWebIfcID, coordinationMatrix);
        }
        return this.loadAllGeometry();
    }

    getAndClearErrors(_modelId: number) {
        // return this.state.api.GetAndClearErrors(modelId);
    }

    private notifyProgress(loaded: number, total: number) {
        if (this.state.onProgress) this.state.onProgress({loaded, total});
    }

    private async newIfcModel(buffer: any) {
        const data = new Uint8Array(buffer);
        this.currentWebIfcID = await this.state.api.OpenModel(data, this.state.webIfcSettings);
        this.currentModelID = this.state.useJSON ? this.loadedModels : this.currentWebIfcID;
        this.state.models[this.currentModelID] = {
            modelID: this.currentModelID,
            mesh: {} as IfcMesh,
            items: {},
            map: new Map<number, MaterialIndices>(),
            types: {},
            jsonData: {}
        };
    }

    private async loadAllGeometry() {
        await this.saveAllPlacedGeometriesByMaterial();
        return this.generateAllGeometriesByMaterial();
    }

    private generateAllGeometriesByMaterial() {
        const { geometry, materials } = this.getGeometryAndMaterials();
        if(this.BVH) this.BVH.applyThreeMeshBVH(geometry);
        const mesh = new IFCModel(geometry, materials);
        mesh.modelID = this.currentModelID;
        this.state.models[this.currentModelID].mesh = mesh;
        return mesh;
    }

    private getGeometryAndMaterials() {
        const items = this.state.models[this.currentModelID].items;
        const mergedByMaterial: BufferGeometry[] = [];
        const materials: Material[] = [];
        for (let materialID in items) {
            if (items.hasOwnProperty(materialID)) {
                materials.push(items[materialID].material);
                const geometries = Object.values(items[materialID].geometries);
                mergedByMaterial.push(merge(geometries));
            }
        }
        const geometry = merge(mergedByMaterial, true);
        return {geometry, materials};
    }

    private async saveAllPlacedGeometriesByMaterial() {

        await this.addOptionalCategories();

        const flatMeshes = await this.state.api.LoadAllGeometry(this.currentWebIfcID);
        const size = flatMeshes.size();
        let counter = 0;
        for (let i = 0; i < size; i++) {
            if(i > counter) {
                this.notifyProgress(i, size);
                counter += Math.trunc(size / 10);
            }
            const flatMesh = flatMeshes.get(i);
            const placedGeom = flatMesh.geometries;
            for (let j = 0; j < placedGeom.size(); j++) {
                await this.savePlacedGeometry(placedGeom.get(j), flatMesh.expressID);
            }
        }
    }

    // Temporary: in the future everything will use StreamAllMeshes()
    private async addOptionalCategories() {

        const optionalTypes: number[] =[];

        for(let key in this.optionalCategories) {
            if(this.optionalCategories.hasOwnProperty(key)) {
                const category = parseInt(key);
                if(this.optionalCategories[category]) optionalTypes.push(category);
            }
        }

        await this.state.api.StreamAllMeshesWithTypes(this.currentWebIfcID, optionalTypes, async (mesh: FlatMesh) => {
            const geometries = mesh.geometries;
            const size = geometries.size();
            for (let j = 0; j < size; j++) {
                await this.savePlacedGeometry(geometries.get(j), mesh.expressID);
            }
        });
    }

    private async savePlacedGeometry(placedGeometry: PlacedGeometry, id: number) {
        const geometry = await this.getGeometry(placedGeometry);
        this.saveGeometryByMaterial(geometry, placedGeometry, id);
    }

    private async getGeometry(placedGeometry: PlacedGeometry) {
        const geometry = await this.getBufferGeometry(placedGeometry);
        geometry.computeVertexNormals();
        const matrix = IFCParser.getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        return geometry;
    }

    private async getBufferGeometry(placed: PlacedGeometry) {
        const geometry = await this.state.api.GetGeometry(this.currentWebIfcID, placed.geometryExpressID);
        const vertexData = await this.getVertices(geometry);
        const indices = await this.getIndices(geometry);
        const {vertices, normals} = IFCParser.extractVertexData(vertexData);
        return IFCParser.ifcGeomToBufferGeom(vertices, normals, indices);
    }

    private async getVertices(geometry: IfcGeometry) {
        const vData = geometry.GetVertexData();
        const vDataSize = geometry.GetVertexDataSize();
        return this.state.api.GetVertexArray(vData, vDataSize);
    }

    private async getIndices(geometry: IfcGeometry) {
        const iData = geometry.GetIndexData();
        const iDataSize = geometry.GetIndexDataSize();
        return this.state.api.GetIndexArray(iData, iDataSize);
    }

    private static getMeshMatrix(matrix: number[]) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }

    private static ifcGeomToBufferGeom(vertices: any[], normals: any[], indexData: any) {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', newFloatAttr(vertices, 3));
        geometry.setAttribute('normal', newFloatAttr(normals, 3));
        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
    }

    private static extractVertexData(vertexData: any) {
        const vertices = [];
        const normals = [];
        let isNormalData = false;
        for (let i = 0; i < vertexData.length; i++) {
            isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
            if ((i + 1) % 3 == 0) isNormalData = !isNormalData;
        }
        return {vertices, normals};
    }

    private saveGeometryByMaterial(geom: BufferGeometry, placedGeom: PlacedGeometry, id: number) {
        const color = placedGeom.color;
        const colorID = `${color.x}${color.y}${color.z}${color.w}`;
        IFCParser.storeGeometryAttribute(id, geom);
        this.createMaterial(colorID, color);
        const item = this.state.models[this.currentModelID].items[colorID];
        const currentGeom = item.geometries[id];
        if (!currentGeom) return (item.geometries[id] = geom);
        item.geometries[id] = merge([currentGeom, geom]);
    }

    private static storeGeometryAttribute(id: number, geometry: BufferGeometry) {
        const size = geometry.attributes.position.count;
        const idAttribute = new Array(size).fill(id);
        geometry.setAttribute(IdAttrName, newIntAttr(idAttribute, 1));
    }

    private createMaterial(colorID: string, color: ifcColor) {
        const items = this.state.models[this.currentModelID].items;
        if (items[colorID]) return;
        const col = new Color(color.x, color.y, color.z);
        const newMaterial = new MeshLambertMaterial({color: col, side: DoubleSide});
        newMaterial.transparent = color.w !== 1;
        if (newMaterial.transparent) newMaterial.opacity = color.w;
        items[colorID] = {material: newMaterial, geometries: {}};
    }
}
