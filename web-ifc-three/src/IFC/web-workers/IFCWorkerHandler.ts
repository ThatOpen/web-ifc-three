import { LoaderSettings, IfcGeometry, Vector, LoaderError, RawLineData, FlatMesh } from 'web-ifc';
import {
    IfcEventData,
    SerializedFlatMesh,
    SerializedIfcGeometry,
    SerializedVector,
    WorkerActions
} from './BaseDefinitions';
import { WebIfcAPI } from '../BaseDefinitions';
import { Serializer } from './serializer/Serializer';

export class IFCWorkerHandler implements WebIfcAPI {
    private readonly serializer = new Serializer();
    private readonly workerPath: string;
    private ifcWorker: Worker;
    private requestID = 0;

    private rejectHandlers: any = {};
    private resolveHandlers: any = {};
    private serializeHandlers: any = {};
    private callbacks: { [id: number]: { action: any, serializer: any } } = {};

    wasmModule: any;

    constructor(path: string) {
        this.workerPath = path;
        this.ifcWorker = new Worker(this.workerPath);
        this.ifcWorker.onmessage = (data: any) => this.handleResponse(data);
    }

    async Init(): Promise<void> {
        this.wasmModule = true;
        return this.request(WorkerActions.Init);
    }

    async Close(): Promise<void> {
        await this.request(WorkerActions.Close);
        this.ifcWorker.terminate();
    }

    async OpenModel(data: string | Uint8Array, settings?: LoaderSettings): Promise<number> {
        return this.request(WorkerActions.OpenModel, { data, settings });
    }

    async CreateModel(settings?: LoaderSettings): Promise<number> {
        return this.request(WorkerActions.CreateModel, { settings });
    }

    async ExportFileAsIFC(modelID: number): Promise<Uint8Array> {
        return this.request(WorkerActions.ExportFileAsIFC, { modelID });
    }

    async GetGeometry(modelID: number, geometryExpressID: number): Promise<IfcGeometry> {
        this.serializeHandlers[this.requestID] = (geom: SerializedIfcGeometry) => this.serializer.reconstructIfcGeometry(geom);
        return this.request(WorkerActions.GetGeometry, { modelID, geometryExpressID });
    }

    async GetLine(modelID: number, expressID: number, flatten?: boolean): Promise<any> {
        return this.request(WorkerActions.GetLine, { modelID, expressID, flatten });
    }

    async GetAndClearErrors(modelID: number): Promise<Vector<LoaderError>> {
        this.serializeHandlers[this.requestID] = (vector: SerializedVector) => this.serializer.reconstructVector(vector);
        return this.request(WorkerActions.GetAndClearErrors, { modelID });
    }

    async WriteLine(modelID: number, lineObject: any): Promise<void> {
        return this.request(WorkerActions.WriteLine, { modelID, lineObject });
    }

    async FlattenLine(modelID: number, line: any): Promise<void> {
        return this.request(WorkerActions.FlattenLine, { modelID, line });
    }

    async GetRawLineData(modelID: number, expressID: number): Promise<RawLineData> {
        return this.request(WorkerActions.GetRawLineData, { modelID, expressID });
    }

    async WriteRawLineData(modelID: number, data: RawLineData): Promise<any> {
        return this.request(WorkerActions.WriteRawLineData, { modelID, data });
    }

    async GetLineIDsWithType(modelID: number, type: number): Promise<Vector<number>> {
        this.serializeHandlers[this.requestID] = (vector: SerializedVector) => this.serializer.reconstructVector(vector);
        return this.request(WorkerActions.GetLineIDsWithType, { modelID, type });
    }

    async GetAllLines(modelID: number): Promise<Vector<number>> {
        this.serializeHandlers[this.requestID] = (vector: SerializedVector) => this.serializer.reconstructVector(vector);
        return this.request(WorkerActions.GetAllLines, { modelID });
    }

    async SetGeometryTransformation(modelID: number, transformationMatrix: number[]): Promise<void> {
        return this.request(WorkerActions.SetGeometryTransformation, { modelID, transformationMatrix });
    }

    async GetCoordinationMatrix(modelID: number): Promise<number[]> {
        return this.request(WorkerActions.GetCoordinationMatrix, { modelID });
    }

    async GetVertexArray(ptr: number, size: number): Promise<Float32Array> {
        return this.request(WorkerActions.GetVertexArray, { ptr, size });
    }

    async GetIndexArray(ptr: number, size: number): Promise<Uint32Array> {
        return this.request(WorkerActions.GetIndexArray, { ptr, size });
    }

    async getSubArray(heap: any, startPtr: any, sizeBytes: any): Promise<any> {
        return this.request(WorkerActions.getSubArray, { heap, startPtr, sizeBytes });
    }

    async CloseModel(modelID: number): Promise<void> {
        return this.request(WorkerActions.CloseModel, { modelID });
    }

    async StreamAllMeshes(modelID: number, meshCallback: (mesh: FlatMesh) => void): Promise<void> {
        this.callbacks[this.requestID] = { action: meshCallback, serializer: this.serializer.reconstructFlatMesh };
        return this.request(WorkerActions.StreamAllMeshes, { modelID });
    }

    async StreamAllMeshesWithTypes(modelID: number, types: number[], meshCallback: (mesh: FlatMesh) => void): Promise<void> {
        this.callbacks[this.requestID] = { action: meshCallback, serializer: this.serializer.reconstructFlatMesh };
        return this.request(WorkerActions.StreamAllMeshesWithTypes, { modelID, types });
    }

    async IsModelOpen(modelID: number): Promise<boolean> {
        return this.request(WorkerActions.IsModelOpen, { modelID });
    }

    async LoadAllGeometry(modelID: number): Promise<Vector<FlatMesh>> {
        this.serializeHandlers[this.requestID] = (vector: SerializedVector) => this.serializer.reconstructFlatMeshVector(vector);
        return this.request(WorkerActions.LoadAllGeometry, { modelID });
    }

    async GetFlatMesh(modelID: number, expressID: number): Promise<FlatMesh> {
        this.serializeHandlers[this.requestID] = (flatMesh: SerializedFlatMesh) => this.serializer.reconstructFlatMesh(flatMesh);
        return this.request(WorkerActions.GetFlatMesh, { modelID, expressID });
    }

    async SetWasmPath(path: string): Promise<void> {
        return this.request(WorkerActions.SetWasmPath, { path });
    }


    private request(action: WorkerActions, args?: any) {
        const data: IfcEventData = { action, args, id: this.requestID, result: undefined };

        return new Promise<any>((resolve, reject) => {
            this.resolveHandlers[this.requestID] = resolve;
            this.rejectHandlers[this.requestID] = reject;
            this.requestID++;
            this.ifcWorker.postMessage(data);
        });
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