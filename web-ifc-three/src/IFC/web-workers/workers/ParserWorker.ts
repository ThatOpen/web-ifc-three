import {
    ErrorParserNotAvailable,
    ErrorRootStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    ParserWorkerAPI,
    WorkerAPIs
} from '../BaseDefinitions';
import {IFCParser} from '../../components/IFCParser';
import {BvhManager} from '../../components/BvhManager';
import {Serializer} from '../serializer/Serializer';
import {SerializedMesh} from '../serializer/Mesh';
import {SerializedGeomsByMaterials} from '../serializer/GeomsByMaterials';

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
        if (!this.worker.state) throw new Error("State does not exist in worker.");
        this.initializeParser();
        if (!this.parser) throw new Error(ErrorParserNotAvailable);
        const ifcModel = await this.parser.parse(data.args.buffer);
        const serializedIfcModel = this.serializer.serializeIfcModel(ifcModel);
        data.result = {modelID: ifcModel.modelID};

        const items = this.worker.state?.models[ifcModel.modelID].items;
        const serializedItems = this.serializer.serializeGeometriesByMaterials(items);
        this.worker.state.models[ifcModel.modelID].items = {};

        await this.save(serializedIfcModel, 0);
        await this.save(serializedItems, 1);

        this.worker.post(data);
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