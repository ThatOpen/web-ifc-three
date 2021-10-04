import { ParserAPI } from '../../components/IFCParser';
import { WorkerActions, WorkerAPIs } from '../BaseDefinitions';
import { IFCWorkerHandler } from '../IFCWorkerHandler';
import { IFCModel } from '../../components/IFCModel';
import { Serializer } from '../serializer/Serializer';
import { SerializedIfcModel } from '../serializer/IFCModel';

export class ParserHandler implements ParserAPI {

    API = WorkerAPIs.parser;

    constructor(private handler: IFCWorkerHandler, private serializer: Serializer) {
    }

    async parse(buffer: any): Promise<IFCModel> {
        this.handler.serializeHandlers[this.handler.requestID] = (model: SerializedIfcModel) => {
            const ifcModel = this.serializer.reconstructIfcModel(model);
            this.storeIfcModel(ifcModel);
            return ifcModel;
        };
        return this.handler.request(this.API, WorkerActions.parse, { buffer });
    }

    getAndClearErrors(_modelId: number): void {
    }

    private storeIfcModel(ifcModel: IFCModel) {
        this.handler.state.models[ifcModel.modelID] = {
            modelID: ifcModel.modelID,
            mesh: ifcModel,
            items: {},
            types: {},
            jsonData: {}
        };
    }
}