import { PropertyAPI } from '../../components/properties/BaseDefinitions';
import { IFCWorkerHandler } from '../IFCWorkerHandler';
import { WorkerActions, WorkerAPIs } from '../BaseDefinitions';

export class PropertyHandler implements PropertyAPI {

    API = WorkerAPIs.properties;

    constructor(private handler: IFCWorkerHandler) {
    }

    getAllItemsOfType(modelID: number, type: number, verbose: boolean): Promise<any[]> {
        return this.handler.request(this.API, WorkerActions.getAllItemsOfType, { modelID, type, verbose });
    }

    getItemProperties(modelID: number, id: number, recursive: boolean): Promise<any> {
        return this.handler.request(this.API, WorkerActions.getItemProperties, { modelID, id, recursive });
    }

    getMaterialsProperties(modelID: number, elementID: number, recursive: boolean): Promise<any[]> {
        return this.handler.request(this.API, WorkerActions.getMaterialsProperties, { modelID, elementID, recursive });
    }

    getPropertySets(modelID: number, elementID: number, recursive: boolean): Promise<any[]> {
        return this.handler.request(this.API, WorkerActions.getPropertySets, { modelID, elementID, recursive });
    }

    getTypeProperties(modelID: number, elementID: number, recursive: boolean): Promise<any[]> {
        return this.handler.request(this.API, WorkerActions.getTypeProperties, { modelID, elementID, recursive });
    }

    getSpatialStructure(modelID: number, includeProperties?: boolean): Promise<any> {
        return this.handler.request(this.API, WorkerActions.getSpatialStructure, { modelID, includeProperties });
    }
}