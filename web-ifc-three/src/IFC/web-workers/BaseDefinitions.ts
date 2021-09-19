import { FlatMesh, IfcGeometry, LoaderError, LoaderSettings, PlacedGeometry, RawLineData, Vector } from 'web-ifc';

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