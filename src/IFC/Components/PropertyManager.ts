import { IdAttrName, JSONObject } from '../BaseDefinitions';
import { Node, IfcState, PropsNames, pName } from '../BaseDefinitions';
import { IfcElements } from './IFCElementsMap';
import { IFCPROJECT } from 'web-ifc';
import { BufferGeometry } from 'three';
import { IfcTypesMap } from './IfcTypesMap';

/**
 * Contains the logic to get the properties of the items within an IFC model.
 */
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
        return this.state.useJSON ?
            this.state.models[modelID].jsonData[id] :
            this.state.api.GetLine(modelID, id, recursive);
    }

    getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        return this.state.useJSON ?
            this.getAllItemsOfTypeJSON(modelID, type, verbose) :
            this.getAllItemsOfTypeWebIfcAPI(modelID, type, verbose);
    }

    getPropertySets(modelID: number, elementID: number, recursive = false) {
        return this.state.useJSON ?
            this.getPropertySetsJSON(modelID, elementID, recursive) :
            this.getPropertySetsWebIfcAPI(modelID, elementID, recursive);
    }

    getTypeProperties(modelID: number, elementID: number, recursive = false) {
        return this.state.useJSON ?
            this.getTypePropertiesJSON(modelID, elementID, recursive) :
            this.getTypePropertiesWebIfcAPI(modelID, elementID, recursive);
    }

    getSpatialStructure(modelID: number) {
        return this.state.useJSON ?
            this.getSpatialStructureJSON(modelID) :
            this.getSpatialStructureWebIfcAPI(modelID);
    }

    private getSpatialStructureJSON(modelID: number) {
        const chunks = this.getSpatialTreeChunks(modelID);
        const projectID = this.getAllItemsOfTypeJSON(modelID, IFCPROJECT, false)[0];
        const project = this.newIfcProject(projectID);
        this.getSpatialNode(modelID, project, chunks);
        return project;
    }

    private getSpatialStructureWebIfcAPI(modelID: number) {
        const chunks = this.getSpatialTreeChunks(modelID);
        const projectID = this.state.api.GetLineIDsWithType(modelID, IFCPROJECT).get(0);
        const project = this.newIfcProject(projectID);
        this.getSpatialNode(modelID, project, chunks);
        return project;
    }

    private getAllItemsOfTypeJSON(modelID: number, type: number, verbose: boolean) {
        const data = this.state.models[modelID].jsonData;
        const typeName = IfcTypesMap[type];
        if (!typeName) {
            throw new Error(`Type not found: ${type}`);
        }
        return this.filterJSONItemsByType(data, typeName, verbose);
    }

    private filterJSONItemsByType(data: { [id: number]: JSONObject }, typeName: string, verbose: boolean) {
        const result: any[] = [];
        Object.keys(data).forEach(key => {
            const numKey = parseInt(key);
            if (data[numKey].type.toUpperCase() === typeName) {
                result.push(verbose ? { ...data[numKey] } : numKey);
            }
        });
        return result;
    }

    private getPropertySetsJSON(modelID: number, elementID: number, recursive = false) {
        const resultIDs = this.getAllRelatedItemsOfTypeJSON(modelID, elementID, PropsNames.psets);
        return recursive ? this.getItemsByIDJSON(modelID, resultIDs) : resultIDs;
    }

    private getItemsByIDJSON(modelID: number, ids: number[]) {
        const data = this.state.models[modelID].jsonData;
        const result: any[] = [];
        ids.forEach(id => result.push(data[id]));
        return result;
    }

    private getPropertySetsWebIfcAPI(modelID: number, elementID: number, recursive = false) {
        const propSetIds = this.getAllRelatedItemsOfTypeWebIfcAPI(modelID, elementID, PropsNames.psets);
        return propSetIds.map((id) => this.state.api.GetLine(modelID, id, recursive));
    }

    private getTypePropertiesJSON(modelID: number, elementID: number, recursive = false) {
        const resultIDs = this.getAllRelatedItemsOfTypeJSON(modelID, elementID, PropsNames.type);
        return recursive ? this.getItemsByIDJSON(modelID, resultIDs) : resultIDs;
    }

    private getTypePropertiesWebIfcAPI(modelID: number, elementID: number, recursive = false) {
        const typeId = this.getAllRelatedItemsOfTypeWebIfcAPI(modelID, elementID, PropsNames.type);
        return typeId.map((id) => this.state.api.GetLine(modelID, id, recursive));
    }

    private getAllItemsOfTypeWebIfcAPI(modelID: number, type: number, verbose: boolean) {
        const items: number[] = [];
        const lines = this.state.api.GetLineIDsWithType(modelID, type);
        for (let i = 0; i < lines.size(); i++) items.push(lines.get(i));
        if (verbose) return items.map((id) => this.state.api.GetLine(modelID, id));
        return items;
    }

    private newIfcProject(id: number) {
        return {
            expressID: id,
            type: 'IFCPROJECT',
            children: []
        };
    }

    private getSpatialTreeChunks(modelID: number) {
        const treeChunks: any = {};
        const json = this.state.useJSON;
        if(json) {
            this.getChunksJSON(modelID, treeChunks, PropsNames.aggregates);
            this.getChunksJSON(modelID, treeChunks, PropsNames.spatial);
        } else {
            this.getChunksWebIfcAPI(modelID, treeChunks, PropsNames.aggregates);
            this.getChunksWebIfcAPI(modelID, treeChunks, PropsNames.spatial);
        }
        return treeChunks;
    }

    private getChunksJSON(modelID: number, chunks: any, propNames: pName) {
        const relation = this.getAllItemsOfTypeJSON(modelID, propNames.name, true);
        relation.forEach(rel => {
            this.saveChunk(chunks, propNames, rel);
        })
    }

    private getChunksWebIfcAPI(modelID: number, chunks: any, propNames: pName) {
        const relation = this.state.api.GetLineIDsWithType(modelID, propNames.name);
        for (let i = 0; i < relation.size(); i++) {
            const rel = this.state.api.GetLine(modelID, relation.get(i), false);
            this.saveChunk(chunks, propNames, rel);
        }
    }

    private saveChunk(chunks: any, propNames: pName, rel: any) {
        const relating = rel[propNames.relating].value;
        const related = rel[propNames.related].map((r: any) => r.value);
        if (chunks[relating] == undefined) {
            chunks[relating] = related;
        } else {
            chunks[relating] = chunks[relating].concat(related);
        }
    }

    private getSpatialNode(modelID: number, node: Node, treeChunks: any) {
        this.getChildren(modelID, node, treeChunks, PropsNames.aggregates);
        this.getChildren(modelID, node, treeChunks, PropsNames.spatial);
    }

    private getChildren(modelID: number, node: Node, treeChunks: any, propNames: pName) {
        const children = treeChunks[node.expressID];
        if (children == undefined) return;
        const prop = propNames.key as keyof Node;
        (node[prop] as Node[]) = children.map((child: number) => {
            const node = this.newNode(modelID, child);
            this.getSpatialNode(modelID, node, treeChunks);
            return node;
        });
    }

    private newNode(modelID: number, id: number) {
        const typeID = this.state.models[modelID].types[id];
        const typeName = IfcElements[typeID];
        return {
            expressID: id,
            type: typeName,
            children: []
        };
    }

    private getAllRelatedItemsOfTypeJSON(modelID: number, id: number, propNames: pName) {
        const lines = this.getAllItemsOfTypeJSON(modelID, propNames.name, true);
        const IDs: number[] = [];
        lines.forEach(line => {
            const isRelated = this.isRelated(id, line, propNames);
            if (isRelated) this.getRelated(line, propNames, IDs);
        });
        return IDs;
    }

    private getAllRelatedItemsOfTypeWebIfcAPI(modelID: number, id: number, propNames: pName) {
        const lines = this.state.api.GetLineIDsWithType(modelID, propNames.name);
        const IDs: number[] = [];
        for (let i = 0; i < lines.size(); i++) {
            const rel = this.state.api.GetLine(modelID, lines.get(i));
            const isRelated = this.isRelated(id, rel, propNames);
            if (isRelated) this.getRelated(rel, propNames, IDs);
        }
        return IDs;
    }

    private getRelated(rel: any, propNames: pName, IDs: number[]) {
        const element = rel[propNames.relating];
        if (!Array.isArray(element)) IDs.push(element.value);
        else element.forEach((ele) => IDs.push(ele.value));
    }

    private isRelated(id: number, rel: any, propNames: pName) {
        const relatedItems = rel[propNames.related];
        if (Array.isArray(relatedItems)) {
            const values = relatedItems.map((item) => item.value);
            return values.includes(id);
        }
        return relatedItems.value === id;
    }
}
