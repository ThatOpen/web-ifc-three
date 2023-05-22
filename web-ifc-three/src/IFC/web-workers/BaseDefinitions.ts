import { IfcState, WebIfcAPI } from '../BaseDefinitions';

export interface IfcWorkerAPI {
    post: (data: any) => void;
    initializeAPI: (api: WebIfcAPI) => void;
    state?: IfcState;
    postCallback: (data: any, result: any, serializer?: any) => void;
}

export enum WorkerActions {
    // Worker State Actions
    updateStateUseJson = 'updateStateUseJson',
    updateStateWebIfcSettings = 'updateStateWebIfcSettings',
    updateModelStateTypes = 'updateModelStateTypes',
    updateModelStateJsonData = 'updateModelStateJsonData',
    loadJsonDataFromWorker = 'loadJsonDataFromWorker',
    dispose = 'dispose',

    // WebIFC Actions
    Close = 'Close',
    DisposeWebIfc = 'DisposeWebIfc',
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
    SetWasmPath = 'SetWasmPath',
    GetNameFromTypeCode = 'GetNameFromTypeCode',
    GetIfcEntityList = 'GetIfcEntityList',
    GetTypeCodeFromName ='GetTypeCodeFromName',

    // Parser
    parse = 'parse',
    setupOptionalCategories = 'setupOptionalCategories',

    // Properties
    getExpressId = 'getExpressId',
    initializeProperties = 'initializeProperties',
    getAllItemsOfType = 'getAllItemsOfType',
    getItemProperties = 'getItemProperties',
    getMaterialsProperties = 'getMaterialsProperties',
    getPropertySets = 'getPropertySets',
    getSpatialStructure = 'getSpatialStructure',
    getTypeProperties = 'getTypeProperties',
    getHeaderLine = 'getHeaderLine',
}

export enum WorkerAPIs {
    workerState = 'workerState',
    webIfc = 'webIfc',
    properties = 'properties',
    parser = 'parser',
}

export interface IfcEventData {
    worker: WorkerAPIs;
    action: WorkerActions;
    args: any;
    id: number;
    result: any;
    onProgress: boolean;
}

export interface RootWorker {
    [WorkerAPIs.workerState]: WorkerStateAPI;
    [WorkerAPIs.webIfc]: WebIfcWorkerAPI;
    [WorkerAPIs.properties]: PropertyWorkerAPI;
}

export interface BaseWorkerAPI {
    API: WorkerAPIs;
}

export type IfcWorkerEventHandler = (data: IfcEventData) => void;

export interface WorkerStateAPI extends BaseWorkerAPI {
    [WorkerActions.updateStateUseJson]: IfcWorkerEventHandler;
    [WorkerActions.updateStateWebIfcSettings]: IfcWorkerEventHandler;
    [WorkerActions.updateModelStateTypes]: IfcWorkerEventHandler;
    [WorkerActions.updateModelStateJsonData]: IfcWorkerEventHandler;
    [WorkerActions.loadJsonDataFromWorker]: IfcWorkerEventHandler;
    [WorkerActions.dispose]: IfcWorkerEventHandler;
}

export interface PropertyWorkerAPI extends BaseWorkerAPI {
    [WorkerActions.getAllItemsOfType]: IfcWorkerEventHandler;
    [WorkerActions.getItemProperties]: IfcWorkerEventHandler;
    [WorkerActions.getMaterialsProperties]: IfcWorkerEventHandler;
    [WorkerActions.getPropertySets]: IfcWorkerEventHandler;
    [WorkerActions.getSpatialStructure]: IfcWorkerEventHandler;
    [WorkerActions.getTypeProperties]: IfcWorkerEventHandler;
}

export interface ParserWorkerAPI extends BaseWorkerAPI {
    [WorkerActions.parse]: IfcWorkerEventHandler;
    [WorkerActions.setupOptionalCategories]: IfcWorkerEventHandler;
}

export interface WebIfcWorkerAPI extends BaseWorkerAPI {
    [WorkerActions.Init]: IfcWorkerEventHandler;
    [WorkerActions.Close]: IfcWorkerEventHandler;
    [WorkerActions.DisposeWebIfc]: IfcWorkerEventHandler;
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
    [WorkerActions.GetNameFromTypeCode]: IfcWorkerEventHandler;
    [WorkerActions.GetIfcEntityList]: IfcWorkerEventHandler;
    [WorkerActions.GetTypeCodeFromName]: IfcWorkerEventHandler;
}

export interface SerializedVector {
    [key: number]: any;

    size: number;
}

export interface SerializedIfcGeometry {
    GetVertexData: number;
    GetVertexDataSize: number;
    GetIndexData: number;
    GetIndexDataSize: number;
}

export interface SerializedFlatMesh {
    geometries: SerializedVector;
    expressID: number;
}

export const ErrorStateNotAvailable = 'The state of the worker does not exist';
export const ErrorRootStateNotAvailable = 'The root worker does not have any state';
export const ErrorPropertiesNotAvailable = 'Error: Properties not available from web worker';
export const ErrorParserNotAvailable = 'Error: Parser not available from web worker';
export const ErrorBadJsonPath = 'Error: Model not available from web worker';
export const ErrorBadJson = 'Error: The given Json could not be read as a JS object';