import { IfcState, pName, PropsNames, Node } from '../../BaseDefinitions';
import { IfcElements } from '../IFCElementsMap';

export class BasePropertyManager {

    constructor(protected state: IfcState) {
    }

    async getPropertySets(modelID: number, elementID: number, recursive = false) {
        return await this.getProperty(modelID, elementID, recursive, PropsNames.psets);
    }

    async getTypeProperties(modelID: number, elementID: number, recursive = false) {
        return await this.getProperty(modelID, elementID, recursive, PropsNames.type);
    }

    async getMaterialsProperties(modelID: number, elementID: number, recursive = false) {
        return await this.getProperty(modelID, elementID, recursive, PropsNames.materials);
    }

    protected getSpatialNode(modelID: number, node: Node, treeChunks: any, includeProperties?: boolean) {
        this.getChildren(modelID, node, treeChunks, PropsNames.aggregates, includeProperties);
        this.getChildren(modelID, node, treeChunks, PropsNames.spatial, includeProperties);
    }

    protected getChildren(modelID: number, node: Node, treeChunks: any, propNames: pName, includeProperties?: boolean) {
        const children = treeChunks[node.expressID];
        if (children == undefined) return;
        const prop = propNames.key as keyof Node;
        (node[prop] as Node[]) = children.map((child: number) => {
            let node = this.newNode(modelID, child);
            if (includeProperties) {
                const properties = this.getItemProperties(modelID, node.expressID) as any;
                node = { ...node, ...properties };
            }
            this.getSpatialNode(modelID, node, treeChunks, includeProperties);
            return node;
        });
    }

    protected newNode(modelID: number, id: number) {
        const typeName = this.getNodeType(modelID, id);
        return {
            expressID: id,
            type: typeName,
            children: []
        };
    }

    protected async getSpatialTreeChunks(modelID: number) {
        const treeChunks: any = {};
        await this.getChunks(modelID, treeChunks, PropsNames.aggregates);
        await this.getChunks(modelID, treeChunks, PropsNames.spatial);
        return treeChunks;
    }

    protected saveChunk(chunks: any, propNames: pName, rel: any) {
        const relating = rel[propNames.relating].value;
        const related = rel[propNames.related].map((r: any) => r.value);
        if (chunks[relating] == undefined) {
            chunks[relating] = related;
        } else {
            chunks[relating] = chunks[relating].concat(related);
        }
    }

    protected getRelated(rel: any, propNames: pName, IDs: number[]) {
        const element = rel[propNames.relating];
        if (!Array.isArray(element)) IDs.push(element.value);
        else element.forEach((ele) => IDs.push(ele.value));
    }

    protected static isRelated(id: number, rel: any, propNames: pName) {
        const relatedItems = rel[propNames.related];
        if (Array.isArray(relatedItems)) {
            const values = relatedItems.map((item) => item.value);
            return values.includes(id);
        }
        return relatedItems.value === id;
    }

    protected static newIfcProject(id: number) {
        return {
            expressID: id,
            type: 'IFCPROJECT',
            children: []
        };
    }

    async getProperty(modelID: number, elementID: number, recursive = false, propName: pName): Promise<any> {
    }

    protected async getChunks(modelID: number, chunks: any, propNames: pName): Promise<void> {
    }

    protected async getItemProperties(modelID: number, expressID: number, recursive = false): Promise<any> {
    }

    protected getNodeType(modelID: number, id: number): any {
    }
}