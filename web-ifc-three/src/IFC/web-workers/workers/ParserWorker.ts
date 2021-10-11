import {
    ErrorParserNotAvailable,
    ErrorRootStateNotAvailable, ErrorStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    ParserWorkerAPI,
    WorkerAPIs
} from '../BaseDefinitions';
import {IFCParser} from '../../components/IFCParser';
import {BvhManager} from '../../components/BvhManager';
import {Serializer} from '../serializer/Serializer';
import {IdGeometries} from "../../BaseDefinitions";
import {IFCModel} from "../../components/IFCModel";

export interface ParserResult {
    modelID: number;
}

export class ParserWorker implements ParserWorkerAPI {
    parser?: IFCParser;
    API = WorkerAPIs.parser;

    constructor(private worker: IfcWorkerAPI, private serializer: Serializer, private BVH: BvhManager) {
    }

    initializeParser() {
        if (!this.parser) {
            if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
            this.parser = new IFCParser(this.worker.state, this.BVH);
        }
    }

    async parse(data: IfcEventData): Promise<void> {
        this.initializeParser();
        const {serializedIfcModel, serializedItems} = await this.getResponse(data);
        await this.save(serializedIfcModel, 0);
        await this.save(serializedItems, 1);
        this.worker.post(data);
    }

    private async getResponse(data: IfcEventData) {
        if (!this.parser) throw new Error(ErrorParserNotAvailable);
        const ifcModel = await this.parser.parse(data.args.buffer);
        const serializedIfcModel = this.serializer.serializeIfcModel(ifcModel);
        data.result = {modelID: ifcModel.modelID};
        const serializedItems = this.getSerializedItems(ifcModel);
        return {serializedIfcModel, serializedItems};
    }

    private getSerializedItems(ifcModel: IFCModel) {
        const items = this.worker.state?.models[ifcModel.modelID].items;
        if(items === undefined) throw new Error("Items are not defined in worker");
        if (!this.worker.state) throw new Error(ErrorStateNotAvailable);
        const serializedItems = this.serializer.serializeGeometriesByMaterials(items);
        this.cleanUp(ifcModel.modelID);
        this.worker.state.models[ifcModel.modelID].items = {};
        return serializedItems;
    }

    private cleanUp(modelID: number) {
        const items = this.worker.state?.models[modelID].items;
        if(!items) return;
        Object.keys(items).forEach(matID => {
            items[matID].material.dispose();
            // @ts-ignore
            delete items[matID].material;
            this.cleanUpGeometries(items[matID].geometries);
            // @ts-ignore
            delete items[matID].geometries;
        })
    }

    private cleanUpGeometries(geometries: IdGeometries) {
        Object.keys(geometries).map(key => parseInt(key)).forEach(id => {
            geometries[id].dispose();
            delete geometries[id];
        });
    }

    private save(item: any, id: number) {

        // Open (or create) the database
        const open = indexedDB.open(id.toString(), 1);

        // Create the schema
        open.onupgradeneeded = function () {
            const db = open.result;
            db.createObjectStore(id.toString(), {keyPath: "id"});
        };

        return new Promise<any>((resolve, reject) => {
            open.onsuccess = function () {
                // Start a new transaction
                const db = open.result;
                const tx = db.transaction(id.toString(), "readwrite");
                const store = tx.objectStore(id.toString());

                // Save data
                item.id = id;
                store.put(item);

                // Close the db when the transaction is done
                tx.oncomplete = function () {
                    db.close();
                    resolve("success");
                };
            }
        });
    }
}