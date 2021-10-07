import { ParserAPI } from '../../components/IFCParser';
import { WorkerActions, WorkerAPIs } from '../BaseDefinitions';
import { IFCWorkerHandler } from '../IFCWorkerHandler';
import { IFCModel } from '../../components/IFCModel';
import { Serializer } from '../serializer/Serializer';
import { ParserResult } from '../workers/ParserWorker';
import { BvhManager } from '../../components/BvhManager';

export class ParserHandler implements ParserAPI {

    API = WorkerAPIs.parser;

    constructor(private handler: IFCWorkerHandler, private serializer: Serializer, private BVH: BvhManager) {
    }

    async parse(buffer: any): Promise<IFCModel> {
        this.handler.serializeHandlers[this.handler.requestID] = (result: ParserResult) => {
            const ifcModel = this.serializer.reconstructIfcModel(result.model);
            this.BVH.applyThreeMeshBVH(ifcModel.geometry);
            this.storeIfcModel(ifcModel);
            this.handler.state.models[ifcModel.modelID].items = this.serializer.reconstructGeometriesByMaterials(result.items);
            return ifcModel;
        };
        return this.handler.request(this.API, WorkerActions.parse, { buffer });
    }

    getAndClearErrors(_modelId: number): void {
    }

    private storeIfcModel(ifcModel: IFCModel) {
        this.handler.state.models[ifcModel.modelID] = {
            modelID: ifcModel.modelID,
            mesh: ifcModel,
            items: {},
            types: {},
            jsonData: {}
        };
    }

}