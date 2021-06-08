import {
    IfcAPI,
    IFCPROJECT,
    IFCRELAGGREGATES,
    IFCRELCONTAINEDINSPATIALSTRUCTURE,
    IFCRELDEFINESBYPROPERTIES,
    IFCRELDEFINESBYTYPE
} from 'web-ifc';
import { Item, IfcState } from './BaseDefinitions';

export class PropertyManager {
    private state: IfcState;

    constructor(state: IfcState) {
        this.state = state;
    }

    getExpressId(modelID: number, faceIndex: Number) {
        const ids = this.state.models[modelID].ids;
        for (let index in ids) {
            if (parseInt(index) > faceIndex) return ids[index];
        }
        return -1;
    }

    getItemProperties(modelID: number, id: number, recursive = false) {
        return this.state.api.GetLine(modelID, id, recursive);
    }

    getAllItemsOfType(modelID: number, type: number) {
        const props: object[] = [];
        const lines = this.state.api.GetLineIDsWithType(modelID, type);
        for (let i = 0; i < lines.size(); i++) {
            const item = this.state.api.GetLine(modelID, lines.get(i));
            props.push(item);
        }
        return props;
    }

    getPropertySets(modelID: number, elementID: number, recursive = false) {
        const propSetIds = this.getAllRelatedItemsOfType(
            modelID,
            elementID,
            IFCRELDEFINESBYPROPERTIES,
            'RelatedObjects',
            'RelatingPropertyDefinition'
        );
        return propSetIds.map((id) => this.state.api.GetLine(modelID, id, recursive));
    }

    getTypeProperties(modelID: number, elementID: number, recursive = false) {
        const typeId = this.getAllRelatedItemsOfType(
            modelID,
            elementID,
            IFCRELDEFINESBYTYPE,
            'RelatedObjects',
            'RelatingType'
        );
        return typeId.map((id) => this.state.api.GetLine(modelID, id, recursive));
    }

    getSpatialStructure(modelID: number) {
        let lines = this.state.api.GetLineIDsWithType(modelID, IFCPROJECT);
        let ifcProjectId = lines.get(0);
        let ifcProject = this.state.api.GetLine(modelID, ifcProjectId);
        this.getAllSpatialChildren(modelID, ifcProject);
        return ifcProject;
    }

    private async getAllSpatialChildren(modelID: number, item: Item) {
        item.hasChildren = [];
        item.hasSpatialChildren = [];
        this.getChildren(
            modelID,
            item.expressID,
            item.hasSpatialChildren,
            'RelatingObject',
            'RelatedObjects',
            IFCRELAGGREGATES
        );
        this.getChildren(
            modelID,
            item.expressID,
            item.hasChildren,
            'RelatingStructure',
            'RelatedElements',
            IFCRELCONTAINEDINSPATIALSTRUCTURE
        );
    }

    private getChildren(
        modelID: number,
        id: number,
        prop: Item[],
        relating: string,
        rel: string,
        relProp: number
    ) {
        const childrenID = this.getAllRelatedItemsOfType(modelID, id, relProp, relating, rel);
        childrenID
            .map((id) => this.state.api.GetLine(modelID, id, false))
            .forEach((item) => prop.push(item));
        prop.forEach((child: any) => this.getAllSpatialChildren(modelID, child));
    }

    private getAllRelatedItemsOfType(modelID: number, id: number, type: any, relation: string, related: string) {
        const lines = this.state.api.GetLineIDsWithType(modelID, type);
        const IDs = [];

        for (let i = 0; i < lines.size(); i++) {
            const relID = lines.get(i);
            const rel = this.state.api.GetLine(modelID, relID);
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
