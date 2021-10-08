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
        this.handler.serializeHandlers[this.handler.requestID] = async (result: ParserResult) => {
            // this.handler.closeWorker();
            this.updateState(result.modelID);
            await this.getItems(result.modelID);
            return this.getModel();
        };
        return this.handler.request(this.API, WorkerActions.parse, { buffer });
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
        const items = await this.load(1);
        this.handler.state.models[modelID].items = this.serializer.reconstructGeometriesByMaterials(items);
    }

    private async getModel() {
        const serializedModel = await this.load(0);
        const model = this.serializer.reconstructIfcModel(serializedModel);
        this.BVH.applyThreeMeshBVH(model.geometry);
        this.handler.state.models[model.modelID].mesh = model;
        return model;
    }

    private async load(id: number) {
        const open = indexedDB.open(id.toString(), 1);

        return new Promise<any>((resolve, reject) => {
            open.onsuccess = function () {
                // Start a new transaction
                const db = open.result;
                const tx = db.transaction(id.toString(), "readwrite");
                const store = tx.objectStore(id.toString());

                // Get the data
                const item = store.get(id);

                // Close the db when the transaction is done
                tx.oncomplete = function () {
                    db.close();
                    delete item.result.id;
                    resolve(item.result);
                };
            }
        })
    }
}