import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
    Mesh,
    Color,
    MeshLambertMaterial,
    DoubleSide,
    Matrix4,
    BufferGeometry,
    BufferAttribute
} from 'three/build/three.module';
import { OpaqueShader } from './Shaders';

export class IFCParser {
    constructor(ifcAPI, mapFaceindexID, mapIDFaceindex) {
        this.mapFaceindexID = mapFaceindexID;
        this.mapIDFaceindex = mapIDFaceindex;
        this.geometryByMaterials = {};
        this.ifcAPI = ifcAPI;
    }

    async parse(buffer) {
        if (this.ifcAPI.wasmModule === undefined) {
            await this.ifcAPI.Init();
        }
        const data = new Uint8Array(buffer);
        this.modelID = this.ifcAPI.OpenModel('example.ifc', data);
        return this.loadAllGeometry(this.modelID);
    }

    loadAllGeometry(modelID) {
        this.saveAllPlacedGeometriesByMaterial(modelID);
        return this.generateAllGeometriesByMaterial();
    }

    generateAllGeometriesByMaterial() {
        const { materials, geometries } = this.getMaterialsAndGeometries();
        const allGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
        this.storeFaceindicesByExpressIDs();
        return new Mesh(allGeometry, materials);
    }

    storeFaceindicesByExpressIDs() {
        let previous = 0;

        for (let index in this.mapFaceindexID) {
            const current = parseInt(index);
            const id = this.mapFaceindexID[current];

            var faceIndices = [];
            for (let j = previous; j < current; j++) {
                faceIndices.push(j);
            }

            previous = current;

            if (!this.mapIDFaceindex[id]) this.mapIDFaceindex[id] = [];
            this.mapIDFaceindex[id].push(...faceIndices);
        }
    }

    getMaterialsAndGeometries() {
        const materials = [];
        const geometries = [];
        let totalFaceCount = 0;

        for (let i in this.geometryByMaterials) {
            materials.push(this.geometryByMaterials[i].material);
            const currentGeometries = this.geometryByMaterials[i].geometry;
            geometries.push(BufferGeometryUtils.mergeBufferGeometries(currentGeometries));

            for (let j in this.geometryByMaterials[i].indices) {
                const globalIndex = parseInt(j, 10) + parseInt(totalFaceCount, 10);
                this.mapFaceindexID[globalIndex] = this.geometryByMaterials[i].indices[j];
            }

            totalFaceCount += this.geometryByMaterials[i].lastIndex;
        }

        return { materials, geometries };
    }

    saveAllPlacedGeometriesByMaterial(modelID) {
        const flatMeshes = this.ifcAPI.LoadAllGeometry(modelID);

        for (let i = 0; i < flatMeshes.size(); i++) {
            const flatMesh = flatMeshes.get(i);
            const productId = flatMesh.expressID;
            const placedGeometries = flatMesh.geometries;

            for (let j = 0; j < placedGeometries.size(); j++) {
                this.savePlacedGeometryByMaterial(modelID, placedGeometries.get(j), productId);
            }
        }
    }

    savePlacedGeometryByMaterial(modelID, placedGeometry, productId) {
        const geometry = this.getBufferGeometry(modelID, placedGeometry);
        geometry.computeVertexNormals();
        const matrix = this.getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        this.saveGeometryByMaterial(geometry, placedGeometry, productId);
    }

    getBufferGeometry(modelID, placedGeometry) {
        const geometry = this.ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID);
        const verts = this.ifcAPI.GetVertexArray(
            geometry.GetVertexData(),
            geometry.GetVertexDataSize()
        );
        const indices = this.ifcAPI.GetIndexArray(
            geometry.GetIndexData(),
            geometry.GetIndexDataSize()
        );
        return this.ifcGeometryToBuffer(verts, indices);
    }

    getMeshMatrix(matrix) {
        const mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
    }

    ifcGeometryToBuffer(vertexData, indexData) {
        const geometry = new BufferGeometry();
        const { vertices, normals } = this.extractVertexData(vertexData);
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
    }

    extractVertexData(vertexData) {
        const vertices = [];
        const normals = [];
        let isNormalData = false;

        for (let i = 0; i < vertexData.length; i++) {
            isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
            if ((i + 1) % 3 == 0) isNormalData = !isNormalData;
        }

        return { vertices, normals };
    }

    saveGeometryByMaterial(geometry, placedGeometry, productId) {
        const color = placedGeometry.color;
        const id = `${color.x}${color.y}${color.z}${color.w}`;
        this.createMaterial(id, color);
        const currentGeometry = this.geometryByMaterials[id];
        currentGeometry.geometry.push(geometry);
        currentGeometry.lastIndex += geometry.index.count / 3;
        currentGeometry.indices[currentGeometry.lastIndex] = productId;
    }

    createMaterial(id, color) {
        if (!this.geometryByMaterials[id]) {
            const col = new Color(color.x, color.y, color.z);
            const newMaterial = new MeshLambertMaterial({ color: col, side: DoubleSide });
            newMaterial.onBeforeCompile = OpaqueShader;
            newMaterial.transparent = color.w !== 1;
            if (newMaterial.transparent) newMaterial.opacity = color.w;
            this.geometryByMaterials[id] = this.newGeometryByMaterial(newMaterial);
        }
    }

    newGeometryByMaterial(newMaterial) {
        return {
            material: newMaterial,
            geometry: [],
            indices: {},
            lastIndex: 0
        };
    }
}
