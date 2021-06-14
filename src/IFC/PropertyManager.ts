import { IdAttrName } from './BaseDefinitions';
import { Node, IfcState } from './BaseDefinitions';
import {
    IFCPROJECT,
    IFCRELAGGREGATES,
    IFCRELCONTAINEDINSPATIALSTRUCTURE,
    IFCRELDEFINESBYPROPERTIES,
    IFCRELDEFINESBYTYPE
} from 'web-ifc';
import { BufferGeometry } from 'three';

export class PropertyManager {
    private state: IfcState;

    constructor(state: IfcState) {
        this.state = state;
    }

    getExpressId(geometry: BufferGeometry, faceIndex: number) {
        if (!geometry.index) return;
        const geoIndex = geometry.index.array;
        return geometry.attributes[IdAttrName].getX(geoIndex[3 * faceIndex]);
    }

    getItemProperties(modelID: number, id: number, recursive = false) {
        return this.state.api.GetLine(modelID, id, recursive);
    }

    getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        const items: number[] = [];
        const lines = this.state.api.GetLineIDsWithType(modelID, type);
        for (let i = 0; i < lines.size(); i++) items.push(lines.get(i));

        if (verbose) return items.map((id) => this.state.api.GetLine(modelID, id));
        return items;
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

    getSpatialStructure(modelID: number, recursive: boolean) {
        let lines = this.state.api.GetLineIDsWithType(modelID, IFCPROJECT);
        let ifcProjectId = lines.get(0);
        let ifcProject = this.state.api.GetLine(modelID, ifcProjectId);
        this.getAllSpatialChildren(modelID, ifcProject, recursive);
        return ifcProject;
    }

    private getAllSpatialChildren(modelID: number, item: Node, recursive: boolean) {
        item.hasChildren = [];
        item.hasSpatialChildren = [];
        this.getChildren(
            modelID,
            item.expressID,
            item.hasSpatialChildren,
            'RelatingObject',
            'RelatedObjects',
            IFCRELAGGREGATES,
            recursive,
            true
        );
        this.getChildren(
            modelID,
            item.expressID,
            item.hasChildren,
            'RelatingStructure',
            'RelatedElements',
            IFCRELCONTAINEDINSPATIALSTRUCTURE,
            recursive,
            false
        );
    }

    private getChildren(
        modelID: number,
        id: number,
        prop: Node[],
        relating: string,
        rel: string,
        relProp: number,
        recursive: boolean,
        isSpatial: boolean
    ) {
        const childrenID = this.getAllRelatedItemsOfType(modelID, id, relProp, relating, rel);
        if (!recursive && !isSpatial) return prop.push(...childrenID);
        const items = childrenID.map((id) => this.state.api.GetLine(modelID, id, false));
        prop.push(...items);
        prop.forEach((child: any) => this.getAllSpatialChildren(modelID, child, recursive));
    }

    private getAllRelatedItemsOfType(
        modelID: number,
        id: number,
        type: any,
        relation: string,
        related: string
    ) {
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
