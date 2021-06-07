import * as WebIFC from 'web-ifc/web-ifc-api';

export class PropertyManager {

    constructor(modelID, ifcAPI, mapFaceindexID, mapIDFaceindex) {
        this.modelID = modelID;
        this.mapFaceindexID = mapFaceindexID;
        this.mapIDFaceindex = mapIDFaceindex;
        this.ifcAPI = ifcAPI;
    }

    getExpressId(faceIndex) {
        for (let index in this.mapFaceindexID) {
            if (parseInt(index) > faceIndex) return this.mapFaceindexID[index];
        }
        return -1;
    }

    getItemProperties(elementID, all = false, recursive = false) {
        const properties = this.ifcAPI.GetLine(this.modelID, elementID, recursive);

        if (all) {
            const propSetIds = this.getAllRelatedItemsOfType(
                elementID,
                WebIFC.IFCRELDEFINESBYPROPERTIES,
                'RelatedObjects',
                'RelatingPropertyDefinition'
            );
            properties.hasPropertySets = propSetIds.map((id) =>
                this.ifcAPI.GetLine(this.modelID, id, recursive)
            );

            const typeId = this.getAllRelatedItemsOfType(
                elementID,
                WebIFC.IFCRELDEFINESBYTYPE,
                'RelatedObjects',
                'RelatingType'
            );
            properties.hasType = typeId.map((id) =>
                this.ifcAPI.GetLine(this.modelID, id, recursive)
            );
        }

        // properties.type = properties.constructor.name;
        return properties;
    }

    getSpatialStructure() {
        let lines = this.ifcAPI.GetLineIDsWithType(this.modelID, WebIFC.IFCPROJECT);
        let ifcProjectId = lines.get(0);
        let ifcProject = this.ifcAPI.GetLine(this.modelID, ifcProjectId);
        this.getAllSpatialChildren(ifcProject);
        return ifcProject;
    }

    getAllSpatialChildren(spatialElement) {
        const id = spatialElement.expressID;
        const spatialChildrenID = this.getAllRelatedItemsOfType(
            id,
            WebIFC.IFCRELAGGREGATES,
            'RelatingObject',
            'RelatedObjects'
        );
        spatialElement.hasSpatialChildren = spatialChildrenID.map((id) =>
            this.ifcAPI.GetLine(this.modelID, id, false)
        );
        spatialElement.hasChildren = this.getAllRelatedItemsOfType(
            id,
            WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
            'RelatingStructure',
            'RelatedElements'
        );
        spatialElement.hasSpatialChildren.forEach((child) => this.getAllSpatialChildren(child));
    }

    getAllRelatedItemsOfType(elementID, type, relation, relatedProperty) {
        const lines = this.ifcAPI.GetLineIDsWithType(this.modelID, type);
        const IDs = [];

        for (let i = 0; i < lines.size(); i++) {
            const relID = lines.get(i);
            const rel = this.ifcAPI.GetLine(this.modelID, relID);
            const relatedItems = rel[relation];
            let foundElement = false;

            if (Array.isArray(relatedItems)) {
                const values = relatedItems.map((item) => item.value);
                foundElement = values.includes(elementID);
            } else foundElement = relatedItems.value === elementID;

            if (foundElement) {
                const element = rel[relatedProperty];
                if (!Array.isArray(element)) IDs.push(element.value);
                else element.forEach((ele) => IDs.push(ele.value));
            }
        }
        return IDs;
    }

}