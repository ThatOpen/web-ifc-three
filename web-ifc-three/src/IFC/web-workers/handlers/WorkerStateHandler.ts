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

    updateModelStateTypes (modelID: number) {
        const model = this.getModel(modelID);
        const types = model.types;
        return this.handler.request(this.API, WorkerActions.updateModelStateTypes, { modelID, types });
    }

    updateModelStateJsonData(modelID: number) {
        const model = this.getModel(modelID);
        const jsonData = model.jsonData;
        return this.handler.request(this.API, WorkerActions.updateModelStateTypes, { modelID, jsonData });
    }

    private getModel(modelID: number) {
        const model = this.state.models[modelID];
        if(!model) throw new Error(`The model with ID ${modelID} does not exist`);
        return model;
    }
}