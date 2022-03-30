import { IfcEventData, WorkerActions, WorkerAPIs } from './BaseDefinitions';
import { Serializer } from './serializer/Serializer';
import { PropertyHandler } from './handlers/PropertyHandler';
import { WebIfcHandler } from './handlers/WebIfcHandler';
import { IfcState } from '../BaseDefinitions';
import { WorkerStateHandler } from './handlers/WorkerStateHandler';
import { ParserHandler } from './handlers/ParserHandler';
import { BvhManager } from '../components/BvhManager';
import { IndexedDatabase } from '../indexedDB/IndexedDatabase';

export class IFCWorkerHandler {

    requestID = 0;
    rejectHandlers: any = {};
    resolveHandlers: any = {};
    serializeHandlers: any = {};
    callbackHandlers: { [id: number]: { action: any, serializer: any } } = {};
    onprogressHandlers: any = {};

    readonly IDB: IndexedDatabase;
    readonly workerState: WorkerStateHandler;
    readonly webIfc: WebIfcHandler;
    readonly properties: PropertyHandler;
    readonly parser: ParserHandler;

    private ifcWorker: Worker;
    private readonly serializer = new Serializer();
    private readonly workerPath: string;

    constructor(public state: IfcState, private BVH: BvhManager) {
        this.IDB = new IndexedDatabase();
        this.workerPath = this.state.worker.path;
        this.ifcWorker = new Worker(this.workerPath);
        this.ifcWorker.onmessage = (data: any) => this.handleResponse(data);
        this.properties = new PropertyHandler(this);
        this.parser = new ParserHandler(this, this.serializer, this.BVH, this.IDB);
        this.webIfc = new WebIfcHandler(this, this.serializer);
        this.workerState = new WorkerStateHandler(this);
    }

    request(worker: WorkerAPIs, action: WorkerActions, args?: any) {
        const data: IfcEventData = {worker, action, args, id: this.requestID, result: undefined, onProgress: false};

        return new Promise<any>((resolve, reject) => {
            this.resolveHandlers[this.requestID] = resolve;
            this.rejectHandlers[this.requestID] = reject;
            this.requestID++;
            this.ifcWorker.postMessage(data);
        });
    }

    async terminate() {
        await this.request(WorkerAPIs.workerState, WorkerActions.dispose);
        await this.request(WorkerAPIs.webIfc, WorkerActions.DisposeWebIfc);
        this.ifcWorker.terminate();
    }

    async Close(): Promise<void> {
        await this.request(WorkerAPIs.webIfc, WorkerActions.Close);
    }

    private handleResponse(event: MessageEvent) {
        const data = event.data as IfcEventData;
        if (data.onProgress) {
            this.resolveOnProgress(data);
            return;
        }
        this.callHandlers(data);
        delete this.resolveHandlers[data.id];
        delete this.rejectHandlers[data.id];
        delete this.onprogressHandlers[data.id];
    }

    private callHandlers(data: IfcEventData) {
        try {
            this.resolveSerializations(data);
            this.resolveCallbacks(data);
            this.resolveHandlers[data.id](data.result);
        } catch (error) {
            this.rejectHandlers[data.id](error);
        }
    }

    private resolveOnProgress(data: IfcEventData) {
        if (this.onprogressHandlers[data.id]) {
            data.result = this.onprogressHandlers[data.id](data.result);
        }
    }

    private resolveSerializations(data: IfcEventData) {
        if (this.serializeHandlers[data.id]) {
            data.result = this.serializeHandlers[data.id](data.result);
            delete this.serializeHandlers[data.id];
        }
    }

    private resolveCallbacks(data: IfcEventData) {
        if (this.callbackHandlers[data.id]) {
            let callbackParameter = data.result;
            if (this.callbackHandlers[data.id].serializer) {
                callbackParameter = this.callbackHandlers[data.id].serializer(data.result);
            }
            this.callbackHandlers[data.id].action(callbackParameter);
        }
    }
}