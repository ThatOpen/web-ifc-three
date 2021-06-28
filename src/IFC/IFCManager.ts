import * as WebIFC from 'web-ifc';
import { IFCParser } from './IFCParser';
import { SubsetManager } from './SubsetManager';
import { PropertyManager } from './PropertyManager';
import { IfcElements } from './IFCElementsMap';
import { TypeManager } from './TypeManager';
import { HighlightConfig, IfcState, Node } from './BaseDefinitions';
import { BufferGeometry, Material, Scene } from 'three';

export class IFCManager {
    private state: IfcState;
    private parser: IFCParser;
    private subsets: SubsetManager;
    private properties: PropertyManager;
    private types: TypeManager

    constructor() {
        this.state = { models: [], api: new WebIFC.IfcAPI() };
        this.parser = new IFCParser(this.state);
        this.subsets = new SubsetManager(this.state);
        this.properties = new PropertyManager(this.state);
        this.types = new TypeManager(this.state);
    }

    async parse(buffer: any) {
        const result = await this.parser.parse(buffer);
        this.types.getAllTypes();
        return result;
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

    getIfcType(modelID: number, id: number){
        const typeID = this.state.models[modelID].types[id];
        return IfcElements[typeID.toString()];
    }

    getSpatialStructure(modelID: number) {
        return this.properties.getSpatialStructure(modelID);
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
