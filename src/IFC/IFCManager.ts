import * as WebIFC from 'web-ifc';
import { IFCParser } from './IFCParser';
import { DisplayManager } from './DisplayManager';
import { ItemPicker } from './ItemPicker';
import { PropertyManager } from './PropertyManager';
import { Display, IfcMesh, IfcState, MapFaceIndexID, MapIDFaceIndex } from './BaseDefinitions';
import { BufferGeometry, Intersection, Mesh, Scene } from 'three';

export class IFCManager {
    private state: IfcState;
    private parser: IFCParser;
    private display: DisplayManager;
    private properties: PropertyManager;
    private picker: ItemPicker;

    constructor() {
        this.state = { models: [], api: new WebIFC.IfcAPI() };
        this.parser = new IFCParser(this.state);
        this.display = new DisplayManager(this.state);
        this.properties = new PropertyManager(this.state);
        this.picker = new ItemPicker(this.display);
    }

    parse(buffer: any) {
        return this.parser.parse(buffer);
    }

    setWasmPath(path: string) {
        this.state.api.SetWasmPath(path);
    }

    close(modelID: number, mesh: IfcMesh, scene: Scene){
        this.state.api.CloseModel(modelID);
        scene.remove(mesh);
    }

    getExpressId(modelID: number, faceIndex: number) {
        return this.properties.getExpressId(modelID, faceIndex);
    }

    getAllItemsOfType(modelID: number, type: number) {
        return this.properties.getAllItemsOfType(modelID, type);
    }

    getItemProperties(modelID: number, id: number, recursive = false) {
        return this.properties.getItemProperties(modelID, id, recursive);
    }

    getPropertySets(modelID: number, id: number, recursive = false) {
        return this.properties.getPropertySets(modelID, id, recursive);
    }

    getTypeProperties(modelID: number, id: number, recursive = false) {
        return this.properties.getTypeProperties(modelID, id, recursive);
    }

    getSpatialStructure(modelID: number) {
        return this.properties.getSpatialStructure(modelID);
    }

    pickItem(items: Intersection[], pickTransparent = true) {
        return this.picker.pickItem(items, pickTransparent);
    }

    setItemsDisplay(items: number[], mesh: IfcMesh, state: Display, scene: Scene) {
        this.display.setItemsDisplay(items, mesh, state, scene);
    }
}
