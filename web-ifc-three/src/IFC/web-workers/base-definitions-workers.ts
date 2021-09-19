import { FlatMesh, IfcGeometry, LoaderError, LoaderSettings, RawLineData, Vector } from 'web-ifc';

export enum WorkerActions {
    Close = 'Close',
    Init = 'Init',
    OpenModel = 'OpenModel',
    CreateModel = 'CreateModel',
    ExportFileAsIFC = 'ExportFileAsIFC',
    GetGeometry = 'GetGeometry',
    GetLine = 'GetLine',
    GetAndClearErrors = 'GetAndClearErrors',
    WriteLine = 'WriteLine',
    FlattenLine = 'FlattenLine',
    GetRawLineData = 'GetRawLineData',
    WriteRawLineData = 'WriteRawLineData',
    GetLineIDsWithType = 'GetLineIDsWithType',
    GetAllLines = 'GetAllLines',
    SetGeometryTransformation = 'SetGeometryTransformation',
    GetCoordinationMatrix = 'GetCoordinationMatrix',
    GetVertexArray = 'GetVertexArray',
    GetIndexArray = 'GetIndexArray',
    getSubArray = 'getSubArray',
    CloseModel = 'CloseModel',
    StreamAllMeshes = 'StreamAllMeshes',
    StreamAllMeshesWithTypes = 'StreamAllMeshesWithTypes',
    IsModelOpen = 'IsModelOpen',
    LoadAllGeometry = 'LoadAllGeometry',
    GetFlatMesh = 'GetFlatMesh',
    SetWasmPath = 'SetWasmPath'
}

export interface IfcEventData {
    action: WorkerActions;
    args: any;
    id: number;
    result: any;
}

export type IfcWorkerEventHandler = (data: IfcEventData) => void;

export interface WebIfcWorker {
    [WorkerActions.Init]: IfcWorkerEventHandler;
    [WorkerActions.Close]: IfcWorkerEventHandler;
    [WorkerActions.OpenModel]: IfcWorkerEventHandler;
    [WorkerActions.CreateModel]: IfcWorkerEventHandler;
    [WorkerActions.ExportFileAsIFC]: IfcWorkerEventHandler;
    [WorkerActions.GetGeometry]: IfcWorkerEventHandler;
    [WorkerActions.GetLine]: IfcWorkerEventHandler;
    [WorkerActions.GetAndClearErrors]: IfcWorkerEventHandler;
    [WorkerActions.WriteLine]: IfcWorkerEventHandler;
    [WorkerActions.FlattenLine]: IfcWorkerEventHandler;
    [WorkerActions.GetRawLineData]: IfcWorkerEventHandler;
    [WorkerActions.WriteRawLineData]: IfcWorkerEventHandler;
    [WorkerActions.GetLineIDsWithType]: IfcWorkerEventHandler;
    [WorkerActions.GetAllLines]: IfcWorkerEventHandler;
    [WorkerActions.SetGeometryTransformation]: IfcWorkerEventHandler;
    [WorkerActions.GetCoordinationMatrix]: IfcWorkerEventHandler;
    [WorkerActions.GetVertexArray]: IfcWorkerEventHandler;
    [WorkerActions.GetIndexArray]: IfcWorkerEventHandler;
    [WorkerActions.getSubArray]: IfcWorkerEventHandler;
    [WorkerActions.CloseModel]: IfcWorkerEventHandler;
    [WorkerActions.StreamAllMeshes]: IfcWorkerEventHandler;
    [WorkerActions.StreamAllMeshesWithTypes]: IfcWorkerEventHandler;
    [WorkerActions.IsModelOpen]: IfcWorkerEventHandler;
    [WorkerActions.LoadAllGeometry]: IfcWorkerEventHandler;
    [WorkerActions.GetFlatMesh]: IfcWorkerEventHandler;
    [WorkerActions.SetWasmPath]: IfcWorkerEventHandler;

}

export interface WebIfcAPI {
    Init(): void | Promise<void>;

    /**
     * Opens a model and returns a modelID number
     * @data Buffer containing IFC data (bytes)
     * @data Settings settings for loading the model
     */
    OpenModel(data: string | Uint8Array, settings?: LoaderSettings): number | Promise<number>;

    /**
     * Creates a new model and returns a modelID number
     * @data Settings settings for generating data the model
     */
    CreateModel(settings?: LoaderSettings): number | Promise<number>;

    ExportFileAsIFC(modelID: number): Uint8Array | Promise<Uint8Array>;

    /**
     * Opens a model and returns a modelID number
     * @modelID Model handle retrieved by OpenModel, model must not be closed
     * @data Buffer containing IFC data (bytes)
     */
    GetGeometry(modelID: number, geometryExpressID: number): IfcGeometry | Promise<IfcGeometry>;

    GetLine(modelID: number, expressID: number, flatten?: boolean): any;

    GetAndClearErrors(modelID: number): Vector<LoaderError> | Promise<Vector<LoaderError>>;

    WriteLine(modelID: number, lineObject: any): void | Promise<void>;

    FlattenLine(modelID: number, line: any): void | Promise<void>;

    GetRawLineData(modelID: number, expressID: number): RawLineData | Promise<RawLineData>;

    WriteRawLineData(modelID: number, data: RawLineData): any;

    GetLineIDsWithType(modelID: number, type: number): Vector<number> | Promise<Vector<number>>;

    GetAllLines(modelID: Number): Vector<number> | Promise<Vector<number>>;

    SetGeometryTransformation(modelID: number, transformationMatrix: Array<number>): void | Promise<void>;

    GetCoordinationMatrix(modelID: number): Array<number> | Promise<Array<number>>;

    GetVertexArray(ptr: number, size: number): Float32Array | Promise<Float32Array>;

    GetIndexArray(ptr: number, size: number): Uint32Array | Promise<Uint32Array>;

    getSubArray(heap: any, startPtr: any, sizeBytes: any): any;

    /**
     * Closes a model and frees all related memory
     * @modelID Model handle retrieved by OpenModel, model must not be closed
     */
    CloseModel(modelID: number): void | Promise<void>;

    StreamAllMeshes(modelID: number, meshCallback: (mesh: FlatMesh) => void): void | Promise<void>;

    StreamAllMeshesWithTypes(modelID: number, types: Array<number>, meshCallback: (mesh: FlatMesh) => void): void | Promise<void>;

    /**
     * Checks if a specific model ID is open or closed
     * @modelID Model handle retrieved by OpenModel
     */
    IsModelOpen(modelID: number): boolean | Promise<boolean>;

    /**
     * Load all geometry in a model
     * @modelID Model handle retrieved by OpenModel
     */
    LoadAllGeometry(modelID: number): Vector<FlatMesh> | Promise<Vector<FlatMesh>>;

    /**
     * Load geometry for a single element
     * @modelID Model handle retrieved by OpenModel
     */
    GetFlatMesh(modelID: number, expressID: number): FlatMesh | Promise<FlatMesh>;

    SetWasmPath(path: string): void;
}