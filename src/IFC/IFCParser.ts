//@ts-ignore
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { PlacedGeometry, Color as ifcColor, IfcGeometry } from 'web-ifc';
import {
    IfcState,
    IfcMesh,
    IdAttrName,
    merge,
    newFloatAttr,
    newIntAttr,
    IdAttributesByMaterials
} from './BaseDefinitions';
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

export class IFCParser {
    private state: IfcState;
    private currentID: number;
    private idAttr: IdAttributesByMaterials;

    constructor(state: IfcState) {
        this.currentID = -1;
        this.idAttr = {};
        this.state = state;
        this.setupThreeMeshBVH();
    }

    async parse(buffer: any) {
        if (this.state.api.wasmModule === undefined) await this.state.api.Init();
        this.currentID = this.newIfcModel(buffer);
        return this.loadAllGeometry();
    }

    private setupThreeMeshBVH() {
        //@ts-ignore
        BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
        //@ts-ignore
        BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
        Mesh.prototype.raycast = acceleratedRaycast;
    }

    private applyThreeMeshBVH(geometry: BufferGeometry) {
        //@ts-ignore
        geometry.computeBoundsTree();
    }

    private newIfcModel(buffer: any) {
        const data = new Uint8Array(buffer);
        const modelID = this.state.api.OpenModel(data);
        this.state.models[modelID] = { modelID, mesh: {} as IfcMesh, items: {} };
        return modelID;
    }

    private loadAllGeometry() {
        this.saveAllPlacedGeometriesByMaterial();
        return this.generateAllGeometriesByMaterial();
    }

    private generateAllGeometriesByMaterial() {
        const { geometry, materials } = this.getGeometryAndMaterials();
        this.applyThreeMeshBVH(geometry);
        const mesh = new Mesh(geometry, materials) as IfcMesh;
        mesh.modelID = this.currentID;
        this.state.models[this.currentID].mesh = mesh;
        return mesh;
    }

    private getGeometryAndMaterials() {
        const items = this.state.models[this.currentID].items;
        const mergedByMaterial: BufferGeometry[] = [];
        const materials: Material[] = [];
        for (let materialID in items) {
            materials.push(items[materialID].material);
            const geometries = Object.values(items[materialID].geometries);
            mergedByMaterial.push(merge(geometries));
        }
        const geometry = merge(mergedByMaterial, true);
        return { geometry, materials };
    }

    private saveAllPlacedGeometriesByMaterial() {
        const flatMeshes = this.state.api.LoadAllGeometry(this.currentID);
        for (let i = 0; i < flatMeshes.size(); i++) {
            const flatMesh = flatMeshes.get(i);
            const placedGeom = flatMesh.geometries;
            for (let j = 0; j < placedGeom.size(); j++) {
                this.savePlacedGeometry(placedGeom.get(j), flatMesh.expressID);
            }
        }
    }

    private savePlacedGeometry(placedGeometry: PlacedGeometry, id: number) {
        const geometry = this.getBufferGeometry(placedGeometry);
        geometry.computeVertexNormals();
        const matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        this.saveGeometryByMaterial(geometry, placedGeometry, id);
    }

    private getBufferGeometry(placed: PlacedGeometry) {
        const geometry = this.state.api.GetGeometry(this.currentID, placed.geometryExpressID);
        const vertexData = this.getVertices(geometry);
        const indices = this.getIndices(geometry);
        const { vertices, normals } = this.extractVertexData(vertexData);
        return this.ifcGeomToBufferGeom(vertices, normals, indices);
    }

    private getVertices(geometry: IfcGeometry) {
        const vData = geometry.GetVertexData();
        const vDataSize = geometry.GetVertexDataSize();
        return this.state.api.GetVertexArray(vData, vDataSize);
    }

    private getIndices(geometry: IfcGeometry) {
        const iData = geometry.GetIndexData();
        const iDataSize = geometry.GetIndexDataSize();
        return this.state.api.GetIndexArray(iData, iDataSize);
    }

    private getMeshMatrix(matrix: number[]) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }

    private ifcGeomToBufferGeom(vertices: any[], normals: any[], indexData: any) {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', newFloatAttr(vertices, 3));
        geometry.setAttribute('normal', newFloatAttr(normals, 3));
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
        const color = placedGeom.color;
        const colorID = `${color.x}${color.y}${color.z}${color.w}`;
        this.storeGeometryAttribute(id, geom);
        this.createMaterial(colorID, color);
        const item = this.state.models[this.currentID].items[colorID];
        const currentGeom = item.geometries[id];
        if (!currentGeom) return item.geometries[id] = geom;
        const merged = merge([currentGeom, geom]);
        item.geometries[id] = merged;
    }

    private storeGeometryAttribute(id: number, geometry: BufferGeometry){
        const size = geometry.attributes.position.count;
        const idAttribute = new Array(size).fill(id);
        geometry.setAttribute(IdAttrName, newIntAttr(idAttribute, 1));
    }

    private createMaterial(colorID: string, color: ifcColor) {
        const items = this.state.models[this.currentID].items;
        if (items[colorID]) return;
        const col = new Color(color.x, color.y, color.z);
        const newMaterial = new MeshLambertMaterial({ color: col, side: DoubleSide });
        newMaterial.transparent = color.w !== 1;
        if (newMaterial.transparent) newMaterial.opacity = color.w;
        items[colorID] = { material: newMaterial, geometries: {} };
    }
}
