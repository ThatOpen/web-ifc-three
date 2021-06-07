import { IfcAPI } from 'web-ifc';
import { Mesh, BufferGeometry, Material } from 'three';
import { MapFaceIndexID, MapIDFaceIndex } from './BaseDefinitions';
export declare class IFCParser {
    private modelID;
    private ifcAPI;
    private mapFaceindexID;
    private mapIDFaceindex;
    private geometryByMaterials;
    constructor(ifcAPI: IfcAPI, mapFaceindexID: MapFaceIndexID, mapIDFaceindex: MapIDFaceIndex);
    parse(buffer: any): Promise<Mesh<BufferGeometry, Material[]>>;
    private loadAllGeometry;
    private generateAllGeometriesByMaterial;
    private storeFaceindicesByExpressIDs;
    private getMaterialsAndGeometries;
    private saveAllPlacedGeometriesByMaterial;
    private savePlacedGeometryByMaterial;
    private getBufferGeometry;
    private getMeshMatrix;
    private ifcGeometryToBuffer;
    private extractVertexData;
    private saveGeometryByMaterial;
    private createMaterial;
    private newGeometryByMaterial;
}
