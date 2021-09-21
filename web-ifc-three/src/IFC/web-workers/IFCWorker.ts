import {
    IfcEventData,
    PropertyWorkerAPI,
    RootWorker,
    WebIfcWorkerAPI,
    WorkerActions,
    WorkerAPIs,
    WorkerStateAPI
} from './BaseDefinitions';
import { Serializer } from './serializer/Serializer';
import { WebIfcWorker } from './workers/WebIfcWorker';
import { IfcState, WebIfcAPI } from '../BaseDefinitions';
import { PropertyWorker } from './workers/PropertyWorker';
import { StateWorker } from './workers/StateWorker';

class IFCWorker implements RootWorker {
    private readonly serializer = new Serializer();

    workerState: WorkerStateAPI;
    webIfc: WebIfcWorkerAPI;
    properties: PropertyWorkerAPI;
    state?: IfcState;

    constructor() {
        this.workerState = new StateWorker(this);
        this.webIfc = new WebIfcWorker(this, this.serializer);
        this.properties = new PropertyWorker(this);
    }

    initializeAPI(api: WebIfcAPI) {
        this.state = {
            models: [],
            api,
            useJSON: false,
            worker: { active: false, path: '' }
        };
    }

    post(data: any) {
        // @ts-ignore
        self.postMessage(data);
    }

    postCallback(data: any, result: any, serializer?: any) {
        data.result = serializer ? serializer(result) : result;
        this.post(data);
    }
}

const ifcWorker = new IFCWorker();

self.onmessage = async (event: MessageEvent) => {
    const data = event.data as IfcEventData;
    const { worker, action } = data;
    checkRequestIsValid(worker, action);
    const requestedWorker = ifcWorker[worker] as any;
    requestedWorker[action](data);
};

function checkRequestIsValid(worker: WorkerAPIs, action: WorkerActions) {
    if (!ifcWorker[worker]) {
        throw new Error(`The worker ${worker} does not exist.`);
    }

    const requestedWorker = ifcWorker[worker] as any;

    if (!requestedWorker[action]) {
        throw new Error(`The action ${action} does not exist in the worker ${worker}.`);
    }
}