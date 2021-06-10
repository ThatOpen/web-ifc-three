import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { OpaqueShader } from './Shaders';
import { IfcAPI, PlacedGeometry, Color as ifcColor } from 'web-ifc';
import {
    Mesh,
    Color,
    MeshLambertMaterial,
    DoubleSide,
    Matrix4,
    BufferGeometry,
    BufferAttribute,
    Material
} from 'three';
import { GeometriesByMaterial, IfcState, IfcMesh, IdAttr, MapFaceIndexID } from './BaseDefinitions';

export class IFCParser {
    private state: IfcState;
    private currentID: number;
    private indicesIdsMap: MapFaceIndexID;
    private geometryByMaterials: GeometriesByMaterial;

    constructor(state: IfcState) {
        this.geometryByMaterials = {};
        this.currentID = -1;
        this.indicesIdsMap = {};
        this.state = state;
    }

    async parse(buffer: any) {
        if (this.state.api.wasmModule === undefined) await this.state.api.Init();
        this.currentID = this.newIfcModel(buffer);
        return this.loadAllGeometry();
    }

    private newIfcModel(buffer: any) {
        const data = new Uint8Array(buffer);
        const modelID = this.state.api.OpenModel(data);
        this.state.models[modelID] = {
            modelID,
            mesh: {} as IfcMesh,
            items: {}
        };
        return modelID;
    }

    private loadAllGeometry() {
        this.saveAllPlacedGeometriesByMaterial();
        return this.generateAllGeometriesByMaterial();
    }

    private generateAllGeometriesByMaterial() {
        const { materials, geometries } = this.getMaterialsAndGeometries();
        const allGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
        this.storeIdsInVertexAttribute(allGeometry);
        const result = new Mesh(allGeometry, materials) as IfcMesh;
        result.modelID = this.currentID;
        this.state.models[this.currentID].mesh = result;
        this.cleanup();
        return result;
    }

    private cleanup() {
        this.geometryByMaterials = {};
        this.indicesIdsMap = {};
    }

    // private processIndividualGeometries() {
    //     for (let i in this.mapIdItems) {
    //         const item = this.mapIdItems[i];
    //         const components = Object.values(item);
    //         const geoms = components.map((comp) => comp.geom);
    //         const mats = components.map((comp) => comp.mat);
    //         this.state.models[this.currentID].items[i] = {};
    //     }
    // }

    private storeIdsInVertexAttribute(geometry: BufferGeometry) {
        const zeros = new Float32Array(geometry.getAttribute('position').count);
        geometry.setAttribute(IdAttr, new BufferAttribute(zeros, 1));

        const indices = Object.keys(this.indicesIdsMap).map((k) => parseInt(k, 10));
        let current = 0;
        let counter = 0;

        while (counter <= indices[indices.length - 1]) {
            const currentIndex = indices[current];
            this.setFaceAttr(geometry, IdAttr, this.indicesIdsMap[currentIndex], counter);
            counter++;
            if (counter > currentIndex) current++;
        }
    }

    private setFaceAttr(geom: BufferGeometry, attr: string, state: number, index: number) {
        if (!geom.index) return;
        const geoIndex = geom.index.array;
        geom.attributes[attr].setX(geoIndex[3 * index], state);
        geom.attributes[attr].setX(geoIndex[3 * index + 1], state);
        geom.attributes[attr].setX(geoIndex[3 * index + 2], state);
    }

    private getMaterialsAndGeometries() {
        const materials = [];
        const geometries = [];
        let totalFaceCount = 0;

        for (let i in this.geometryByMaterials) {
            materials.push(this.geometryByMaterials[i].material);
            const currentGeometries = this.geometryByMaterials[i].geometry;
            geometries.push(BufferGeometryUtils.mergeBufferGeometries(currentGeometries));

            for (let j in this.geometryByMaterials[i].indices) {
                const globalIndex = parseInt(j, 10) + totalFaceCount;
                const currentIndex = this.geometryByMaterials[i].indices[j];
                this.indicesIdsMap[globalIndex] = currentIndex;
            }

            totalFaceCount += this.geometryByMaterials[i].lastIndex;
        }
        return { materials, geometries };
    }

