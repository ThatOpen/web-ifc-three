import * as WebIFC from 'web-ifc';
import { IFCParser } from './IFCParser';
import { SubsetManager } from './SubsetManager';
import { PropertyManager } from './PropertyManager';
import { HighlightConfig, IfcState } from './BaseDefinitions';
import { BufferGeometry, Material, Scene } from 'three';

export class IFCManager {
    private state: IfcState;
    private parser: IFCParser;
    private subsets: SubsetManager;
    private properties: PropertyManager;

    constructor() {
        this.state = { models: [], api: new WebIFC.IfcAPI() };
        this.parser = new IFCParser(this.state);
        this.subsets = new SubsetManager(this.state);
        this.properties = new PropertyManager(this.state);
    }

    parse(buffer: any) {
        return this.parser.parse(buffer);
    }

    setWasmPath(path: string) {
        this.state.api.SetWasmPath(path);
    }

    close(modelID: number, scene?: Scene){
        this.state.api.CloseModel(modelID);
        if(scene) scene.remove(this.state.models[modelID].mesh);
        delete this.state.models[modelID];
    }

    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        return this.properties.getExpressId(geometry, faceIndex);
    }

    getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        return this.properties.getAllItemsOfType(modelID, type, verbose);
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

    getSpatialStructure(modelID: number, recursive: boolean) {
        return this.properties.getSpatialStructure(modelID, recursive);
    }

    getSubset(modelID: number, material?: Material){
        return this.subsets.getSubset(modelID, material);
    }

    removeSubset(modelID: number, scene?: Scene, material?: Material){
        this.subsets.removeSubset(modelID, scene, material);
    }

    createSubset(config: HighlightConfig) {
        return this.subsets.createSubset(config);
    }
}
