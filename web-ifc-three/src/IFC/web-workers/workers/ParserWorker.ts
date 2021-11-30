import {
    ErrorParserNotAvailable,
    ErrorRootStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    ParserWorkerAPI,
    WorkerAPIs
} from '../BaseDefinitions';
import { IFCParser, ParserProgress } from '../../components/IFCParser';
import { Serializer } from '../serializer/Serializer';
import { DBOperation, IndexedDatabase } from '../../indexedDB/IndexedDatabase';
import { IFCModel } from '../../components/IFCModel';

export interface ParserResult {
    modelID: number;
}

export class ParserWorker implements ParserWorkerAPI {
    parser?: IFCParser;
    API = WorkerAPIs.parser;

    constructor(private worker: IfcWorkerAPI,
                private serializer: Serializer,
                // private BVH: BvhManager,
                private IDB: IndexedDatabase) {
    }

    initializeParser() {
        if (!this.parser) {
            if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
            this.parser = new IFCParser(this.worker.state);
        }
    }

    setupOptionalCategories(data: IfcEventData): void {
        this.initializeParser();
        if(this.parser === undefined) throw new Error(ErrorParserNotAvailable);
        this.parser.setupOptionalCategories(data.args.config);
        this.worker.post(data);
    }

    async parse(data: IfcEventData): Promise<void> {
        this.initializeParser();
        if(this.parser === undefined) throw new Error(ErrorParserNotAvailable);
        if(this.worker.state) this.worker.state.onProgress = (event: ParserProgress) => this.onProgress(event, data);
        const serializedIfcModel = await this.getResponse(data);
        await this.IDB.save(serializedIfcModel, DBOperation.transferIfcModel);
        this.worker.post(data);
    }

    private onProgress(event: ParserProgress, data: IfcEventData) {
        this.worker.post({...data, onProgress: true, result: event});
    }

    private async getResponse(data: IfcEventData) {
        if (!this.parser) throw new Error(ErrorParserNotAvailable);
        const ifcModel = await this.parser.parse(data.args.buffer, data.args.coordinationMatrix);
        const serializedIfcModel = this.serializer.serializeIfcModel(ifcModel);
        this.cleanUpGeometries(ifcModel);
        data.result = {modelID: ifcModel.modelID};
        return serializedIfcModel;
    }

    private cleanUpGeometries(model: IFCModel) {
        model.geometry.dispose();
        if(Array.isArray(model.material)) model.material.forEach(mat => mat.dispose());
        else model.material.dispose();
    }
}