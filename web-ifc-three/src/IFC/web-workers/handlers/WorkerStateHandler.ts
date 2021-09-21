import { WorkerActions, WorkerAPIs } from '../BaseDefinitions';
import { IFCWorkerHandler } from '../IFCWorkerHandler';
import { IfcState } from '../../BaseDefinitions';

export class WorkerStateHandler {
    API = WorkerAPIs.workerState;
    state: IfcState;

    constructor(private handler: IFCWorkerHandler) {
        this.state = this.handler.state;
    }

    updateStateUseJson() {
        const useJson = this.state.useJSON;
        return this.handler.request(this.API, WorkerActions.updateStateUseJson, { useJson });
    }

    updateModelStateTypes (modelID: number, types: any) {
        return this.handler.request(this.API, WorkerActions.updateModelStateTypes, { modelID, types });
    }

    updateModelStateJsonData(modelID: number, jsonData: any) {
        return this.handler.request(this.API, WorkerActions.updateModelStateJsonData, { modelID, jsonData });
    }

    loadJsonDataFromWorker(modelID: number, path: string) {
        return this.handler.request(this.API, WorkerActions.loadJsonDataFromWorker, { modelID, path });
    }
}