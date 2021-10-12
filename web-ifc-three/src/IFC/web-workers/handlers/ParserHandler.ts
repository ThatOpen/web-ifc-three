import {ParserAPI, ParserProgress} from '../../components/IFCParser';
import {WorkerActions, WorkerAPIs} from '../BaseDefinitions';
import {IFCWorkerHandler} from '../IFCWorkerHandler';
import {IFCModel} from '../../components/IFCModel';
import {Serializer} from '../serializer/Serializer';
import {ParserResult} from '../workers/ParserWorker';
import {BvhManager} from '../../components/BvhManager';
import {DBOperation, IndexedDatabase} from "../../indexedDB/IndexedDatabase";

export class ParserHandler implements ParserAPI {

    API = WorkerAPIs.parser;

    constructor(private handler: IFCWorkerHandler,
                private serializer: Serializer,
                private BVH: BvhManager,
                private IDB: IndexedDatabase) {
    }

    async parse(buffer: any): Promise<IFCModel> {
        this.handler.onprogressHandlers[this.handler.requestID] = (progress: ParserProgress) => {
            if (this.handler.state.onProgress) this.handler.state.onProgress(progress);
        };
        this.handler.serializeHandlers[this.handler.requestID] = async (result: ParserResult) => {
            this.updateState(result.modelID);
            await this.getItems(result.modelID);
            return this.getModel();
        };
        return this.handler.request(this.API, WorkerActions.parse, {buffer});
    }

    getAndClearErrors(_modelId: number): void {
    }

    private updateState(modelID: number) {
        this.handler.state.models[modelID] = {
            modelID: modelID,
            mesh: {} as any,
            items: {},
            types: {},
            jsonData: {}
        };
    }

    private async getItems(modelID: number) {
        const items = await this.IDB.load(DBOperation.transferIndividualItems);
        this.handler.state.models[modelID].items = this.serializer.reconstructGeometriesByMaterials(items);
    }

    private async getModel() {
        const serializedModel = await this.IDB.load(DBOperation.transferIfcModel);
        const model = this.serializer.reconstructIfcModel(serializedModel);
        this.BVH.applyThreeMeshBVH(model.geometry);
        this.handler.state.models[model.modelID].mesh = model;
        return model;
    }
}