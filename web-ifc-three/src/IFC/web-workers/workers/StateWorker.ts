import {
    ErrorBadJson,
    ErrorBadJsonPath,
    ErrorRootStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    WorkerAPIs,
    WorkerStateAPI
} from '../BaseDefinitions';
import { MemoryCleaner } from '../../components/MemoryCleaner';

export class StateWorker implements WorkerStateAPI {

    API = WorkerAPIs.workerState;
    private cleaner?: MemoryCleaner;

    constructor(private worker: IfcWorkerAPI) {
    }

    updateStateUseJson(data: IfcEventData): void {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        this.worker.state.useJSON = data.args.useJson;
        this.worker.post(data);
    }

    updateStateWebIfcSettings(data: IfcEventData): void {
        if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
        this.worker.state.webIfcSettings = data.args.webIfcSettings;
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

    async dispose(data: IfcEventData): Promise<void> {
        if(!this.worker.state) throw new Error("Error: no state was found in the worker");
        if(!this.cleaner) this.cleaner = new MemoryCleaner(this.worker.state)
        await this.cleaner!.dispose();
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
            this.worker.state.models[modelID] = { modelID, mesh: {} as any, types: {}, jsonData: {} };
        }
        return this.worker.state.models[modelID];
    }
}