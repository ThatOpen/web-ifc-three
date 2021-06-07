import { Display } from './BaseDefinitions';
import { BufferGeometry, Intersection, Mesh, Scene } from 'three';
export declare class IFCManager {
    private modelID;
    private ifcAPI;
    private mapFaceindexID;
    private mapIDFaceindex;
    private parser;
    private display;
    private properties;
    private picker;
    constructor();
    parse(buffer: any): Promise<Mesh<BufferGeometry, import("three").Material[]>>;
    setWasmPath(path: string): void;
    pickItem(items: Intersection[], geometry: BufferGeometry, pickTransparent?: boolean): Intersection | null | undefined;
    setItemsDisplay(items: number[], mesh: Mesh, state: Display, scene: Scene): void;
    getExpressId(faceIndex: number): number;
    getItemProperties(id: number, all?: boolean, recursive?: boolean): any;
    getSpatialStructure(): any;
}
