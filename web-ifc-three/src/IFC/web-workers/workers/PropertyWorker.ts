import {
    ErrorPropertiesNotAvailable, ErrorRootStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    PropertyWorkerAPI,
    WorkerAPIs
} from '../BaseDefinitions';
import { PropertyManager } from '../../components/properties/PropertyManager';

export class PropertyWorker implements PropertyWorkerAPI {
    properties?: PropertyManager;
    API = WorkerAPIs.properties;

    constructor(private worker: IfcWorkerAPI) {
    }

    initializeProperties() {
        if (!this.properties) {
            if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
            this.properties = new PropertyManager(this.worker.state);
        }
    }

    getAllItemsOfType(data: IfcEventData): void {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = this.properties.getAllItemsOfType(args.modelID, args.type, args.verbose);
        this.worker.post(data);
    }

    getItemProperties(data: IfcEventData): void {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = this.properties.getTypeProperties(args.modelID, args.elementID, args.recurse);
        this.worker.post(data);
    }

    getMaterialsProperties(data: IfcEventData): void {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = this.properties.getMaterialsProperties(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }

    getPropertySets(data: IfcEventData): void {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = this.properties.getPropertySets(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }

    getSpatialStructure(data: IfcEventData): void {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = this.properties.getSpatialStructure(args.modelID, args.includeProperties);
        this.worker.post(data);
    }

    getTypeProperties(data: IfcEventData): void {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = this.properties.getTypeProperties(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }
}