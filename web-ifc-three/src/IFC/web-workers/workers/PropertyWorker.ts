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

    async getHeaderLine(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getHeaderLine(args.modelID, args.headerType);
        this.worker.post(data);
    }

    async getAllItemsOfType(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getAllItemsOfType(args.modelID, args.type, args.verbose);
        this.worker.post(data);
    }

    async getItemProperties(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getItemProperties(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }

    async getMaterialsProperties(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getMaterialsProperties(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }

    async getPropertySets(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getPropertySets(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }

    async getSpatialStructure(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getSpatialStructure(args.modelID, args.includeProperties);
        this.worker.post(data);
    }

    async getTypeProperties(data: IfcEventData): Promise<void> {
        this.initializeProperties();
        if (!this.properties) throw new Error(ErrorPropertiesNotAvailable);
        const args = data.args;
        data.result = await this.properties.getTypeProperties(args.modelID, args.elementID, args.recursive);
        this.worker.post(data);
    }
}