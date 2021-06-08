import {
    IfcAPI,
    IFCPROJECT,
    IFCRELAGGREGATES,
    IFCRELCONTAINEDINSPATIALSTRUCTURE,
    IFCRELDEFINESBYPROPERTIES,
    IFCRELDEFINESBYTYPE
} from 'web-ifc';
import { MapFaceIndexID, MapIDFaceIndex, Item } from './BaseDefinitions';

export class PropertyManager {
    private modelID: number;
    private ifcAPI: IfcAPI;
    private mapFaceindexID: MapFaceIndexID;
    private mapIDFaceindex: MapIDFaceIndex;

    constructor(
        modelID: number,
        ifcAPI: IfcAPI,
        mapFaceindexID: MapFaceIndexID,
        mapIDFaceindex: MapIDFaceIndex
    ) {
        this.modelID = modelID;
        this.mapFaceindexID = mapFaceindexID;
        this.mapIDFaceindex = mapIDFaceindex;
        this.ifcAPI = ifcAPI;
    }

    getExpressId(faceIndex: Number) {
        for (let index in this.mapFaceindexID) {
            if (parseInt(index) > faceIndex) return this.mapFaceindexID[index];
        }
        return -1;
    }

    getItemProperties(elementID: number, recursive = false) {
        return this.ifcAPI.GetLine(this.modelID, elementID, recursive);
    }

    getAllItemsOfType(type: number) {
        const props: object[] = [];
        const lines = this.ifcAPI.GetLineIDsWithType(this.modelID, type);
        for (let i = 0; i < lines.size(); i++) {
            const item = this.ifcAPI.GetLine(this.modelID, lines.get(i));
            props.push(item);
        }
        return props;
    }

    getPropertySets(elementID: number, recursive = false) {
        const propSetIds = this.getAllRelatedItemsOfType(
            elementID,
            IFCRELDEFINESBYPROPERTIES,
            'RelatedObjects',
            'RelatingPropertyDefinition'
        );
        return propSetIds.map((id) => this.ifcAPI.GetLine(this.modelID, id, recursive));
    }

    getTypeProperties(elementID: number, recursive = false) {
        const typeId = this.getAllRelatedItemsOfType(
            elementID,
            IFCRELDEFINESBYTYPE,
            'RelatedObjects',
            'RelatingType'
        );
        return typeId.map((id) => this.ifcAPI.GetLine(this.modelID, id, recursive));
    }

    getSpatialStructure() {
        let lines = this.ifcAPI.GetLineIDsWithType(this.modelID, IFCPROJECT);
        let ifcProjectId = lines.get(0);
        let ifcProject = this.ifcAPI.GetLine(this.modelID, ifcProjectId);
        this.getAllSpatialChildren(ifcProject);
        return ifcProject;
    }

    private async getAllSpatialChildren(item: Item) {
        item.hasChildren = [];
        item.hasSpatialChildren = [];
        this.getChildren(
            item.expressID,
            item.hasSpatialChildren,
            'RelatingObject',
            'RelatedObjects',
            IFCRELAGGREGATES
        );
        this.getChildren(
            item.expressID,
            item.hasChildren,
            'RelatingStructure',
            'RelatedElements',
            IFCRELCONTAINEDINSPATIALSTRUCTURE
        );
    }

    private getChildren(id: number, prop: Item[], relating: string, rel: string, relProp: number) {
        const childrenID = this.getAllRelatedItemsOfType(id, relProp, relating, rel);
        childrenID
            .map((id) => this.ifcAPI.GetLine(this.modelID, id, false))
            .forEach((item) => prop.push(item));
        prop.forEach((child: any) => this.getAllSpatialChildren(child));
    }

    private getAllRelatedItemsOfType(id: number, type: any, relation: string, related: string) {
        const lines = this.ifcAPI.GetLineIDsWithType(this.modelID, type);
        const IDs = [];

        for (let i = 0; i < lines.size(); i++) {
            const relID = lines.get(i);
            const rel = this.ifcAPI.GetLine(this.modelID, relID);
            const relatedItems = rel[relation];
            let foundElement = false;

            if (Array.isArray(relatedItems)) {
                const values = relatedItems.map((item) => item.value);
                foundElement = values.includes(id);
            } else foundElement = relatedItems.value === id;

            if (foundElement) {
                const element = rel[related];
                if (!Array.isArray(element)) IDs.push(element.value);
                else element.forEach((ele) => IDs.push(ele.value));
            }
        }
        return IDs;
    }
}
