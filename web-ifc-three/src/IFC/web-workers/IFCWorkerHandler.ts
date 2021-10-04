import { IfcEventData, WorkerActions, WorkerAPIs } from './BaseDefinitions';
import { Serializer } from './serializer/Serializer';
import { PropertyHandler } from './handlers/PropertyHandler';
import { WebIfcHandler } from './handlers/WebIfcHandler';
import { IfcState } from '../BaseDefinitions';
import { WorkerStateHandler } from './handlers/WorkerStateHandler';
import { ParserHandler } from './handlers/ParserHandler';

export class IFCWorkerHandler {

    requestID = 0;
    rejectHandlers: any = {};
    resolveHandlers: any = {};
    serializeHandlers: any = {};
    callbacks: { [id: number]: { action: any, serializer: any } } = {};

    readonly workerState: WorkerStateHandler;
    readonly webIfc: WebIfcHandler;
    readonly properties: PropertyHandler;
    readonly parser: ParserHandler;

    private ifcWorker: Worker;
    private readonly serializer = new Serializer();
    private readonly workerPath: string;

    constructor(public state: IfcState) {
        this.workerPath = this.state.worker.path;
        this.ifcWorker = new Worker(this.workerPath);
        this.ifcWorker.onmessage = (data: any) => this.handleResponse(data);
        this.properties = new PropertyHandler(this);
        this.parser = new ParserHandler(this, this.serializer);
        this.webIfc = new WebIfcHandler(this, this.serializer);
        this.workerState = new WorkerStateHandler(this);
    }

    request(worker: WorkerAPIs, action: WorkerActions, args?: any) {
        const data: IfcEventData = { worker, action, args, id: this.requestID, result: undefined };

        return new Promise<any>((resolve, reject) => {
            this.resolveHandlers[this.requestID] = resolve;
            this.rejectHandlers[this.requestID] = reject;
            this.requestID++;
            this.ifcWorker.postMessage(data);
        });
    }

    async Close(): Promise<void> {
        await this.request(WorkerAPIs.webIfc, WorkerActions.Close);
    }

    private handleResponse(event: MessageEvent) {
        const data = event.data as IfcEventData;
        const id = data.id;

        try {
            this.resolveSerializations(data);
            this.resolveCallbacks(data);
            this.resolveHandlers[id](data.result);

        } catch (error) {
            this.rejectHandlers[id](data.result);
        }
        delete this.resolveHandlers[id];
        delete this.rejectHandlers[id];
    }

    private resolveSerializations(data: IfcEventData) {
        const id = data.id;
        if (this.serializeHandlers[id]) {
            data.result = this.serializeHandlers[id](data.result);
            delete this.serializeHandlers[id];
        }
    }

    private resolveCallbacks(data: IfcEventData) {
        const id = data.id;
        if (this.callbacks[id]) {
            let callbackParameter = data.result;
            if (this.callbacks[id].serializer) {
                callbackParameter = this.callbacks[id].serializer(data.result);
            }
            this.callbacks[id].action(callbackParameter);
            delete this.callbacks[id];
        }
    }
}