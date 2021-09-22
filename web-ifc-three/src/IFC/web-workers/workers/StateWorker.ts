import {
    ErrorBadJson,
    ErrorBadJsonPath,
    ErrorRootStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    WorkerAPIs,
    WorkerStateAPI
} from '../BaseDefinitions';

export class StateWorker implements WorkerStateAPI {

    API = WorkerAPIs.workerState;

    constructor(private worker: IfcWorkerAPI) {
    }

    updateStateUseJson(data: IfcEventData): void {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        this.worker.state.useJSON = data.args.useJson;
        this.worker.post(data);
    }

    updateModelStateJsonData(data: IfcEventData): void {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        const model = this.getModel(data);
        model.jsonData = data.args.jsonData;
        this.worker.post(data);
    }

    updateModelStateTypes(data: IfcEventData): void {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        const model = this.getModel(data);
        model.types = data.args.types;
        this.worker.post(data);
    }

    async loadJsonDataFromWorker(data: IfcEventData): Promise<void> {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        const currentModel = this.getModel(data);
        const file = await fetch(data.args.path);
        if(!file.ok) throw new Error(ErrorBadJsonPath);
        const json = await file.json();
        if(typeof json !== 'object') throw new Error(ErrorBadJson);
        currentModel.jsonData = json;
        this.worker.post(data);
    }

    private getModel(data: IfcEventData) {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        const modelID = data.args.modelID;
        if (!this.worker.state.models[modelID]) {
            this.worker.state.models[modelID] = { modelID, mesh: {} as any, items: {}, types: {}, jsonData: {} };
        }
        return this.worker.state.models[modelID];
    }
}