import { IfcAPI } from 'web-ifc';
import { MapFaceIndexID, MapIDFaceIndex } from './BaseDefinitions';
export declare class PropertyManager {
    private modelID;
    private ifcAPI;
    private mapFaceindexID;
    private mapIDFaceindex;
    constructor(modelID: number, ifcAPI: IfcAPI, mapFaceindexID: MapFaceIndexID, mapIDFaceindex: MapIDFaceIndex);
    getExpressId(faceIndex: Number): number;
    getItemProperties(elementID: number, recursive?: boolean): any;
    getPropertySets(elementID: number, recursive?: boolean): any[];
    getTypeProperties(elementID: number, recursive?: boolean): any[];
    getSpatialStructure(): any;
    private getAllSpatialChildren;
    private getAllRelatedItemsOfType;
}
