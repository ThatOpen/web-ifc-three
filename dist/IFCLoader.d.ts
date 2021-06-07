import { BufferGeometry, Intersection, Loader, Mesh, Scene } from 'three';
import { Display } from './IFC/BaseDefinitions';
declare class IFCLoader extends Loader {
    private ifcManager;
    constructor(manager: any);
    load(url: any, onLoad: any, onProgress: any, onError: any): void;
    parse(buffer: any): Promise<Mesh<BufferGeometry, import("three").Material[]>>;
    setWasmPath(path: string): void;
    getExpressId(faceIndex: number): number;
    pickItem(items: Intersection[], geometry: BufferGeometry, transparent?: boolean): Intersection | null | undefined;
    setItemsVisibility(ids: number[], mesh: Mesh, state: Display, scene: Scene): void;
    getItemProperties(id: number, all?: boolean, recursive?: boolean): any;
    getSpatialStructure(): any;
}
export { IFCLoader };
