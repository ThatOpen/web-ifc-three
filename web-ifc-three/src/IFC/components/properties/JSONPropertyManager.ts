import { JSONObject, pName } from '../../BaseDefinitions';
import { BasePropertyManager } from './BasePropertyManager';
import { IFCPROJECT } from 'web-ifc';
import { PropertyAPI } from './BaseDefinitions';

export class JSONPropertyManager extends BasePropertyManager implements PropertyAPI {

    async getItemProperties(modelID: number, id: number, recursive = false) {
        return { ...this.state.models[modelID].jsonData[id] };
    }

    async getHeaderLine(modelID: number) {
        return {};
    }

    async getSpatialStructure(modelID: number, includeProperties?: boolean) {
        const chunks = await this.getSpatialTreeChunks(modelID);
        const projectsIDs = await this.getAllItemsOfType(modelID, IFCPROJECT, false);
        const projectID = projectsIDs[0];
        const project = JSONPropertyManager.newIfcProject(projectID);
        await this.getSpatialNode(modelID, project, chunks, includeProperties);
        return { ...project };
    }

    async getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        const data = this.state.models[modelID].jsonData;
        const typeName = await this.state.api.GetNameFromTypeCode(type);
        if (!typeName) {
            throw new Error(`Type not found: ${type}`);
        }
        return this.filterItemsByType(data, typeName, verbose);
    }

    override async getProperty(modelID: number, elementID: number, recursive = false, propName: pName) {
        const resultIDs = await this.getAllRelatedItemsOfType(modelID, elementID, propName);
        const result = this.getItemsByID(modelID, resultIDs);
        if (recursive) {
            result.forEach(result => this.getReferencesRecursively(modelID, result));
        }
        return result;
    }

    protected override getNodeType(modelID: number, id: number) {
        return this.state.models[modelID].jsonData[id].type;
    }

    protected override async getChunks(modelID: number, chunks: any, propNames: pName) {
        const relation = await this.getAllItemsOfType(modelID, propNames.name, true);
        relation.forEach(rel => {
            this.saveChunk(chunks, propNames, rel);
        });
    }

    private filterItemsByType(data: { [id: number]: JSONObject }, typeName: string, verbose: boolean) {
        const result: any[] = [];
        Object.keys(data).forEach(key => {
            const numKey = parseInt(key);
            if (data[numKey].type.toUpperCase() === typeName) {
                result.push(verbose ? { ...data[numKey] } : numKey);
            }
        });
        return result;
    }

    private async getAllRelatedItemsOfType(modelID: number, id: number, propNames: pName) {
        const lines = await this.getAllItemsOfType(modelID, propNames.name, true);
        const IDs: number[] = [];
        lines.forEach(line => {
            const isRelated = JSONPropertyManager.isRelated(id, line, propNames);
            if (isRelated) this.getRelated(line, propNames, IDs);
        });
        return IDs;
    }

    private getItemsByID(modelID: number, ids: number[]) {
        const data = this.state.models[modelID].jsonData;
        const result: any[] = [];
        ids.forEach(id => result.push({ ...data[id] }));
        return result;
    }

    private getReferencesRecursively(modelID: number, jsonObject: any) {
        if (jsonObject == undefined) return;
        const keys = Object.keys(jsonObject);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            this.getJSONItem(modelID, jsonObject, key);
        }
    }

    private getJSONItem(modelID: number, jsonObject: any, key: string) {
        if (Array.isArray(jsonObject[key])) {
            return this.getMultipleJSONItems(modelID, jsonObject, key);
        }
        if (jsonObject[key] && jsonObject[key].type === 5) {
            jsonObject[key] = this.getItemsByID(modelID, [jsonObject[key].value])[0];
            this.getReferencesRecursively(modelID, jsonObject[key]);
        }
    }

    private getMultipleJSONItems(modelID: number, jsonObject: any, key: string) {
        jsonObject[key] = jsonObject[key].map((item: any) => {
            if (item.type === 5) {
                item = this.getItemsByID(modelID, [item.value])[0];
                this.getReferencesRecursively(modelID, item);
            }
            return item;
        });
    }
}