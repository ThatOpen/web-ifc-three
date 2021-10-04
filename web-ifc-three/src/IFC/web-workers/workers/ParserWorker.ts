import {
    ErrorParserNotAvailable,
    ErrorRootStateNotAvailable,
    IfcEventData,
    IfcWorkerAPI,
    ParserWorkerAPI,
    WorkerAPIs
} from '../BaseDefinitions';
import { IFCParser } from '../../components/IFCParser';
import { BvhManager } from '../../components/BvhManager';
import { Serializer } from '../serializer/Serializer';

export class ParserWorker implements ParserWorkerAPI {
    parser?: IFCParser;
    API = WorkerAPIs.parser;

    constructor(private worker: IfcWorkerAPI, private serializer: Serializer, private BVH: BvhManager) {
    }

    initializeParser() {
        if (!this.parser) {
            if (!this.worker.state) throw new Error(ErrorRootStateNotAvailable);
            this.parser = new IFCParser(this.worker.state, this.BVH);
        }
    }

    async parse(data: IfcEventData): Promise<void> {
        this.initializeParser();
        if (!this.parser) throw new Error(ErrorParserNotAvailable);
        const ifcModel = await this.parser.parse(data.args.buffer);
        data.result = this.serializer.serializeIfcModel(ifcModel);
        this.worker.post(data);
    }
}