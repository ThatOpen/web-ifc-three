import { IfcAPI } from "web-ifc";
import { MapFaceIndexID, MapIDFaceIndex } from "./BaseDefinitions";
export declare class PropertyManager {
    private modelID;
    private ifcAPI;
    private mapFaceindexID;
    private mapIDFaceindex;
    constructor(modelID: number, ifcAPI: IfcAPI, mapFaceindexID: MapFaceIndexID, mapIDFaceindex: MapIDFaceIndex);
    getExpressId(faceIndex: Number): number;
    getItemProperties(elementID: number, all?: boolean, recursive?: boolean): any;
    getSpatialStructure(): any;
    getAllSpatialChildren(spatialElement: any): void;
    getAllRelatedItemsOfType(elementID: number, type: any, relation: string, relatedProperty: string): any[];
}