    private saveAllPlacedGeometriesByMaterial() {
        const flatMeshes = this.state.api.LoadAllGeometry(this.currentID);

        for (let i = 0; i < flatMeshes.size(); i++) {
            const flatMesh = flatMeshes.get(i);
            const productId = flatMesh.expressID;
            const placedGeometries = flatMesh.geometries;

            for (let j = 0; j < placedGeometries.size(); j++) {
                this.savePlacedGeometryByMaterial(placedGeometries.get(j), productId);
            }
        }
    }

    private savePlacedGeometryByMaterial(placedGeometry: PlacedGeometry, id: number) {
        const geometry = this.getBufferGeometry(placedGeometry);
        geometry.computeVertexNormals();
        const matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        this.saveGeometryByMaterial(geometry, placedGeometry, id);
    }

    private getBufferGeometry(placedGeometry: PlacedGeometry) {
        const geometry = this.state.api.GetGeometry(
            this.currentID,
            placedGeometry.geometryExpressID
        );
        const verts = this.state.api.GetVertexArray(
            geometry.GetVertexData(),
            geometry.GetVertexDataSize()
        );
        const indices = this.state.api.GetIndexArray(
            geometry.GetIndexData(),
            geometry.GetIndexDataSize()
        );
        return this.ifcGeometryToBuffer(verts, indices);
    }

    private getMeshMatrix(matrix: number[]) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }

    private ifcGeometryToBuffer(vertexData: any, indexData: any) {
        const geometry = new BufferGeometry();
        const { vertices, normals } = this.extractVertexData(vertexData);
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
    }

    private extractVertexData(vertexData: any) {
        const vertices = [];
        const normals = [];
        let isNormalData = false;

        for (let i = 0; i < vertexData.length; i++) {
            isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
            if ((i + 1) % 3 == 0) isNormalData = !isNormalData;
        }

        return { vertices, normals };
    }

    private saveGeometryByMaterial(geom: BufferGeometry, placedGeom: PlacedGeometry, id: number) {
        if (!geom.index) return;
        const color = placedGeom.color;
        const colorID = `${color.x}${color.y}${color.z}${color.w}`;
        this.createMaterial(colorID, color);
        this.storeIndividualGeometries(id, geom, colorID);
        const currentGeometry = this.geometryByMaterials[colorID];
        currentGeometry.geometry.push(geom);
        currentGeometry.lastIndex += geom.index.count / 3;
        currentGeometry.indices[currentGeometry.lastIndex] = id;
    }

    private storeIndividualGeometries(id: number, newGeometry: BufferGeometry, colorID: string) {
        const material = this.geometryByMaterials[colorID].material;
        const items = this.state.models[this.currentID].items;
        if (!items[id]) items[id] = {};
        const item = items[id];
        if (!item[colorID]) {
            item[colorID] = { geom: newGeometry, mat: material };
            return;
        }
        const geometries = [item[colorID].geom, newGeometry];
        item[colorID].geom = BufferGeometryUtils.mergeBufferGeometries(geometries);
    }

    private createMaterial(colorID: string, color: ifcColor) {
        if (!this.geometryByMaterials[colorID]) {
            const col = new Color(color.x, color.y, color.z);
            const newMaterial = new MeshLambertMaterial({ color: col, side: DoubleSide });
            newMaterial.onBeforeCompile = OpaqueShader;
            newMaterial.transparent = color.w !== 1;
            if (newMaterial.transparent) newMaterial.opacity = color.w;
            this.geometryByMaterials[colorID] = this.newGeometryByMaterial(newMaterial);
        }
    }

    private newGeometryByMaterial(newMaterial: Material) {
        return {
            material: newMaterial,
            geometry: [],
            indices: {},
            lastIndex: 0
        };
    }
}
