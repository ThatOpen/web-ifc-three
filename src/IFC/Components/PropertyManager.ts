import { IdAttrName } from '../BaseDefinitions';
import { Node, IfcState, PropsNames, pName } from '../BaseDefinitions';
import { IfcElements } from './IFCElementsMap';
import { IFCPROJECT } from 'web-ifc';
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
        const propSetIds = this.getAllRelatedItemsOfType(modelID, elementID, PropsNames.psets);
        return propSetIds.map((id) => this.state.api.GetLine(modelID, id, recursive));
    }

    getTypeProperties(modelID: number, elementID: number, recursive = false) {
        const typeId = this.getAllRelatedItemsOfType(modelID, elementID, PropsNames.type);
        return typeId.map((id) => this.state.api.GetLine(modelID, id, recursive));
    }

    getSpatialStructure(modelID: number) {
        const chunks = this.getSpatialTreeChunks(modelID);
        const projectID = this.state.api.GetLineIDsWithType(modelID, IFCPROJECT).get(0);
        const project = this.newIfcProject(projectID);
        this.getSpatialNode(modelID, project, chunks);
        return project;
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
        this.getChunks(modelID, treeChunks, PropsNames.aggregates);
        this.getChunks(modelID, treeChunks, PropsNames.spatial);
        return treeChunks;
    }

    private getChunks(modelID: number, chunks: any, propNames: pName) {
        const relation = this.state.api.GetLineIDsWithType(modelID, propNames.name);
        for (let i = 0; i < relation.size(); i++) {
            const rel = this.state.api.GetLine(modelID, relation.get(i), false);
            const relating = rel[propNames.relating].value;
            const related = rel[propNames.related].map((r: any) => r.value);
            chunks[relating] = related;
        }
    }

    private getSpatialNode(modelID: number, node: Node, treeChunks: any) {
        this.getChildren(modelID, node, treeChunks, PropsNames.aggregates);
        this.getChildren(modelID, node, treeChunks, PropsNames.spatial);
    }

    private getChildren(modelID: number, node: Node, treeChunks: any, propNames: pName) {
        const children = treeChunks[node.expressID];
        if (children == undefined || children == null) return;
        const prop = propNames.key as keyof Node;
        (node[prop] as Node[]) = children.map((child: number) => {
            const node = this.newNode(modelID, child);
            this.getSpatialNode(modelID, node, treeChunks);
            return node;
        });
    }

    private newNode(modelID: number, id: number) {
        const typeID = this.state.models[modelID].types[id].toString();
        const typeName = IfcElements[typeID];
        return {
            expressID: id,
            type: typeName,
            children: [],
        };
    }

    private getAllRelatedItemsOfType(modelID: number, id: number, propNames: pName) {
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
