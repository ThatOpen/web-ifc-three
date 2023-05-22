import { BasePropertyManager } from './BasePropertyManager';
import { IFCPROJECT } from 'web-ifc';
import { pName } from '../../BaseDefinitions';
import { PropertyAPI } from './BaseDefinitions';

export class WebIfcPropertyManager extends BasePropertyManager  implements PropertyAPI {
    async getItemProperties(modelID: number, id: number, recursive = false) {
        return this.state.api.GetLine(modelID, id, recursive);
    }

    async getHeaderLine(modelID: number, headerType: number) {
        return this.state.api.GetHeaderLine(modelID, headerType);
    }

    async getSpatialStructure(modelID: number, includeProperties?: boolean) {
        const chunks = await this.getSpatialTreeChunks(modelID);
        const allLines = await this.state.api.GetLineIDsWithType(modelID, IFCPROJECT);
        const projectID = allLines.get(0);
        const project = WebIfcPropertyManager.newIfcProject(projectID);
        await this.getSpatialNode(modelID, project, chunks, includeProperties);
        return project;
    }

    async getAllItemsOfType(modelID: number, type: number, verbose: boolean) {
        let items: number[] = [];
        const lines = await this.state.api.GetLineIDsWithType(modelID, type);
        for (let i = 0; i < lines.size(); i++) items.push(lines.get(i));
        if (!verbose) return items;
        const result: any[] = [];
        for (let i = 0; i < items.length; i++) {
            result.push(await this.state.api.GetLine(modelID, items[i]));
        }
        return result;
    }

    override async getProperty(modelID: number, elementID: number, recursive = false, propName: pName) {
        const propSetIds = await this.getAllRelatedItemsOfType(modelID, elementID, propName);
        const result: any[] = [];
        for (let i = 0; i < propSetIds.length; i++) {
            result.push(await this.state.api.GetLine(modelID, propSetIds[i], recursive));
        }
        return result;
    }

    protected override getNodeType(modelID: number, id: number) {
        const typeID = this.state.models[modelID].types[id];
        return this.state.api.GetNameFromTypeCode(typeID);
    }

    protected override async getChunks(modelID: number, chunks: any, propNames: pName) {
        const relation = await this.state.api.GetLineIDsWithType(modelID, propNames.name);
        for (let i = 0; i < relation.size(); i++) {
            const rel = await this.state.api.GetLine(modelID, relation.get(i), false);
            this.saveChunk(chunks, propNames, rel);
        }
    }

    private async getAllRelatedItemsOfType(modelID: number, id: number, propNames: pName) {
        const lines = await this.state.api.GetLineIDsWithType(modelID, propNames.name);
        const IDs: number[] = [];
        for (let i = 0; i < lines.size(); i++) {
            const rel = await this.state.api.GetLine(modelID, lines.get(i));
            const isRelated = BasePropertyManager.isRelated(id, rel, propNames);
            if (isRelated) this.getRelated(rel, propNames, IDs);
        }
        return IDs;
    }
}