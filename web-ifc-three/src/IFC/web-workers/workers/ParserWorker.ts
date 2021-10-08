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
    model: SerializedMesh;
    items: SerializedGeomsByMaterials;
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
        data.result = {mesh: {}, items: {}};
        const serializedIfcModel = this.serializer.serializeIfcModel(ifcModel);

        const items = this.worker.state?.models[ifcModel.modelID].items;
        const serializedItems = this.serializer.serializeGeometriesByMaterials(items);
        this.worker.state.models[ifcModel.modelID].items = {};

        await this.save(serializedIfcModel, serializedItems);

        this.worker.post(data);
    }

    private save(model: SerializedMesh, items: SerializedGeomsByMaterials) {

        // Open (or create) the database
        const open = indexedDB.open("MyDatabase", 1);

        // Create the schema
        open.onupgradeneeded = function () {
            const db = open.result;
            db.createObjectStore("IfcModelStore", {keyPath: "id"});
        };

        return new Promise<any>((resolve, reject) => {
            open.onsuccess = function () {
                // Start a new transaction
                const db = open.result;
                const tx = db.transaction("MyObjectStore", "readwrite");
                const store = tx.objectStore("MyObjectStore");
                // const index = store.index("NameIndex");

                // Add some data
                // @ts-ignore
                model.id = 0;
                store.put(model);

                // @ts-ignore
                items.id = 1;
                store.put(items);

                // store.put({id: 12345, name: {first: "John", last: "Doe"}, age: 42});
                // store.put({id: 67890, name: {first: "Bob", last: "Smith"}, age: 35});

                // // Query the data
                // const getJohn = store.get(12345);
                // const getBob = index.get(["Smith", "Bob"]);
                //
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
                    resolve("success");
                };
            }
        });


    }
}