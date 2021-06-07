import * as WebIFC from 'web-ifc/web-ifc-api';
import { IFCParser } from './IFCParser';
import { DisplayManager } from './DisplayManager';
import { ItemPicker } from './ItemPicker';
import { PropertyManager } from './PropertyManager';

export class IFCManager {
    constructor() {
        this.modelID = 0;
        this.ifcAPI = new WebIFC.IfcAPI();
        this.mapFaceindexID = {};
        this.mapIDFaceindex = {};
        this.parser = new IFCParser(this.ifcAPI, this.mapFaceindexID, this.mapIDFaceindex);
        this.display = new DisplayManager(this.mapFaceindexID, this.mapIDFaceindex);
        this.properties = new PropertyManager(this.modelID, this.ifcAPI, this.mapFaceindexID, this.mapIDFaceindex);
        this.picker = new ItemPicker(this.display);
    }

    parse(buffer) {
        return this.parser.parse(buffer);
    }

    setWasmPath(path) {
        this.ifcAPI.SetWasmPath(path);
    }

    pickItem(items, geometry, pickTransparent = true) {
        return this.picker.pickItem(items, geometry, pickTransparent);
    }

    setItemsDisplay(id, mesh, state, scene) {
        this.display.setItemsDisplay(id, mesh, state, scene);
    }

    getExpressId(faceIndex) {
        return this.properties.getExpressId(faceIndex);
    }

    getItemProperties(id, all = false, recursive = false) {
        return this.properties.getItemProperties(id, all, recursive);
    }

    getSpatialStructure() {
        return this.properties.getSpatialStructure();
    }
}
