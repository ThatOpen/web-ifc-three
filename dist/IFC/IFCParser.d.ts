import { IfcAPI, PlacedGeometry, Color as ifcColor } from 'web-ifc';
import { Mesh, Matrix4, BufferGeometry, Material } from 'three';
import { MapFaceIndexID, MapIDFaceIndex } from './BaseDefinitions';
export declare class IFCParser {
    private modelID;
    private ifcAPI;
    private mapFaceindexID;
    private mapIDFaceindex;
    private geometryByMaterials;
    constructor(ifcAPI: IfcAPI, mapFaceindexID: MapFaceIndexID, mapIDFaceindex: MapIDFaceIndex);
    parse(buffer: any): Promise<Mesh<BufferGeometry, Material[]>>;
    loadAllGeometry(): Mesh<BufferGeometry, Material[]>;
    generateAllGeometriesByMaterial(): Mesh<BufferGeometry, Material[]>;
    storeFaceindicesByExpressIDs(): void;
    getMaterialsAndGeometries(): {
        materials: Material[];
        geometries: BufferGeometry[];
    };
    saveAllPlacedGeometriesByMaterial(): void;
    savePlacedGeometryByMaterial(placedGeometry: PlacedGeometry, productId: number): void;
    getBufferGeometry(placedGeometry: PlacedGeometry): BufferGeometry;
    getMeshMatrix(matrix: number[]): Matrix4;
    ifcGeometryToBuffer(vertexData: any, indexData: any): BufferGeometry;
    extractVertexData(vertexData: any): {
        vertices: any[];
        normals: any[];
    };
    saveGeometryByMaterial(geometry: BufferGeometry, placedGeometry: PlacedGeometry, productId: number): void;
    createMaterial(colorID: string, color: ifcColor): void;
    newGeometryByMaterial(newMaterial: Material): {
        material: Material;
        geometry: never[];
        indices: {};
        lastIndex: number;
    };
}
