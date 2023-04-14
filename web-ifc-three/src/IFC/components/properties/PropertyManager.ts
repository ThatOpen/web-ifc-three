import {
    IdAttrName
} from '../../BaseDefinitions';
import { IfcState } from '../../BaseDefinitions';
import { BufferAttribute, BufferGeometry } from 'three';
import { WebIfcPropertyManager } from './WebIfcPropertyManager';
import { JSONPropertyManager } from './JSONPropertyManager';
import { PropertyManagerAPI, PropertyAPI } from './BaseDefinitions';
import {PropertySerializer} from "./PropertySerializer";

/**
 * Contains the logic to get the properties of the items within an IFC model.
 */
export class PropertyManager implements PropertyManagerAPI {
    serializer?: PropertySerializer;

    private readonly webIfcProps: WebIfcPropertyManager;
    private readonly jsonProps: JSONPropertyManager;
    private currentProps: PropertyAPI;

    constructor(private state: IfcState) {
        this.webIfcProps = new WebIfcPropertyManager(state);
        this.jsonProps = new JSONPropertyManager(state);
        this.currentProps = this.webIfcProps;
        this.serializer = new PropertySerializer(this.state.api);
    }

    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        if (!geometry.index) throw new Error('Geometry does not have index information.');
        const geoIndex = geometry.index.array;
        const bufferAttr = geometry.attributes[IdAttrName] as BufferAttribute;
        return bufferAttr.getX(geoIndex[3 * faceIndex]);
    }

    async getHeaderLine(modelID: number, headerType: number) {
        this.updateCurrentProps();
        return this.currentProps.getHeaderLine(modelID, headerType);
    }

    async getItemProperties(modelID: number, elementID: number, recursive = false) {
        this.updateCurrentProps();
        return this.currentProps.getItemProperties(modelID, elementID, recursive);
    }

    async getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        this.updateCurrentProps();
        return this.currentProps.getAllItemsOfType(modelID, type, verbose);
    }

    async getPropertySets(modelID: number, elementID: number, recursive = false) {
        this.updateCurrentProps();
        return this.currentProps.getPropertySets(modelID, elementID, recursive);
    }

    async getTypeProperties(modelID: number, elementID: number, recursive = false) {
        this.updateCurrentProps();
        return this.currentProps.getTypeProperties(modelID, elementID, recursive);
    }

    async getMaterialsProperties(modelID: number, elementID: number, recursive = false) {
        this.updateCurrentProps();
        return this.currentProps.getMaterialsProperties(modelID, elementID, recursive);
    }

    async getSpatialStructure(modelID: number, includeProperties?: boolean) {
        this.updateCurrentProps();
        if (!this.state.useJSON && includeProperties) {
            console.warn('Including properties in getSpatialStructure with the JSON workflow disabled can lead to poor performance.');
        }
        return await this.currentProps.getSpatialStructure(modelID, includeProperties);
    }

    private updateCurrentProps() {
        this.currentProps = this.state.useJSON ? this.jsonProps : this.webIfcProps;
    }

}
