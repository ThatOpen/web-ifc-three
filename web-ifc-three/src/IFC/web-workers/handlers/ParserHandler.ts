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
            const {model, items} = await this.load();

            const ifcModel = this.serializer.reconstructIfcModel(model);
            this.BVH.applyThreeMeshBVH(ifcModel.geometry);
            this.storeIfcModel(ifcModel);
            this.handler.state.models[ifcModel.modelID].items = this.serializer.reconstructGeometriesByMaterials(items);

            return ifcModel;
        };
        return this.handler.request(this.API, WorkerActions.parse, { buffer });
    }

    getAndClearErrors(_modelId: number): void {
    }

    private async load() {
        const open = indexedDB.open("MyDatabase", 1);

        return new Promise<any>((resolve, reject) => {
            open.onsuccess = function () {
                // Start a new transaction
                const db = open.result;
                const tx = db.transaction("MyObjectStore", "readwrite");
                const store = tx.objectStore("MyObjectStore");
                // const index = store.index("NameIndex");

                // Query the data

                const model = store.get(0);
                const items = store.get(1);

                // const getJohn = store.get(12345);
                // const getBob = index.get(["Smith", "Bob"]);

                // getJohn.onsuccess = function () {
                //     console.log(getJohn.result.name.first);  // => "John"
                // };
                //
                // getBob.onsuccess = function () {
                //     console.log(getBob.result.name.first);   // => "Bob"
                // };

                // Close the db when the transaction is done
                tx.oncomplete = function () {
                    db.close();
                    delete model.result.id;
                    delete items.result.id;
                    resolve({model: model.result, items: items.result});
                };
            }
        })
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