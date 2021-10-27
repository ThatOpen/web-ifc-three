import { WorkerActions, WorkerAPIs } from '../BaseDefinitions';
import { IFCWorkerHandler } from '../IFCWorkerHandler';
import { IfcState } from '../../BaseDefinitions';

export class WorkerStateHandler {
    API = WorkerAPIs.workerState;
    state: IfcState;

    constructor(private handler: IFCWorkerHandler) {
        this.state = this.handler.state;
    }

    async updateStateUseJson() {
        const useJson = this.state.useJSON;
        return this.handler.request(this.API, WorkerActions.updateStateUseJson, { useJson });
    }

    async updateStateWebIfcSettings() {
        const webIfcSettings = this.state.webIfcSettings;
        return this.handler.request(this.API, WorkerActions.updateStateWebIfcSettings, { webIfcSettings });
    }

    async updateModelStateTypes (modelID: number, types: any) {
        return this.handler.request(this.API, WorkerActions.updateModelStateTypes, { modelID, types });
    }

    async updateModelStateJsonData(modelID: number, jsonData: any) {
        return this.handler.request(this.API, WorkerActions.updateModelStateJsonData, { modelID, jsonData });
    }

    async loadJsonDataFromWorker(modelID: number, path: string) {
        return this.handler.request(this.API, WorkerActions.loadJsonDataFromWorker, { modelID, path });
    }
}