import * as WebIFC from 'web-ifc';
import { IFCParser } from './IFCParser';
import { SubsetManager } from './SubsetManager';
import { PropertyManager } from './PropertyManager';
import { IfcElements } from './IFCElementsMap';
import { TypeManager } from './TypeManager';
import { HighlightConfig, HighlightConfigOfModel, IfcState, Node } from '../BaseDefinitions';
import { BufferGeometry, Material, Scene } from 'three';
import { IFCModel } from './IFCModel';

/**
 * Contains all the logic to work with the loaded IFC files (select, edit, etc).
 */
export class IFCManager {
    private state: IfcState = { models: [], api: new WebIFC.IfcAPI() };
    private parser = new IFCParser(this.state);
    private subsets = new SubsetManager(this.state);
    private properties = new PropertyManager(this.state);
    private types = new TypeManager(this.state);

    async parse(buffer: ArrayBuffer) {
        const mesh = await this.parser.parse(buffer);
        this.types.getAllTypes();
        return new IFCModel(mesh, this);
    }

    setWasmPath(path: string) {
        this.state.api.SetWasmPath(path);
    }

    close(modelID: number, scene?: Scene) {
        this.state.api.CloseModel(modelID);
        if (scene) scene.remove(this.state.models[modelID].mesh);
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

    getIfcType(modelID: number, id: number) {
        const typeID = this.state.models[modelID].types[id];
        return IfcElements[typeID.toString()];
    }

    getSpatialStructure(modelID: number) {
        return this.properties.getSpatialStructure(modelID);
    }

    getSubset(modelID: number, material?: Material) {
        return this.subsets.getSubset(modelID, material);
    }

    removeSubset(modelID: number, scene?: Scene, material?: Material) {
        this.subsets.removeSubset(modelID, scene, material);
    }

    createSubset(config: HighlightConfigOfModel) {
        return this.subsets.createSubset(config);
    }
}
